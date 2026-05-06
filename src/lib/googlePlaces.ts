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

/**
 * Returns the API key, throwing if it isn't configured. Using a function
 * (instead of TS's `asserts` syntax) so callers get a plain `string` at
 * each call site — which `asserts` can't do for module-level variables.
 */
function getApiKey(): string {
  if (!API_KEY) {
    throw new Error(
      "GOOGLE_MAPS_SERVER_KEY is not configured. Add it to .env.",
    );
  }
  return API_KEY;
}

/**
 * Convert a city + state into lat/lng coordinates.
 * Returns null on failure (404, no results, API error) — caller decides
 * whether to fail loudly or just skip saving coords.
 */
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

/**
 * Compute a lat/lng bounding box (low/high) from a center + radius in miles.
 * Used for Places API location restriction since the circle radius caps
 * at 50km and we need to support up to 150 miles.
 */
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

/**
 * Search for businesses by free-text query within a radius of a point.
 * Uses Places API (New) Text Search with locationRestriction (hard radius
 * limit so we don't get cross-country results).
 *
 * Field-masked to only return what we display — keeps cost down per
 * Places API (New) pricing model.
 */
export async function searchPlaces(opts: {
  query: string; // e.g. "wedding venues" or "hotels"
  lat: number;
  lng: number;
  radiusMiles: number;
  maxResults?: number;
}): Promise<PlaceSearchResult[]> {
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
  ].join(",");

  const res = await fetch(`${PLACES_BASE}/places:searchText`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": fieldMask,
    },
    body: JSON.stringify({
      textQuery: opts.query,
      locationRestriction: {
        rectangle: bounds,
      },
      maxResultCount: Math.min(opts.maxResults ?? 20, 20),
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error("Places API error", res.status, errText);
    throw new Error(`Places API error: ${res.status}`);
  }

  const data = await res.json();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const places: any[] = data.places ?? [];

  return places.map((p) => ({
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
  }));
}

// Re-export the meters constant in case anything else needs it
export { MILES_TO_METERS };
