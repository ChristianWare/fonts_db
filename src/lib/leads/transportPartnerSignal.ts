// Cheap, shared detection of whether a cold-lead account already has a
// transportation / limo / chauffeur partner — so we can offer an "open
// accounts only" filter WITHOUT an AI call per result.
//
// Detection is regex over the account's website text (no LLM). Results are
// cached in PlaceTransportSignal, keyed by googlePlaceId and shared across ALL
// users, so each place is fetched at most once per TTL no matter how many
// operators surface it.
//
// Precision bias: we only set hasPartner = true on strong, unambiguous phrases.
// A false positive wrongly HIDES a good open account from the filter, which is
// worse than occasionally showing a partnered one — so when the signal is weak
// we leave it "open."

import { db } from "@/lib/db";

const FETCH_TIMEOUT_MS = 8000;
const SIGNAL_TTL_DAYS = 30;
const BACKFILL_CONCURRENCY = 5;
const BACKFILL_MAX_PER_RUN = 40;

export type PartnerSignal = {
  hasPartner: boolean | null; // null = unknown (couldn't read the site)
  evidence: string | null;
};

// Strong phrases that reliably indicate an EXISTING transportation partner.
// Deliberately tight for precision.
const PARTNER_PATTERNS: RegExp[] = [
  /transportation\s+(is\s+)?provided\s+by/i,
  /(preferred|official|exclusive|recommended)\s+(transportation|limousine|limo|chauffeur|car\s+service)/i,
  /(transportation|limousine|chauffeur)\s+partner/i,
  /our\s+(transportation|limousine|chauffeur|car\s+service)\s+(partner|provider)/i,
  /complimentary\s+(shuttle|transportation|car\s+service)/i,
  /(in[- ]house|on[- ]site)\s+(shuttle|transportation|limousine)/i,
  /preferred\s+vendors?[\s\S]{0,120}(transportation|limousine|limo|chauffeur|car\s+service)/i,
];

export function detectPartnerFromText(text: string): PartnerSignal {
  for (const re of PARTNER_PATTERNS) {
    const m = text.match(re);
    if (m) {
      const idx = m.index ?? 0;
      const snippet = text.slice(Math.max(0, idx - 30), idx + 90).trim();
      return { hasPartner: true, evidence: snippet.slice(0, 140) };
    }
  }
  return { hasPartner: false, evidence: null };
}

async function fetchSiteText(url: string): Promise<string | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
      },
      signal: controller.signal,
      redirect: "follow",
    });
    clearTimeout(timeout);
    if (!res.ok) return null;
    const ct = res.headers.get("content-type") ?? "";
    if (!ct.includes("text/html") && !ct.includes("text/plain")) return null;
    const html = await res.text();
    const text = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, " ")
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (text.length < 200) return null;
    return text.slice(0, 12000);
  } catch {
    clearTimeout(timeout);
    return null;
  }
}

/**
 * Read cached signals for a batch of placeIds. Missing entries mean
 * "not yet checked" (treat as unknown / null).
 */
export async function readSignals(
  placeIds: string[],
): Promise<Map<string, PartnerSignal>> {
  if (placeIds.length === 0) return new Map();
  const rows = await db.placeTransportSignal.findMany({
    where: { googlePlaceId: { in: placeIds } },
    select: { googlePlaceId: true, hasPartner: true, evidence: true },
  });
  return new Map(
    rows.map((r) => [
      r.googlePlaceId,
      { hasPartner: r.hasPartner, evidence: r.evidence },
    ]),
  );
}

/**
 * Background backfill: for places not in cache (or stale), fetch the site,
 * detect, upsert. Designed to run in after() — fire-and-forget.
 */
export async function backfillSignals(
  places: { placeId: string; website: string | null }[],
): Promise<void> {
  if (places.length === 0) return;
  const staleCutoff = new Date(Date.now() - SIGNAL_TTL_DAYS * 86_400_000);

  const existing = await db.placeTransportSignal.findMany({
    where: { googlePlaceId: { in: places.map((p) => p.placeId) } },
    select: { googlePlaceId: true, checkedAt: true },
  });
  const fresh = new Set(
    existing
      .filter((r) => r.checkedAt > staleCutoff)
      .map((r) => r.googlePlaceId),
  );

  const todo = places
    .filter((p) => !fresh.has(p.placeId))
    .slice(0, BACKFILL_MAX_PER_RUN);

  for (let i = 0; i < todo.length; i += BACKFILL_CONCURRENCY) {
    const batch = todo.slice(i, i + BACKFILL_CONCURRENCY);
    await Promise.all(
      batch.map(async (p) => {
        let signal: PartnerSignal = { hasPartner: null, evidence: null };
        if (p.website) {
          const text = await fetchSiteText(p.website);
          if (text) signal = detectPartnerFromText(text);
        }
        try {
          await db.placeTransportSignal.upsert({
            where: { googlePlaceId: p.placeId },
            create: {
              googlePlaceId: p.placeId,
              hasPartner: signal.hasPartner,
              evidence: signal.evidence,
            },
            update: {
              hasPartner: signal.hasPartner,
              evidence: signal.evidence,
              checkedAt: new Date(),
            },
          });
        } catch (err) {
          console.error(
            "[transportPartnerSignal] upsert failed",
            p.placeId,
            err,
          );
        }
      }),
    );
  }
}
