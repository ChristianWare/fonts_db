import "server-only";

const API_KEY = process.env.GOOGLE_MAPS_SERVER_KEY;

const PLACES_BASE = "https://places.googleapis.com/v1";
const GEOCODE_BASE = "https://maps.googleapis.com/maps/api/geocode/json";

const MILES_TO_METERS = 1609.34;
const EARTH_RADIUS_MILES = 3958.8;

export type Coordinates = {
  lat: number;
  lng: number;
};

export type GeocodingResult = {
  formattedAddress: string;
  coordinates: Coordinates;
};

export type PlaceSearchResult = {
  placeId: string;
  name: string;
  address: string;
  coordinates: Coordinates;
  rating: number | null;
  reviewCount: number | null;
  phone: string | null;
  website: string | null;
  types: string[];
};

export type PlaceSearchResponse = {
  places: PlaceSearchResult[];
  nextPageToken: string | null;
};

export type PlaceReview = {
  rating: number;
  text: string;
  authorName: string;
  publishedTime: string | null;
};

function getApiKey(): string {
  if (!API_KEY) {
    throw new Error(
      "GOOGLE_MAPS_SERVER_KEY is not configured. Add it to .env.",
    );
  }
  return API_KEY;
}

export async function geocodeCity(
  city: string,
  state: string,
): Promise<GeocodingResult | null> {
  const apiKey = getApiKey();
  const address = `${city}, ${state}, USA`;
  const url = `${GEOCODE_BASE}?address=${encodeURIComponent(address)}&key=${apiKey}`;

  try {
    const res = await fetch(url, { method: "GET" });
    if (!res.ok) {
      console.error("Geocoding API HTTP error", res.status);
      return null;
    }
    const data = await res.json();
    if (data.status !== "OK" || !data.results?.[0]) {
      console.error(
        "Geocoding API returned no results",
        data.status,
        data.error_message,
      );
      return null;
    }
    const top = data.results[0];
    return {
      formattedAddress: top.formatted_address,
      coordinates: {
        lat: top.geometry.location.lat,
        lng: top.geometry.location.lng,
      },
    };
  } catch (err) {
    console.error("Geocoding API fetch failed", err);
    return null;
  }
}

function radiusToBounds(lat: number, lng: number, miles: number) {
  const latDelta = (miles / EARTH_RADIUS_MILES) * (180 / Math.PI);
  const lngDelta =
    ((miles / EARTH_RADIUS_MILES) * (180 / Math.PI)) /
    Math.cos((lat * Math.PI) / 180);
  return {
    low: { latitude: lat - latDelta, longitude: lng - lngDelta },
    high: { latitude: lat + latDelta, longitude: lng + lngDelta },
  };
}

export async function searchPlaces(opts: {
  query: string;
  lat: number;
  lng: number;
  radiusMiles: number;
  pageSize?: number;
  pageToken?: string;
}): Promise<PlaceSearchResponse> {
  const apiKey = getApiKey();
  const bounds = radiusToBounds(opts.lat, opts.lng, opts.radiusMiles);

  const fieldMask = [
    "places.id",
    "places.displayName",
    "places.formattedAddress",
    "places.location",
    "places.rating",
    "places.userRatingCount",
    "places.nationalPhoneNumber",
    "places.websiteUri",
    "places.types",
    "nextPageToken",
  ].join(",");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const body: Record<string, any> = {
    textQuery: opts.query,
    locationRestriction: { rectangle: bounds },
    pageSize: Math.min(opts.pageSize ?? 20, 20),
  };

  if (opts.pageToken) {
    body.pageToken = opts.pageToken;
  }

  const res = await fetch(`${PLACES_BASE}/places:searchText`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": fieldMask,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error("Places API error", res.status, errText);
    throw new Error(`Places API error: ${res.status}`);
  }

  const data = await res.json();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const places: any[] = data.places ?? [];

  return {
    places: places.map((p) => ({
      placeId: p.id,
      name: p.displayName?.text ?? "",
      address: p.formattedAddress ?? "",
      coordinates: {
        lat: p.location?.latitude ?? 0,
        lng: p.location?.longitude ?? 0,
      },
      rating: p.rating ?? null,
      reviewCount: p.userRatingCount ?? null,
      phone: p.nationalPhoneNumber ?? null,
      website: p.websiteUri ?? null,
      types: p.types ?? [],
    })),
    nextPageToken: data.nextPageToken ?? null,
  };
}

/**
 * Fetch reviews for a specific place via Place Details API.
 * Google returns up to 5 most-relevant reviews per place.
 */
export async function fetchPlaceReviews(
  placeId: string,
): Promise<PlaceReview[] | null> {
  const apiKey = getApiKey();

  const url = `${PLACES_BASE}/places/${encodeURIComponent(placeId)}`;

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": "reviews",
      },
    });

    if (!res.ok) {
      console.error("Place Details API error", res.status, await res.text());
      return null;
    }

    const data = await res.json();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const reviews: any[] = data.reviews ?? [];

    return reviews.map((r) => ({
      rating: r.rating ?? 0,
      text: r.text?.text ?? r.originalText?.text ?? "",
      authorName: r.authorAttribution?.displayName ?? "Anonymous",
      publishedTime: r.publishTime ?? null,
    }));
  } catch (err) {
    console.error("Place Details fetch failed", err);
    return null;
  }
}

/**
 * Find a single place by text query (typically a business name).
 * Returns the top match or null. Used by Eventbrite enrichment to look up
 * venues and organizer businesses.
 */
export async function findSinglePlace(opts: {
  query: string;
  lat: number;
  lng: number;
  radiusMiles?: number;
}): Promise<PlaceSearchResult | null> {
  try {
    const result = await searchPlaces({
      query: opts.query,
      lat: opts.lat,
      lng: opts.lng,
      radiusMiles: opts.radiusMiles ?? 30,
      pageSize: 1,
    });
    return result.places[0] ?? null;
  } catch (err) {
    console.error("[googlePlaces] findSinglePlace failed:", err);
    return null;
  }
}

/**
 * Extract clean domain from a website URL.
 * "https://www.example.com/path" → "example.com"
 */
export function extractDomain(websiteUrl: string | null): string | null {
  if (!websiteUrl) return null;
  try {
    const url = new URL(websiteUrl);
    const host = url.hostname.replace(/^www\./, "").toLowerCase();
    return host.length > 0 ? host : null;
  } catch {
    return null;
  }
}

/**
 * Whitelist of Google Places `types` that legitimately match each cold-lead
 * category. After Google's free-text search returns results, we filter to
 * only places whose `types` array overlaps with the whitelist for that
 * category — drops false positives like movie theaters appearing under
 * "casinos."
 *
 * Keys are normalized category strings: lowercase, spaces → underscores.
 * Add a category here to enable filtering for it. Categories not listed
 * pass through unfiltered (useful for fuzzy ones like "55+ communities"
 * that don't have a reliable Google type).
 */
const CATEGORY_TYPE_WHITELIST: Record<string, string[]> = {
  wedding_venues: ["wedding_venue", "event_venue", "banquet_hall"],
  event_venues: ["event_venue", "banquet_hall", "convention_center"],
  hotels: ["lodging", "hotel", "resort_hotel", "bed_and_breakfast"],
  resort_spas: ["spa", "resort_hotel"],
  law_firms: ["lawyer", "legal_services"],
  country_clubs: ["country_club", "golf_course"],
  funeral_homes: ["funeral_home"],
  casinos: ["casino"],
  // "55+ communities" — no reliable Google type, intentionally skipped.
  // Google classifies these inconsistently (sometimes lodging, sometimes
  // just establishment). Better to let text search work and accept some
  // noise than over-filter and return nothing.
};

/**
 * Filters Places API results to only those whose `types` array overlaps
 * with the whitelist for the given category. Categories without a
 * whitelist entry are returned unchanged.
 *
 * Logs dropped results to help tune the whitelist over time — watch
 * server logs while testing each category to see what's being filtered
 * out and whether the choices are correct.
 */
export function filterPlacesByCategory<
  T extends { name: string; types: string[] },
>(places: T[], category: string): { kept: T[]; droppedCount: number } {
  const key = category.toLowerCase().replace(/\s+/g, "_");
  const whitelist = CATEGORY_TYPE_WHITELIST[key];

  // No whitelist for this category — pass everything through
  if (!whitelist || whitelist.length === 0) {
    return { kept: places, droppedCount: 0 };
  }

  const whitelistSet = new Set(whitelist);
  const kept: T[] = [];
  const dropped: T[] = [];

  for (const p of places) {
    if (p.types.some((t) => whitelistSet.has(t))) {
      kept.push(p);
    } else {
      dropped.push(p);
    }
  }

  if (dropped.length > 0) {
    const samples = dropped
      .slice(0, 3)
      .map((p) => `${p.name} [${p.types.slice(0, 4).join(", ")}]`);
    console.log(
      `[googlePlaces] category="${category}": dropped ${dropped.length}/${places.length} results. Sample: ${samples.join(" | ")}`,
    );
  }

  return { kept, droppedCount: dropped.length };
}

export { MILES_TO_METERS };