// Orchestrates enrichment of a scraped EventbriteEvent —
// categorizes via AI, looks up venue + organizer in Google Places,
// and persists everything back to the EventbriteEvent record.
// Idempotent — skips events already enriched at current version.

import { db } from "@/lib/db";
import {
  findSinglePlace,
  extractDomain,
  geocodeCity,
} from "@/lib/googlePlaces";
import { categorizeEvent } from "@/lib/ai/eventCategorizer";

const CURRENT_ENRICHMENT_VERSION = 1;

export interface EnrichmentResult {
  eventId: string;
  ok: boolean;
  steps: {
    categorized: boolean;
    venueLookedUp: boolean;
    organizerLookedUp: boolean;
  };
  error?: string;
}

export async function enrichEventbriteEvent(
  eventId: string,
  options: { force?: boolean } = {},
): Promise<EnrichmentResult> {
  const result: EnrichmentResult = {
    eventId,
    ok: false,
    steps: {
      categorized: false,
      venueLookedUp: false,
      organizerLookedUp: false,
    },
  };

  const event = await db.eventbriteEvent.findUnique({
    where: { id: eventId },
  });
  if (!event) {
    result.error = "Event not found";
    return result;
  }

  if (
    !options.force &&
    event.enrichedAt != null &&
    event.enrichmentVersion >= CURRENT_ENRICHMENT_VERSION
  ) {
    result.ok = true;
    return result;
  }

  const updates: Record<string, unknown> = {};

  // STEP 1: AI categorization
  try {
    const cat = await categorizeEvent({
      eventName: event.eventName,
      description: event.description,
      category: event.category,
      tags: event.tags,
      ticketPriceMin: event.ticketPriceMin
        ? Number(event.ticketPriceMin)
        : null,
      ticketPriceMax: event.ticketPriceMax
        ? Number(event.ticketPriceMax)
        : null,
    });
    if (cat) {
      updates.aiCategory = cat.category;
      updates.isCorporate = cat.isCorporate;
      result.steps.categorized = true;
    }
  } catch (err) {
    console.error(`[enrichment] categorization failed for ${eventId}:`, err);
  }

  // Determine search coordinates — prefer venue coords from Eventbrite,
  // fall back to geocoding the market city
  let searchLat = event.venueLat;
  let searchLng = event.venueLng;
  if (searchLat == null || searchLng == null) {
    try {
      const geocoded = await geocodeCity(
        event.marketCity,
        event.marketState ?? "",
      );
      if (geocoded) {
        searchLat = geocoded.coordinates.lat;
        searchLng = geocoded.coordinates.lng;
      }
    } catch (err) {
      console.error(
        `[enrichment] market geocoding failed for ${eventId}:`,
        err,
      );
    }
  }

  // STEP 2: Venue lookup (tight 5-mile radius around known venue coords)
  if (event.venueName && searchLat != null && searchLng != null) {
    try {
      const venueQuery = event.venueAddress
        ? `${event.venueName} ${event.venueAddress}`
        : event.venueName;
      const venuePlace = await findSinglePlace({
        query: venueQuery,
        lat: searchLat,
        lng: searchLng,
        radiusMiles: 5,
      });
      if (venuePlace) {
        updates.venueGooglePlaceId = venuePlace.placeId;
        updates.venuePhone = venuePlace.phone;
        updates.venueWebsite = venuePlace.website;
        updates.venueRating = venuePlace.rating;
        updates.venueReviewCount = venuePlace.reviewCount;
        // Backfill venue lat/lng if Eventbrite didn't have them
        if (event.venueLat == null)
          updates.venueLat = venuePlace.coordinates.lat;
        if (event.venueLng == null)
          updates.venueLng = venuePlace.coordinates.lng;
        result.steps.venueLookedUp = true;
      }
    } catch (err) {
      console.error(`[enrichment] venue lookup failed for ${eventId}:`, err);
    }
  }

  // STEP 3: Organizer business lookup (wider 50-mile radius — organizer
  // may be located anywhere in the metro, not necessarily at the venue)
  if (event.organizerName && searchLat != null && searchLng != null) {
    try {
      const organizerPlace = await findSinglePlace({
        query: event.organizerName,
        lat: searchLat,
        lng: searchLng,
        radiusMiles: 50,
      });
      if (organizerPlace) {
        updates.organizerGooglePlaceId = organizerPlace.placeId;
        updates.organizerWebsite = organizerPlace.website;
        updates.organizerDomain = extractDomain(organizerPlace.website);
        result.steps.organizerLookedUp = true;
      }
    } catch (err) {
      console.error(
        `[enrichment] organizer lookup failed for ${eventId}:`,
        err,
      );
    }
  }

  updates.enrichedAt = new Date();
  updates.enrichmentVersion = CURRENT_ENRICHMENT_VERSION;

  try {
    await db.eventbriteEvent.update({
      where: { id: eventId },
      data: updates,
    });
    result.ok = true;
  } catch (err) {
    console.error(`[enrichment] db update failed for ${eventId}:`, err);
    result.error = err instanceof Error ? err.message : String(err);
  }

  return result;
}

export async function enrichEventbriteEvents(
  eventIds: string[],
  options: { force?: boolean; concurrency?: number } = {},
): Promise<EnrichmentResult[]> {
  const concurrency = options.concurrency ?? 5;
  const results: EnrichmentResult[] = [];

  for (let i = 0; i < eventIds.length; i += concurrency) {
    const batch = eventIds.slice(i, i + concurrency);
    const batchResults = await Promise.allSettled(
      batch.map((id) => enrichEventbriteEvent(id, options)),
    );
    for (const r of batchResults) {
      if (r.status === "fulfilled") {
        results.push(r.value);
      } else {
        results.push({
          eventId: "unknown",
          ok: false,
          steps: {
            categorized: false,
            venueLookedUp: false,
            organizerLookedUp: false,
          },
          error:
            r.reason instanceof Error ? r.reason.message : String(r.reason),
        });
      }
    }
  }

  return results;
}
