import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../../auth";
import { db } from "@/lib/db";
import { searchPlaces, geocodeCity } from "@/lib/googlePlaces";

export const runtime = "nodejs";

type Temperature = "hot" | "warm" | "cold";
type SortOption = "distance" | "rating" | "reviews" | "name";

type Body = {
  categories?: string[];
  temperatures?: Temperature[];
  query?: string; // legacy single-category fallback
  cityOverride?: string;
  stateOverride?: string;
  radiusMilesOverride?: number;
  freshOnly?: boolean;
  sortBy?: SortOption;
};

const MAX_PAGES_PER_CATEGORY = 2;
const PAGE_TOKEN_DELAY_MS = 2000; // Places requires a brief delay before next_page_token is valid

type Place = Awaited<ReturnType<typeof searchPlaces>>["places"][number];

async function fetchAllPagesForCategory(args: {
  query: string;
  lat: number;
  lng: number;
  radiusMiles: number;
  maxPages: number;
}): Promise<Place[]> {
  const { query, lat, lng, radiusMiles, maxPages } = args;
  const allPlaces: Place[] = [];
  let pageToken: string | undefined = undefined;

  for (let i = 0; i < maxPages; i++) {
    const result = await searchPlaces({
      query,
      lat,
      lng,
      radiusMiles,
      pageSize: 20,
      pageToken,
    });
    allPlaces.push(...result.places);
    if (!result.nextPageToken) break;
    pageToken = result.nextPageToken;
    if (i < maxPages - 1) {
      await new Promise((resolve) => setTimeout(resolve, PAGE_TOKEN_DELAY_MS));
    }
  }

  return allPlaces;
}

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

  const categories =
    body.categories?.map((c) => c.trim()).filter(Boolean) ??
    (body.query?.trim() ? [body.query.trim()] : []);

  const temperatures: Temperature[] = body.temperatures?.length
    ? body.temperatures
    : ["cold"];

  if (categories.length === 0) {
    return NextResponse.json(
      { error: "Select at least one category." },
      { status: 400 },
    );
  }

  const includeCold = temperatures.includes("cold");
  if (!includeCold) {
    return NextResponse.json({
      results: [],
      center: null,
      radiusMiles: null,
      message: "Hot and warm leads coming soon. Check Cold to see results.",
    });
  }

  // Resolve location
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

  try {
    type EnrichedPlace = Place & { category: string };

    // Fetch all pages for each category in parallel
    const resultsByCategory = await Promise.all(
      categories.map((cat) =>
        fetchAllPagesForCategory({
          query: cat,
          lat,
          lng,
          radiusMiles,
          maxPages: MAX_PAGES_PER_CATEGORY,
        }).then((places) =>
          places.map((p) => ({ ...p, category: cat }) as EnrichedPlace),
        ),
      ),
    );

    // Dedupe by placeId across categories
    const seen = new Set<string>();
    const allPlaces: EnrichedPlace[] = [];
    for (const list of resultsByCategory) {
      for (const p of list) {
        if (!seen.has(p.placeId)) {
          seen.add(p.placeId);
          allPlaces.push(p);
        }
      }
    }

    // Sort
    const sortBy: SortOption = body.sortBy ?? "distance";
    if (sortBy === "rating") {
      allPlaces.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    } else if (sortBy === "reviews") {
      allPlaces.sort((a, b) => (b.reviewCount ?? 0) - (a.reviewCount ?? 0));
    } else if (sortBy === "name") {
      allPlaces.sort((a, b) => a.name.localeCompare(b.name));
    }
    // "distance" preserves Places API default order

    const placeIds = allPlaces.map((r) => r.placeId);
    const matchingSaved = placeIds.length
      ? await db.savedLead.findMany({
          where: {
            clientProfileId: profile.id,
            googlePlaceId: { in: placeIds },
          },
          select: { id: true, googlePlaceId: true, isFavorite: true },
        })
      : [];
    const savedMap = new Map(
      matchingSaved.map((s) => [
        s.googlePlaceId ?? "",
        { id: s.id, isFavorite: s.isFavorite },
      ]),
    );

    return NextResponse.json({
      results: allPlaces.map((r) => {
        const saved = savedMap.get(r.placeId);
        const savedState = !saved
          ? "none"
          : saved.isFavorite
            ? "favorite"
            : "pipeline";
        return {
          ...r,
          temperature: "cold" as const,
          savedState,
          savedLeadId: saved?.id ?? null,
        };
      }),
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
