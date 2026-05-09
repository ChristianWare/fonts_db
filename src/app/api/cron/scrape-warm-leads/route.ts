import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { scrapeEventbriteForMarket } from "@/lib/scrapers/eventbrite";

// Vercel Pro max — fits ~4 markets serially or many in parallel
export const maxDuration = 800;
export const dynamic = "force-dynamic";

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
    `[cron warm-leads] Starting scrape across ${uniqueMarkets.length} unique markets`,
  );

  if (uniqueMarkets.length === 0) {
    return NextResponse.json({
      ok: true,
      marketsScraped: 0,
      results: [],
      message: "No markets to scrape — no operators have set primaryCity",
    });
  }

  // Run all market scrapes in parallel
  // Each scrape is ~2–4 min; running serially past 4 markets exceeds Vercel timeout
  const settled = await Promise.allSettled(
    uniqueMarkets.map(async (market) => {
      const result = await scrapeEventbriteForMarket({
        city: market.city,
        state: market.state,
      });
      return { market, result };
    }),
  );

  const results = settled.map((s, i) => {
    const market = uniqueMarkets[i];
    if (s.status === "fulfilled") {
      const r = s.value.result;
      console.log(
        `[cron warm-leads] ${market.city}, ${market.state} — scraped ${r.scraped} / written ${r.inserted} / skipped ${r.skipped} / errors ${r.errors.length}`,
      );
      return {
        market,
        ok: true,
        scraped: r.scraped,
        inserted: r.inserted,
        skipped: r.skipped,
        errorCount: r.errors.length,
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
    results,
  };

  console.log("[cron warm-leads] Complete:", summary);

  return NextResponse.json(summary);
}
