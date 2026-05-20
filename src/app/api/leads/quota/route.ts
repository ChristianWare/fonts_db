import { NextResponse } from "next/server";
import { auth } from "../../../../../auth";
import { db } from "@/lib/db";
import {
  DAILY_MARKET_LIMIT,
  MONTHLY_MARKET_LIMIT,
} from "@/lib/leads/scrapeQuota";

export const runtime = "nodejs";

export async function GET() {
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
        clientProfileId: profile.id,
        scrapedAt: { gte: startOfToday },
      },
      select: { marketKey: true },
      distinct: ["marketKey"],
    }),
    db.marketScrapeUsage.findMany({
      where: {
        clientProfileId: profile.id,
        scrapedAt: { gte: startOfMonth },
      },
      select: { marketKey: true },
      distinct: ["marketKey"],
    }),
  ]);

  // Count every scraped market — primary included.
  const dailyMarkets = new Set(dailyRows.map((r) => r.marketKey));
  const monthlyMarkets = new Set(monthlyRows.map((r) => r.marketKey));

  return NextResponse.json({
    dailyUsed: dailyMarkets.size,
    dailyLimit: DAILY_MARKET_LIMIT,
    monthlyUsed: monthlyMarkets.size,
    monthlyLimit: MONTHLY_MARKET_LIMIT,
  });
}
