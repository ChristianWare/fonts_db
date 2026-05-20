import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import { auth } from "../../../../../auth";
import { db } from "@/lib/db";
import { geocodeCity } from "@/lib/googlePlaces";
import { scrapeEventbriteForMarket } from "@/lib/scrapers/eventbrite";
import {
  normalizeMarketKey,
  DAILY_MARKET_LIMIT,
  MONTHLY_MARKET_LIMIT,
} from "@/lib/leads/scrapeQuota";

export const runtime = "nodejs";
export const maxDuration = 60;

type Body = {
  primaryCity?: string;
  primaryState?: string;
  primaryLat?: number | null;
  primaryLng?: number | null;
  serviceRadiusMiles?: number;
  emailEnabled?: boolean;
};

const ALLOWED_RADII = [5, 10, 20, 50, 75];

export async function POST(req: NextRequest) {
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

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const city = body.primaryCity?.trim();
  const state = body.primaryState?.trim().toUpperCase();
  const radius = body.serviceRadiusMiles;

  if (!city) {
    return NextResponse.json({ error: "City is required" }, { status: 400 });
  }
  if (!state || state.length !== 2) {
    return NextResponse.json(
      { error: "State must be a 2-letter abbreviation (e.g. AZ)" },
      { status: 400 },
    );
  }
  if (typeof radius !== "number" || !ALLOWED_RADII.includes(radius)) {
    return NextResponse.json(
      { error: `Radius must be one of: ${ALLOWED_RADII.join(", ")} miles` },
      { status: 400 },
    );
  }

  const previous = await db.leadsSettings.findUnique({
    where: { clientProfileId: profile.id },
    select: { primaryCity: true, primaryState: true },
  });

  // Coordinate resolution
  let lat: number | null = null;
  let lng: number | null = null;
  let geocoded = false;

  if (
    typeof body.primaryLat === "number" &&
    typeof body.primaryLng === "number" &&
    Number.isFinite(body.primaryLat) &&
    Number.isFinite(body.primaryLng)
  ) {
    lat = body.primaryLat;
    lng = body.primaryLng;
    geocoded = true;
  } else {
    const result = await geocodeCity(city, state);
    if (result) {
      lat = result.coordinates.lat;
      lng = result.coordinates.lng;
      geocoded = true;
    }
  }

  await db.leadsSettings.upsert({
    where: { clientProfileId: profile.id },
    create: {
      clientProfileId: profile.id,
      primaryCity: city,
      primaryState: state,
      primaryLat: lat,
      primaryLng: lng,
      serviceRadiusMiles: radius,
      emailEnabled: body.emailEnabled ?? true,
      onboardingCompletedAt: new Date(),
    },
    update: {
      primaryCity: city,
      primaryState: state,
      primaryLat: lat,
      primaryLng: lng,
      serviceRadiusMiles: radius,
      emailEnabled: body.emailEnabled ?? true,
      onboardingCompletedAt: new Date(),
    },
  });

  // Compute current quota usage. Used for the gate check below AND returned
  // in the response so the client can show a warning modal at thresholds.
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

  const dailyMarkets = new Set(dailyRows.map((r) => r.marketKey));
  const monthlyMarkets = new Set(monthlyRows.map((r) => r.marketKey));
  const marketKey = normalizeMarketKey(city, state);

  const cityChanged =
    !previous ||
    previous.primaryCity?.toLowerCase() !== city.toLowerCase() ||
    previous.primaryState?.toLowerCase() !== state.toLowerCase();

  let scrapeQueued = false;
  let quotaExceeded = false;

  if (cityChanged) {
    const eventCount = await db.eventbriteEvent.count({
      where: {
        marketCity: { equals: city, mode: "insensitive" },
        marketState: { equals: state, mode: "insensitive" },
      },
    });

    if (eventCount === 0) {
      // Count markets OTHER than this one — if it's already in usage from a
      // prior request, don't double-count it on the boundary check.
      const dailyOthers = dailyMarkets.has(marketKey)
        ? dailyMarkets.size - 1
        : dailyMarkets.size;
      const monthlyOthers = monthlyMarkets.has(marketKey)
        ? monthlyMarkets.size - 1
        : monthlyMarkets.size;

      if (
        dailyOthers >= DAILY_MARKET_LIMIT ||
        monthlyOthers >= MONTHLY_MARKET_LIMIT
      ) {
        quotaExceeded = true;
        console.log(
          `[onboarding] quota exceeded for profile ${profile.id} — daily=${dailyOthers}/${DAILY_MARKET_LIMIT}, monthly=${monthlyOthers}/${MONTHLY_MARKET_LIMIT}`,
        );
      } else {
        scrapeQueued = true;

        // Write usage synchronously so the response numbers reflect reality
        // and the in-memory sets stay accurate for the response payload.
        await db.marketScrapeUsage.create({
          data: {
            clientProfileId: profile.id,
            marketKey,
          },
        });
        dailyMarkets.add(marketKey);
        monthlyMarkets.add(marketKey);

        after(async () => {
          try {
            console.log(
              `[onboarding scrape] starting for ${city}, ${state} (profile ${profile.id})`,
            );
            const result = await scrapeEventbriteForMarket({ city, state });
            console.log(
              `[onboarding scrape] ${city}, ${state} complete: ${result.inserted} written / ${result.scraped} scraped / ${result.skipped} skipped / ${result.errors.length} errors`,
            );
          } catch (err) {
            console.error(
              `[onboarding scrape] FAILED for ${city}, ${state}:`,
              err,
            );
          }
        });
      }
    } else {
      console.log(
        `[onboarding] ${city}, ${state} already has ${eventCount} events on file — skipping scrape`,
      );
    }
  }

  return NextResponse.json({
    success: true,
    geocoded,
    scrapeQueued,
    quotaExceeded,
    quota: {
      dailyUsed: dailyMarkets.size,
      dailyLimit: DAILY_MARKET_LIMIT,
      monthlyUsed: monthlyMarkets.size,
      monthlyLimit: MONTHLY_MARKET_LIMIT,
    },
  });
}
