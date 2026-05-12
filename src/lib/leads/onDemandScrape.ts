import { db } from "@/lib/db";
import { scrapeEventbriteForMarket } from "@/lib/scrapers/eventbrite";
import { enrichEventbriteEvents } from "@/lib/enrichment/eventbriteEnrichment";

/**
 * Runs the full on-demand scrape pipeline for a market.
 * Designed to run in the background via Vercel's after() API.
 *
 * Pipeline:
 *   1. Apify Eventbrite scrape via scrapeEventbriteForMarket (30-90s)
 *   2. Google Places venue + organizer enrichment + AI categorization (20-40s)
 *   3. Update job status throughout for the frontend polling endpoint
 *
 * On failure: job row is marked FAILED with the error message preserved.
 */
export async function runOnDemandScrape(
  jobId: string,
  city: string,
  state: string,
): Promise<void> {
  try {
    // === Stage 1: Scraping ===
    await db.scrapeJob.update({
      where: { id: jobId },
      data: {
        status: "SCRAPING",
        stage: "Fetching events from Eventbrite",
        progressPct: 10,
      },
    });

    const scrapeResult = await scrapeEventbriteForMarket({
      city,
      state,
    });

    await db.scrapeJob.update({
      where: { id: jobId },
      data: {
        stage: "Categorizing events",
        progressPct: 40,
        eventCount: scrapeResult.inserted ?? 0,
      },
    });

    // === Stage 2: Enrichment ===
    // Re-query for events just fetched in this market.
    // Using a 5-min window to capture anything just upserted.
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const recentEvents = await db.eventbriteEvent.findMany({
      where: {
        marketCity: { equals: city, mode: "insensitive" },
        marketState: { equals: state.toUpperCase(), mode: "insensitive" },
        fetchedAt: { gte: fiveMinutesAgo },
      },
      select: { id: true },
    });

    await db.scrapeJob.update({
      where: { id: jobId },
      data: {
        status: "ENRICHING",
        stage: "Enriching with venue and organizer contacts",
        progressPct: 60,
      },
    });

    if (recentEvents.length > 0) {
      await enrichEventbriteEvents(
        recentEvents.map((e) => e.id),
        { concurrency: 5 },
      );
    }

    // === Stage 3: Complete ===
    await db.scrapeJob.update({
      where: { id: jobId },
      data: {
        status: "COMPLETE",
        stage: "Complete",
        progressPct: 100,
        completedAt: new Date(),
      },
    });
  } catch (err) {
    console.error(`[onDemandScrape] job ${jobId} failed:`, err);
    await db.scrapeJob
      .update({
        where: { id: jobId },
        data: {
          status: "FAILED",
          stage: "Error",
          error: err instanceof Error ? err.message : String(err),
          completedAt: new Date(),
        },
      })
      .catch((updateErr) => {
        console.error(
          `[onDemandScrape] failed to mark job ${jobId} as failed:`,
          updateErr,
        );
      });
  }
}
