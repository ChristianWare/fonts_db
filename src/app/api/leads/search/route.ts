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
  query?: string;
  cityOverride?: string;
  stateOverride?: string;
  radiusMilesOverride?: number;
  freshOnly?: boolean;
  sortBy?: SortOption;
};

const MAX_PAGES_PER_CATEGORY = 2;
const PAGE_TOKEN_DELAY_MS = 2000;
const HOT_DAYS_OUT_MAX = 14;
const WARM_DAYS_OUT_MIN = 15;
const WARM_DAYS_OUT_MAX = 90;

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

  const includeHot = temperatures.includes("hot");
  const includeWarm = temperatures.includes("warm");
  const includeCold = temperatures.includes("cold");

  if (!includeHot && !includeWarm && !includeCold) {
    return NextResponse.json({
      results: [],
      center: null,
      radiusMiles: null,
      message: "Pick at least one lead type.",
    });
  }

  if (includeCold && categories.length === 0) {
    return NextResponse.json(
      { error: "Pick at least one category for cold leads." },
      { status: 400 },
    );
  }

  // Resolve location
  let searchCity: string | null = null;
  let searchState: string | null = null;
  let lat: number | null = null;
  let lng: number | null = null;
  let radiusMiles: number = body.radiusMilesOverride ?? 50;

  if (body.cityOverride && body.stateOverride) {
    searchCity = body.cityOverride.trim();
    searchState = body.stateOverride.trim().toUpperCase();
    if (searchState.length !== 2) {
      return NextResponse.json(
        { error: "State must be a 2-letter abbreviation" },
        { status: 400 },
      );
    }
    if (includeCold) {
      const geocoded = await geocodeCity(searchCity, searchState);
      if (!geocoded) {
        return NextResponse.json(
          {
            error: `Could not find coordinates for ${searchCity}, ${searchState}`,
          },
          { status: 400 },
        );
      }
      lat = geocoded.coordinates.lat;
      lng = geocoded.coordinates.lng;
    }
    radiusMiles = body.radiusMilesOverride ?? 50;
  } else {
    const settings = await db.leadsSettings.findUnique({
      where: { clientProfileId: profile.id },
      select: {
        primaryCity: true,
        primaryState: true,
        primaryLat: true,
        primaryLng: true,
        serviceRadiusMiles: true,
      },
    });
    if (!settings) {
      return NextResponse.json(
        { error: "No primary market set. Configure your settings first." },
        { status: 400 },
      );
    }
    searchCity = settings.primaryCity;
    searchState = settings.primaryState;
    if (includeCold) {
      if (settings.primaryLat == null || settings.primaryLng == null) {
        return NextResponse.json(
          {
            error:
              "Primary market coordinates missing. Re-save settings to geocode.",
          },
          { status: 400 },
        );
      }
      lat = settings.primaryLat;
      lng = settings.primaryLng;
    }
    radiusMiles = body.radiusMilesOverride ?? settings.serviceRadiusMiles ?? 50;
  }

  // ===== HOT SEARCH (chunk 6) =====
  // Events 0-14 days out from operator's market.
  let hotResults: unknown[] = [];

  if (includeHot && searchCity && searchState) {
    try {
      const today = new Date();
      const endOfHotWindow = new Date(
        today.getTime() + HOT_DAYS_OUT_MAX * 86_400_000,
      );

      const events = await db.eventbriteEvent.findMany({
        where: {
          marketCity: { equals: searchCity, mode: "insensitive" },
          marketState: {
            equals: searchState.toUpperCase(),
            mode: "insensitive",
          },
          eventDate: { gte: today, lte: endOfHotWindow },
        },
        orderBy: [{ aiScore: "desc" }, { eventDate: "asc" }],
      });

      const eventUrls = events.map(
        (e) => `https://www.eventbrite.com/e/${e.eventbriteId}`,
      );

      const matchingSavedHot = eventUrls.length
        ? await db.savedLead.findMany({
            where: {
              clientProfileId: profile.id,
              source: "eventbrite",
              sourceUrl: { in: eventUrls },
              isDraft: false,
            },
            select: { id: true, sourceUrl: true, isFavorite: true },
          })
        : [];

      const savedHotMap = new Map(
        matchingSavedHot.map((s) => [
          s.sourceUrl ?? "",
          { id: s.id, isFavorite: s.isFavorite },
        ]),
      );

      hotResults = events.map((e) => {
        const url = `https://www.eventbrite.com/e/${e.eventbriteId}`;
        const saved = savedHotMap.get(url);
        const savedState = !saved
          ? "none"
          : saved.isFavorite
            ? "favorite"
            : "pipeline";
        return {
          temperature: "hot" as const,
          source: "eventbrite" as const,
          externalId: e.eventbriteId,
          eventName: e.eventName,
          eventDateIso: e.eventDate.toISOString(),
          venue: e.venueName,
          attendeeCount: e.expectedAttendance,
          organizerName: e.organizerName,
          organizerEmail: e.organizerEmail,
          organizerPhone: e.organizerPhone,
          url,
          category: e.category ?? "Event",
          isCorporate: e.isCorporate,
          aiCategory: e.aiCategory,
          savedState,
          savedLeadId: saved?.id ?? null,
        };
      });
    } catch (err) {
      console.error("Hot search failed", err);
    }
  }

  // ===== WARM SEARCH =====
  let warmResults: unknown[] = [];

  if (includeWarm && searchCity && searchState) {
    try {
      const today = new Date();
      const startOfWindow = new Date(
        today.getTime() + WARM_DAYS_OUT_MIN * 86_400_000,
      );
      const endOfWindow = new Date(
        today.getTime() + WARM_DAYS_OUT_MAX * 86_400_000,
      );

      const events = await db.eventbriteEvent.findMany({
        where: {
          marketCity: { equals: searchCity, mode: "insensitive" },
          marketState: {
            equals: searchState.toUpperCase(),
            mode: "insensitive",
          },
          eventDate: { gte: startOfWindow, lte: endOfWindow },
        },
        orderBy: [{ aiScore: "desc" }, { eventDate: "asc" }],
      });

      const eventUrls = events.map(
        (e) => `https://www.eventbrite.com/e/${e.eventbriteId}`,
      );

      const matchingSavedWarm = eventUrls.length
        ? await db.savedLead.findMany({
            where: {
              clientProfileId: profile.id,
              source: "eventbrite",
              sourceUrl: { in: eventUrls },
              isDraft: false,
            },
            select: { id: true, sourceUrl: true, isFavorite: true },
          })
        : [];

      const savedWarmMap = new Map(
        matchingSavedWarm.map((s) => [
          s.sourceUrl ?? "",
          { id: s.id, isFavorite: s.isFavorite },
        ]),
      );

      warmResults = events.map((e) => {
        const url = `https://www.eventbrite.com/e/${e.eventbriteId}`;
        const saved = savedWarmMap.get(url);
        const savedState = !saved
          ? "none"
          : saved.isFavorite
            ? "favorite"
            : "pipeline";
        return {
          temperature: "warm" as const,
          source: "eventbrite" as const,
          externalId: e.eventbriteId,
          eventName: e.eventName,
          eventDateIso: e.eventDate.toISOString(),
          venue: e.venueName,
          attendeeCount: e.expectedAttendance,
          organizerName: e.organizerName,
          organizerEmail: e.organizerEmail,
          organizerPhone: e.organizerPhone,
          url,
          category: e.category ?? "Event",
          isCorporate: e.isCorporate,
          aiCategory: e.aiCategory,
          savedState,
          savedLeadId: saved?.id ?? null,
        };
      });
    } catch (err) {
      console.error("Warm search failed", err);
    }
  }

  // ===== COLD SEARCH =====
  let coldResults: unknown[] = [];

  if (includeCold && lat != null && lng != null) {
    try {
      type EnrichedPlace = Place & { category: string };

      const resultsByCategory = await Promise.all(
        categories.map((cat) =>
          fetchAllPagesForCategory({
            query: cat,
            lat: lat!,
            lng: lng!,
            radiusMiles,
            maxPages: MAX_PAGES_PER_CATEGORY,
          }).then((places) =>
            places.map((p) => ({ ...p, category: cat }) as EnrichedPlace),
          ),
        ),
      );

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

      const sortBy: SortOption = body.sortBy ?? "distance";
      if (sortBy === "rating") {
        allPlaces.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
      } else if (sortBy === "reviews") {
        allPlaces.sort((a, b) => (b.reviewCount ?? 0) - (a.reviewCount ?? 0));
      } else if (sortBy === "name") {
        allPlaces.sort((a, b) => a.name.localeCompare(b.name));
      }

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

      coldResults = allPlaces.map((r) => {
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
      });
    } catch (err) {
      console.error("Cold search failed", err);
    }
  }

  // Hot first, then warm, then cold
  const results = [...hotResults, ...warmResults, ...coldResults];

  return NextResponse.json({
    results,
    center: lat != null && lng != null ? { lat, lng } : null,
    radiusMiles,
  });
}
