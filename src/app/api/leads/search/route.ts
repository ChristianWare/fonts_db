import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../../auth";
import { db } from "@/lib/db";
import { searchPlaces, geocodeCity } from "@/lib/googlePlaces";

export const runtime = "nodejs";

type Temperature = "hot" | "warm" | "cold";
type SortOption = "distance" | "rating" | "reviews" | "name";

type Body = {
  // New unified params
  categories?: string[];
  temperatures?: Temperature[];
  // Legacy single-query support (backward compat with existing callers)
  query?: string;
  // Filters
  cityOverride?: string;
  stateOverride?: string;
  radiusMilesOverride?: number;
  pageToken?: string;
  freshOnly?: boolean;
  sortBy?: SortOption;
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

  // Normalize categories: support both new array and legacy single query
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

  // V1: only "cold" runs a real search. Warm/hot sources coming soon.
  const includeCold = temperatures.includes("cold");
  if (!includeCold) {
    return NextResponse.json({
      results: [],
      center: null,
      radiusMiles: null,
      nextPageToken: null,
      multiCategoryDisablesPagination: false,
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
    type EnrichedPlace = Awaited<
      ReturnType<typeof searchPlaces>
    >["places"][number] & { category: string };

    let allPlaces: EnrichedPlace[] = [];
    let nextPageToken: string | null = null;

    if (categories.length === 1) {
      // Single category — preserve existing pagination
      const result = await searchPlaces({
        query: categories[0],
        lat,
        lng,
        radiusMiles,
        pageSize: 20,
        pageToken: body.pageToken,
      });
      allPlaces = result.places.map((p) => ({ ...p, category: categories[0] }));
      nextPageToken = result.nextPageToken;
    } else {
      // Multi-category — parallel searches, dedupe by placeId, no pagination in V1
      const results = await Promise.all(
        categories.map((cat) =>
          searchPlaces({
            query: cat,
            lat,
            lng,
            radiusMiles,
            pageSize: 20,
          }).then((r) =>
            r.places.map((p) => ({ ...p, category: cat })),
          ),
        ),
      );
      const seen = new Set<string>();
      for (const list of results) {
        for (const p of list) {
          if (!seen.has(p.placeId)) {
            seen.add(p.placeId);
            allPlaces.push(p);
          }
        }
      }
      nextPageToken = null;
    }

    // Apply sort
    const sortBy: SortOption = body.sortBy ?? "distance";
    if (sortBy === "rating") {
      allPlaces.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    } else if (sortBy === "reviews") {
      allPlaces.sort((a, b) => (b.reviewCount ?? 0) - (a.reviewCount ?? 0));
    } else if (sortBy === "name") {
      allPlaces.sort((a, b) => a.name.localeCompare(b.name));
    }
    // "distance" preserves Places API default order (already by distance)

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
      nextPageToken,
      multiCategoryDisablesPagination: categories.length > 1,
    });
  } catch (err) {
    console.error("Search failed", err);
    return NextResponse.json(
      { error: "Search failed. Try again." },
      { status: 500 },
    );
  }
}