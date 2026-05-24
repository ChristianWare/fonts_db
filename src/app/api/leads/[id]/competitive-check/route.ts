/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../../../auth";
import { db } from "@/lib/db";
import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";
export const maxDuration = 90;

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

type AnalysisOk = {
  analyzed: true;
  hasExistingPartner: boolean;
  partnerName: string | null;
  evidence: string | null;
  recommendation: string;
};

export type FailureCategory =
  | "BLOCKED" // 403 / Cloudflare / bot shield. Manual only.
  | "JS_RENDERED" // App-rendered, no real HTML to read. Manual only.
  | "NOT_HTML" // PDF, image, app redirect. Manual only.
  | "NO_WEBSITE" // No URL on file. Google search instead.
  | "BAD_URL" // 404, DNS failure. URL is broken or stale.
  | "TRANSIENT" // Timeout, 5xx, connection reset. Retry-able.
  | "UNKNOWN";

type AnalysisFailed = {
  analyzed: false;
  reason: string;
  category: FailureCategory;
};

/**
 * Buckets raw fetch failures into a small set of categories that drive both
 * the user-facing copy and the UI buttons. Order matters — specific patterns
 * before generic ones.
 */
function classifyFailure(rawError: string): FailureCategory {
  const e = rawError.toLowerCase();

  if (e.includes("no website") || e.includes("missing")) return "NO_WEBSITE";
  if (e.includes("403") || e.includes("blocked")) return "BLOCKED";
  if (e.includes("minimal text") || e.includes("javascript-rendered"))
    return "JS_RENDERED";
  if (e.includes("not html")) return "NOT_HTML";

  if (
    e.includes("404") ||
    e.includes("enotfound") ||
    e.includes("eai_again") ||
    e.includes("dns")
  ) {
    return "BAD_URL";
  }

  if (
    /status 5\d\d/.test(e) ||
    e.includes("timeout") ||
    e.includes("etimedout") ||
    e.includes("econnrefused") ||
    e.includes("econnreset")
  ) {
    return "TRANSIENT";
  }

  return "UNKNOWN";
}

function userFacingReason(rawError: string): string {
  const category = classifyFailure(rawError);

  switch (category) {
    case "NO_WEBSITE":
      return "There's no website on file for this business — nothing for us to scan. Try a quick Google search for their name. They may have a Facebook page, Instagram, or directory listing that mentions a preferred transportation partner.";
    case "BLOCKED":
      return "This site is protected against automated readers — common with larger venues. Open it yourself and skim their About, Partners, or FAQ pages. What you're looking for is any 'transportation provided by' or 'preferred vendor' mention. Takes 60 seconds.";
    case "JS_RENDERED":
      return "This site is built in a way our reader can't see — common with modern booking platforms and event sites. Open it yourself and check the About, Partners, or FAQ pages for any mention of a preferred transportation or chauffeur provider.";

    case "NOT_HTML":
      return "The URL on file points to a PDF, image, or app redirect rather than a normal webpage. Open the live site to find their actual web presence.";
    case "BAD_URL":
      return "The website URL on file isn't reachable — it may be outdated, offline, or moved to a new address. Open the live site link to verify, or do a quick Google search to find their current site.";
    case "TRANSIENT":
      return "We couldn't reach their site right now — it may be overloaded or briefly down. Try again in a few minutes. If it keeps failing, just open it manually.";
    case "UNKNOWN":
    default:
      return "We weren't able to analyze this website automatically. Open the live site link to check for any existing transportation provider before reaching out.";
  }
}

async function fetchAndExtract(
  url: string,
): Promise<{ ok: true; text: string } | { ok: false; reason: string }> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        "Cache-Control": "no-cache",
      },
      signal: controller.signal,
      redirect: "follow",
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      return { ok: false, reason: `Website returned status ${res.status}` };
    }

    const contentType = res.headers.get("content-type") ?? "";
    if (
      !contentType.includes("text/html") &&
      !contentType.includes("text/plain")
    ) {
      return { ok: false, reason: "Website is not HTML" };
    }

    const html = await res.text();

    const text = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
      .replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&#39;/g, "'")
      .replace(/&quot;/g, '"')
      .replace(/\s+/g, " ")
      .trim();

    if (text.length < 200) {
      return {
        ok: false,
        reason: "Website has minimal text (likely JavaScript-rendered)",
      };
    }

    return { ok: true, text: text.slice(0, 10000) };
  } catch (err) {
    clearTimeout(timeoutId);
    if (err instanceof Error && err.name === "AbortError") {
      return { ok: false, reason: "Website fetch timed out (8s)" };
    }
    return {
      ok: false,
      reason: `Website fetch failed: ${err instanceof Error ? err.message : "unknown"}`,
    };
  }
}

function shouldFallBackToApify(reason: string): boolean {
  const r = reason.toLowerCase();
  return (
    r.includes("403") ||
    r.includes("blocked") ||
    r.includes("minimal text") ||
    r.includes("javascript-rendered") ||
    r.includes("not html")
  );
}

async function fetchViaApify(
  url: string,
): Promise<{ ok: true; text: string } | { ok: false; reason: string }> {
  const token = process.env.APIFY_API_TOKEN;
  if (!token) {
    return { ok: false, reason: "Apify fallback not configured" };
  }

  const pageFunction = `async function pageFunction({ request, $, log }) {
    $('script, style, noscript').remove();
    const text = $('body').text().replace(/\\s+/g, ' ').trim();
    return { text: text.slice(0, 10000) };
  }`;

  const input = {
    startUrls: [{ url }],
    pageFunction,
    maxRequestsPerCrawl: 1,
    maxConcurrency: 1,
    proxyConfiguration: { useApifyProxy: true },
  };

  try {
    const res = await fetch(
      `https://api.apify.com/v2/acts/apify~cheerio-scraper/run-sync-get-dataset-items?token=${token}&timeout=60`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
        signal: AbortSignal.timeout(70_000),
      },
    );

    if (!res.ok) {
      const errText = await res.text();
      return {
        ok: false,
        reason: `Apify fallback returned status ${res.status}: ${errText.slice(0, 200)}`,
      };
    }

    const items = await res.json();
    const text = items?.[0]?.text;
    if (typeof text !== "string" || text.length < 200) {
      return { ok: false, reason: "Apify fallback returned minimal text" };
    }

    return { ok: true, text };
  } catch (err) {
    if (err instanceof Error && err.name === "TimeoutError") {
      return { ok: false, reason: "Apify fallback timed out" };
    }
    return {
      ok: false,
      reason: `Apify fallback threw: ${err instanceof Error ? err.message : "unknown"}`,
    };
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await db.clientProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!profile) {
    return NextResponse.json({ error: "No profile" }, { status: 404 });
  }

  const { id } = await params;
  const url = new URL(req.url);
  const force = url.searchParams.get("force") === "true";

  const lead = await db.savedLead.findUnique({
    where: { id },
    select: {
      id: true,
      clientProfileId: true,
      businessName: true,
      businessWebsite: true,
      category: true,
      competitiveAnalysis: true,
    },
  });
  if (!lead || lead.clientProfileId !== profile.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (lead.competitiveAnalysis && !force) {
    return NextResponse.json({
      success: true,
      analysis: lead.competitiveAnalysis,
    });
  }

  if (!lead.businessWebsite) {
    const rawReason = "No website on file for this business";
    console.log(`[competitive-check] lead ${id}: ${rawReason}`);
    const failed: AnalysisFailed = {
      analyzed: false,
      reason: userFacingReason(rawReason),
      category: classifyFailure(rawReason),
    };
    await db.savedLead.update({
      where: { id },
      data: { competitiveAnalysis: failed },
    });
    return NextResponse.json({ success: true, analysis: failed });
  }

  let fetchResult = await fetchAndExtract(lead.businessWebsite);

  if (!fetchResult.ok && shouldFallBackToApify(fetchResult.reason)) {
    console.log(
      `[competitive-check] lead ${id} direct fetch failed (${fetchResult.reason}), trying Apify fallback`,
    );
    const apifyResult = await fetchViaApify(lead.businessWebsite);
    if (apifyResult.ok) {
      console.log(`[competitive-check] lead ${id} Apify fallback succeeded`);
      fetchResult = apifyResult;
    } else {
      console.log(
        `[competitive-check] lead ${id} Apify fallback also failed: ${apifyResult.reason}`,
      );
    }
  }

  if (!fetchResult.ok) {
    console.log(
      `[competitive-check] lead ${id} fetch failed: ${fetchResult.reason}`,
    );
    const failed: AnalysisFailed = {
      analyzed: false,
      reason: userFacingReason(fetchResult.reason),
      category: classifyFailure(fetchResult.reason),
    };
    await db.savedLead.update({
      where: { id },
      data: { competitiveAnalysis: failed },
    });
    return NextResponse.json({ success: true, analysis: failed });
  }

  const prompt = `You are analyzing a business's website to detect whether they have an existing transportation, limousine, or chauffeur partnership.

Business: ${lead.businessName ?? "Unknown"}
Category: ${lead.category}

Website content excerpt:
"""
${fetchResult.text}
"""

Look for any mention of:
- Preferred transportation, limousine, or chauffeur partner
- "Transportation provided by..." statements
- A specific company offering rides for their guests/clients/members
- Dedicated transportation pages or sections
- Shuttle services that could compete

Return ONLY a valid JSON object with this exact shape (no markdown fences, no preamble):
{
  "hasExistingPartner": boolean,
  "partnerName": string or null,
  "evidence": string or null,
  "recommendation": string
}

If a partner is found:
- partnerName: the company name as mentioned
- evidence: short paraphrase or quote (max 100 chars)
- recommendation: 1-2 sentences advising how a luxury chauffeur service should position themselves

If no partner is found:
- partnerName: null, evidence: null
- recommendation: 1-2 sentences advising how to position as their first transportation choice, with a specific angle for this business type`;

  let aiResponse: string;
  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 800,
      messages: [{ role: "user", content: prompt }],
    });
    aiResponse =
      message.content[0].type === "text" ? message.content[0].text : "";
  } catch (err) {
    console.error("[competitive-check] Anthropic call failed", err);
    return NextResponse.json({ error: "AI analysis failed" }, { status: 500 });
  }

  let parsed: Omit<AnalysisOk, "analyzed">;
  try {
    const cleaned = aiResponse
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```\s*$/, "")
      .trim();
    parsed = JSON.parse(cleaned);
  } catch (err) {
    console.error("[competitive-check] JSON parse failed:", aiResponse);
    return NextResponse.json(
      { error: "Could not parse AI response" },
      { status: 500 },
    );
  }

  const analysis: AnalysisOk = {
    analyzed: true,
    hasExistingPartner: parsed.hasExistingPartner ?? false,
    partnerName: parsed.partnerName ?? null,
    evidence: parsed.evidence ?? null,
    recommendation: parsed.recommendation ?? "",
  };

  await db.savedLead.update({
    where: { id },
    data: { competitiveAnalysis: analysis },
  });

  return NextResponse.json({ success: true, analysis });
}
