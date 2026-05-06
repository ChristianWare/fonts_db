import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../../auth";
import { db } from "@/lib/db";
import { searchPlaces, geocodeCity } from "@/lib/googlePlaces";

export const runtime = "nodejs";

type Body = {
  query?: string;
  cityOverride?: string;
  stateOverride?: string;
  radiusMilesOverride?: number;
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

  const query = body.query?.trim();
  if (!query) {
    return NextResponse.json({ error: "Query is required" }, { status: 400 });
  }

  // Determine center: override if both city + state are passed, else saved
  let lat: number;
  let lng: number;
  let radiusMiles: number;

  if (body.cityOverride && body.stateOverride) {
    const city = body.cityOverride.trim();
    const state = body.stateOverride.trim().toUpperCase();
    if (state.length !== 2) {
      return NextResponse.json(
        { error: "State must be a 2-letter abbreviation" },
        { status: 400 },
      );
    }
    const geocoded = await geocodeCity(city, state);
    if (!geocoded) {
      return NextResponse.json(
        { error: `Could not find coordinates for ${city}, ${state}` },
        { status: 400 },
      );
    }
    lat = geocoded.coordinates.lat;
    lng = geocoded.coordinates.lng;
    radiusMiles = body.radiusMilesOverride ?? 50;
  } else {
    const settings = await db.leadsSettings.findUnique({
      where: { clientProfileId: profile.id },
    });
    if (
      !settings ||
      settings.primaryLat == null ||
      settings.primaryLng == null
    ) {
      return NextResponse.json(
        { error: "No primary market set. Configure your settings first." },
        { status: 400 },
      );
    }
    lat = settings.primaryLat;
    lng = settings.primaryLng;
    radiusMiles = body.radiusMilesOverride ?? settings.serviceRadiusMiles ?? 50;
  }

  // Search
  try {
    const results = await searchPlaces({
      query,
      lat,
      lng,
      radiusMiles,
      maxResults: 20,
    });

    // Mark which results are already saved by this user — so the UI can
    // render them as "Saved" without making the user re-discover that.
    const placeIds = results.map((r) => r.placeId);
    const alreadySaved = await db.savedLead.findMany({
      where: {
        clientProfileId: profile.id,
        googlePlaceId: { in: placeIds },
      },
      select: { googlePlaceId: true },
    });
    const savedSet = new Set(alreadySaved.map((s) => s.googlePlaceId));

    return NextResponse.json({
      results: results.map((r) => ({
        ...r,
        alreadySaved: savedSet.has(r.placeId),
      })),
      center: { lat, lng },
      radiusMiles,
    });
  } catch (err) {
    console.error("Search failed", err);
    return NextResponse.json(
      { error: "Search failed. Try again." },
      { status: 500 },
    );
  }
}
