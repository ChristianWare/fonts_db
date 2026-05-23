/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../../../auth";
import { db } from "@/lib/db";
import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";
export const maxDuration = 60;

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

type AnalysisOk = {
  analyzed: true;
  hasExistingPartner: boolean;
  partnerName: string | null;
  evidence: string | null;
  recommendation: string;
};

type AnalysisFailed = {
  analyzed: false;
  reason: string;
};

/**
 * Translates internal failure messages from fetchAndExtract / the no-website
 * branch into copy a non-technical user can act on. Patterns are tested in
 * order from most specific to least, with a generic fallback at the end.
 *
 * Matching is case-insensitive so we don't have to worry about capitalization
 * drift in the underlying error strings.
 */
function userFacingReason(rawError: string): string {
  const e = rawError.toLowerCase();

  // === Status-code based failures ===
  if (e.includes("403") || e.includes("blocked")) {
    return "This website is blocking automated checks — common for larger venues behind security services like Cloudflare. Open the live site link above and skim their About or Partners page to spot any existing transportation provider.";
  }
  if (e.includes("404")) {
    return "The page we tried to read no longer exists. Check the live site link above to confirm this business is still operating, or look for an updated website.";
  }
  if (/status 5\d\d/.test(e)) {
    return "Their website is having problems right now — their server returned an error. Try again in a few minutes, or just open the live site link above and check their site yourself.";
  }
  if (/status 4\d\d/.test(e)) {
    return "We couldn't reach this website (it returned an error). Open the live site link above to check their About or Partners page yourself.";
  }

  // === Network-level failures ===
  if (e.includes("timeout") || e.includes("etimedout")) {
    return "Their website is responding too slowly for us to analyze. Try again in a few minutes, or just open the live site yourself.";
  }
  if (e.includes("enotfound") || e.includes("eai_again") || e.includes("dns")) {
    return "Their website couldn't be reached. It may be offline, or the URL on file is incorrect — open the live site link above to verify.";
  }
  if (e.includes("econnrefused") || e.includes("econnreset")) {
    return "Their website refused our connection. It may be down or blocking outside traffic — try the live site link above.";
  }

  // === Content-shape failures ===
  if (e.includes("not html")) {
    return "This URL doesn't point to a normal webpage — it might be a PDF, image, or app redirect. Open the live site link above to check their actual site.";
  }
  if (e.includes("minimal text") || e.includes("javascript-rendered")) {
    return "This website loads its content with JavaScript, which we can't read automatically. Open the live site link above and check their About or Partners page directly.";
  }

  // === Missing data ===
  if (e.includes("no website") || e.includes("missing")) {
    return "This business doesn't have a website on file, so there's nothing for us to scan. A quick Google search may turn up their presence elsewhere.";
  }

  // === Generic fallback ===
  return "We weren't able to analyze this website. Open the live site link above to check for any existing transportation provider before pitching.";
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

  // Idempotent: return cached unless force=true
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
    };
    await db.savedLead.update({
      where: { id },
      data: { competitiveAnalysis: failed },
    });
    return NextResponse.json({ success: true, analysis: failed });
  }

  const fetchResult = await fetchAndExtract(lead.businessWebsite);
  if (!fetchResult.ok) {
    console.log(
      `[competitive-check] lead ${id} fetch failed: ${fetchResult.reason}`,
    );
    const failed: AnalysisFailed = {
      analyzed: false,
      reason: userFacingReason(fetchResult.reason),
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
