import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import { auth } from "../../../../../auth";
import { db } from "@/lib/db";
import { geocodeCity } from "@/lib/googlePlaces";
import { scrapeEventbriteForMarket } from "@/lib/scrapers/eventbrite";

export const runtime = "nodejs";
export const maxDuration = 60;

type Body = {
  primaryCity?: string;
  primaryState?: string;
  serviceRadiusMiles?: number;
  phoneNumber?: string;
  smsEnabled?: boolean;
  emailEnabled?: boolean;
};

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
  const phone = body.phoneNumber?.trim();

  // Validation
  if (!city) {
    return NextResponse.json({ error: "City is required" }, { status: 400 });
  }
  if (!state || state.length !== 2) {
    return NextResponse.json(
      { error: "State must be a 2-letter abbreviation (e.g. AZ)" },
      { status: 400 },
    );
  }
  if (!radius || radius < 10 || radius > 150) {
    return NextResponse.json(
      { error: "Radius must be between 10 and 150 miles" },
      { status: 400 },
    );
  }
  if (!phone || phone.replace(/\D/g, "").length < 10) {
    return NextResponse.json(
      { error: "A valid phone number is required" },
      { status: 400 },
    );
  }

  // Snapshot existing settings BEFORE upsert so we can detect a city change
  const previous = await db.leadsSettings.findUnique({
    where: { clientProfileId: profile.id },
    select: { primaryCity: true, primaryState: true },
  });

  // Geocode the city → lat/lng. Failure here is non-fatal — we still
  // save the user's settings, just without coordinates. Cold lead search
  // will surface the missing-coords state and prompt a re-save.
  const geocoded = await geocodeCity(city, state);
  const lat = geocoded?.coordinates.lat ?? null;
  const lng = geocoded?.coordinates.lng ?? null;

  await db.leadsSettings.upsert({
    where: { clientProfileId: profile.id },
    create: {
      clientProfileId: profile.id,
      primaryCity: city,
      primaryState: state,
      primaryLat: lat,
      primaryLng: lng,
      serviceRadiusMiles: radius,
      phoneNumber: phone,
      smsEnabled: body.smsEnabled ?? true,
      emailEnabled: body.emailEnabled ?? true,
      onboardingCompletedAt: new Date(),
    },
    update: {
      primaryCity: city,
      primaryState: state,
      primaryLat: lat,
      primaryLng: lng,
      serviceRadiusMiles: radius,
      phoneNumber: phone,
      smsEnabled: body.smsEnabled ?? true,
      emailEnabled: body.emailEnabled ?? true,
      onboardingCompletedAt: new Date(),
    },
  });

  // Detect if this is a new market (or first-time setup)
  const cityChanged =
    !previous ||
    previous.primaryCity?.toLowerCase() !== city.toLowerCase() ||
    previous.primaryState?.toLowerCase() !== state.toLowerCase();

  let scrapeQueued = false;

  if (cityChanged) {
    // Skip if we already have events for this market (another operator
    // already scraped it, or the weekly cron has run for it)
    const eventCount = await db.eventbriteEvent.count({
      where: {
        marketCity: { equals: city, mode: "insensitive" },
        marketState: { equals: state, mode: "insensitive" },
      },
    });

    if (eventCount === 0) {
      scrapeQueued = true;

      // Fire scrape AFTER response is sent — runs in background on Vercel
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
    } else {
      console.log(
        `[onboarding] ${city}, ${state} already has ${eventCount} events on file — skipping scrape`,
      );
    }
  }

  return NextResponse.json({
    success: true,
    geocoded: !!geocoded,
    scrapeQueued,
  });
}
