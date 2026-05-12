import { db } from "@/lib/db";

export const DAILY_MARKET_LIMIT = 5;
export const MONTHLY_MARKET_LIMIT = 15;
export const CACHE_TTL_HOURS = 24;

export type QuotaResult =
  | {
      allowed: true;
      dailyUsed: number;
      monthlyUsed: number;
      isAlreadyScrapedToday: boolean;
      isAlreadyScrapedThisMonth: boolean;
    }
  | {
      allowed: false;
      dailyUsed: number;
      monthlyUsed: number;
      reason: "DAILY_LIMIT" | "MONTHLY_LIMIT";
    };

/**
 * Normalize a city/state pair to a stable key for quota counting + job dedup.
 * "Atlanta", "GA" → "atlanta,ga"
 */
export function normalizeMarketKey(city: string, state: string): string {
  return `${city.trim().toLowerCase()},${state.trim().toLowerCase()}`;
}

/**
 * Check whether the operator can scrape this market.
 *
 * Rules:
 * - The operator's primary market is always allowed (free, doesn't count toward quota).
 * - Markets already scraped today don't count again (cache hit territory).
 * - Markets already scraped this month don't count again toward monthly limit.
 * - Otherwise: 5 unique markets/day, 15 unique markets/month.
 */
export async function checkScrapeQuota(
  clientProfileId: string,
  marketKey: string,
  primaryMarketKey: string | null,
): Promise<QuotaResult> {
  // Primary market is always free, doesn't count
  if (primaryMarketKey && marketKey === primaryMarketKey) {
    return {
      allowed: true,
      dailyUsed: 0,
      monthlyUsed: 0,
      isAlreadyScrapedToday: false,
      isAlreadyScrapedThisMonth: false,
    };
  }

  const now = new Date();
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [dailyRows, monthlyRows] = await Promise.all([
    db.marketScrapeUsage.findMany({
      where: {
        clientProfileId,
        scrapedAt: { gte: startOfToday },
      },
      select: { marketKey: true },
      distinct: ["marketKey"],
    }),
    db.marketScrapeUsage.findMany({
      where: {
        clientProfileId,
        scrapedAt: { gte: startOfMonth },
      },
      select: { marketKey: true },
      distinct: ["marketKey"],
    }),
  ]);

  const dailyMarkets = new Set(dailyRows.map((r) => r.marketKey));
  const monthlyMarkets = new Set(monthlyRows.map((r) => r.marketKey));

  const isAlreadyScrapedToday = dailyMarkets.has(marketKey);
  const isAlreadyScrapedThisMonth = monthlyMarkets.has(marketKey);

  // If this market is NEW for today and daily quota is full, block
  if (!isAlreadyScrapedToday && dailyMarkets.size >= DAILY_MARKET_LIMIT) {
    return {
      allowed: false,
      dailyUsed: dailyMarkets.size,
      monthlyUsed: monthlyMarkets.size,
      reason: "DAILY_LIMIT",
    };
  }

  // If this market is NEW for the month and monthly quota is full, block
  if (
    !isAlreadyScrapedThisMonth &&
    monthlyMarkets.size >= MONTHLY_MARKET_LIMIT
  ) {
    return {
      allowed: false,
      dailyUsed: dailyMarkets.size,
      monthlyUsed: monthlyMarkets.size,
      reason: "MONTHLY_LIMIT",
    };
  }

  return {
    allowed: true,
    dailyUsed: dailyMarkets.size,
    monthlyUsed: monthlyMarkets.size,
    isAlreadyScrapedToday,
    isAlreadyScrapedThisMonth,
  };
}

/**
 * Records a scrape attempt against the operator's quota.
 * Only called when we actually trigger a fresh Apify run — not on cache hits.
 */
export async function recordScrapeUsage(
  clientProfileId: string,
  marketKey: string,
): Promise<void> {
  await db.marketScrapeUsage.create({
    data: {
      clientProfileId,
      marketKey,
    },
  });
}
