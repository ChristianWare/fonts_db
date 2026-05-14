import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { scrapeEventbriteForMarket } from "@/lib/scrapers/eventbrite";
import {
  enrichEventbriteEvents,
  type EnrichmentResult,
} from "@/lib/enrichment/eventbriteEnrichment";

// Vercel Pro max — fits ~4 markets serially or many in parallel
export const maxDuration = 800;
export const dynamic = "force-dynamic";

// Safety cap so a backlog can't blow up Google Places / Anthropic costs
// in a single run. Anything past this gets caught on the next nightly run.
const ENRICH_LIMIT_PER_MARKET = 200;

export async function GET(request: Request) {
  // Vercel Cron sends Authorization: Bearer <CRON_SECRET>
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Pull every operator's primary market
  const settings = await db.leadsSettings.findMany({
    where: {
      primaryCity: { not: null },
      primaryState: { not: null },
    },
    select: {
      primaryCity: true,
      primaryState: true,
    },
  });

  // Dedupe — two operators in Phoenix = one scrape
  const seen = new Set<string>();
  const uniqueMarkets: Array<{ city: string; state: string }> = [];
  for (const s of settings) {
    if (!s.primaryCity || !s.primaryState) continue;
    const key = `${s.primaryCity.toLowerCase()}|${s.primaryState.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    uniqueMarkets.push({
      city: s.primaryCity,
      state: s.primaryState,
    });
  }

  console.log(
    `[cron warm-leads] Starting scrape + enrichment across ${uniqueMarkets.length} unique markets`,
  );

  if (uniqueMarkets.length === 0) {
    return NextResponse.json({
      ok: true,
      marketsScraped: 0,
      results: [],
      message: "No markets to scrape — no operators have set primaryCity",
    });
  }

  // Run all market pipelines in parallel.
  // Per market: scrape → then enrich any unenriched events for that market.
  // Sequential within a market (enrichment depends on scrape inserting rows),
  // parallel across markets so we stay under Vercel's 800s ceiling.
  const settled = await Promise.allSettled(
    uniqueMarkets.map(async (market) => {
      const scrapeResult = await scrapeEventbriteForMarket({
        city: market.city,
        state: market.state,
      });

      // Pick up everything in this market that hasn't been enriched yet —
      // both fresh inserts from this scrape AND leftover failures from
      // prior runs. enrichEventbriteEvent is idempotent so this is safe.
      const unenriched = await db.eventbriteEvent.findMany({
        where: {
          marketCity: { equals: market.city, mode: "insensitive" },
          marketState: {
            equals: market.state.toUpperCase(),
            mode: "insensitive",
          },
          enrichedAt: null,
        },
        select: { id: true },
        take: ENRICH_LIMIT_PER_MARKET,
        orderBy: { fetchedAt: "desc" },
      });

      let enrichmentResults: EnrichmentResult[] = [];
      if (unenriched.length > 0) {
        enrichmentResults = await enrichEventbriteEvents(
          unenriched.map((e) => e.id),
          { concurrency: 5 },
        );
      }

      return {
        market,
        scrapeResult,
        enrichmentResults,
        enrichmentQueued: unenriched.length,
      };
    }),
  );

  const results = settled.map((s, i) => {
    const market = uniqueMarkets[i];
    if (s.status === "fulfilled") {
      const { scrapeResult, enrichmentResults, enrichmentQueued } = s.value;
      const enrichedOk = enrichmentResults.filter((r) => r.ok).length;
      const enrichedFailed = enrichmentResults.filter((r) => !r.ok).length;
      console.log(
        `[cron warm-leads] ${market.city}, ${market.state} — ` +
          `scraped ${scrapeResult.scraped} / written ${scrapeResult.inserted} / ` +
          `enrichment queued ${enrichmentQueued} / ok ${enrichedOk} / failed ${enrichedFailed}`,
      );
      return {
        market,
        ok: true,
        scraped: scrapeResult.scraped,
        inserted: scrapeResult.inserted,
        skipped: scrapeResult.skipped,
        scrapeErrorCount: scrapeResult.errors.length,
        enrichmentQueued,
        enrichmentSucceeded: enrichedOk,
        enrichmentFailed: enrichedFailed,
      };
    } else {
      console.error(
        `[cron warm-leads] ${market.city}, ${market.state} FAILED:`,
        s.reason,
      );
      return {
        market,
        ok: false,
        error: s.reason instanceof Error ? s.reason.message : String(s.reason),
      };
    }
  });

  const summary = {
    ok: true,
    marketsScraped: uniqueMarkets.length,
    successful: results.filter((r) => r.ok).length,
    failed: results.filter((r) => !r.ok).length,
    totalEventsWritten: results.reduce(
      (acc, r) => acc + (r.ok ? (r.inserted ?? 0) : 0),
      0,
    ),
    totalEventsEnriched: results.reduce(
      (acc, r) => acc + (r.ok ? (r.enrichmentSucceeded ?? 0) : 0),
      0,
    ),
    results,
  };

  console.log("[cron warm-leads] Complete:", summary);

  return NextResponse.json(summary);
}
