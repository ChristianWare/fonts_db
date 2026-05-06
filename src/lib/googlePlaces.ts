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

export { MILES_TO_METERS };
