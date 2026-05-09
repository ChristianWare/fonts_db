import { db } from "@/lib/db";
import { runActorSync } from "@/lib/apify";

const ACTOR_ID = "santamaria-automations/eventbrite-scraper";

// Flat shape returned by santamaria-automations/eventbrite-scraper.
// Confirmed via real run on 2026-05-08.
export interface EventbriteRawEvent {
  id?: string;
  title?: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  timezone?: string;
  url?: string;
  image_url?: string;
  is_free?: boolean;
  is_online?: boolean;
  price?: string; // e.g. "0.0 - 535.38" or "25.00" or "Free"
  currency?: string;
  venue_name?: string;
  venue_address?: string;
  venue_city?: string;
  venue_country?: string;
  latitude?: number;
  longitude?: number;
  organizer_name?: string;
  organizer_url?: string;
  category?: string;
  tags?: string[];
  attendee_count?: number | null;
  source_url?: string;
  source_platform?: string;
  scraped_at?: string;
  [key: string]: unknown;
}

interface ScrapeOptions {
  city: string;
  state: string;
  daysOutMin?: number;
  daysOutMax?: number;
  maxResults?: number;
}

export interface ScrapeResult {
  scraped: number;
  inserted: number;
  updated: number;
  skipped: number;
  errors: string[];
  searchUrl: string;
  sampleRaw?: EventbriteRawEvent | null;
}

const HIGH_VALUE_KEYWORDS = [
  "gala",
  "fundraiser",
  "benefit",
  "award",
  "honoree",
  "conference",
  "summit",
  "symposium",
  "convention",
  "ball",
  "auction",
  "luncheon",
  "dinner",
  "banquet",
  "wedding",
  "reception",
  "anniversary",
  "annual",
  "expo",
  "trade show",
];

const NOISE_KEYWORDS = [
  "yoga",
  "meditation",
  "open mic",
  "trivia night",
  "happy hour",
  "speed dating",
  "book club",
  "knit",
  "paint and sip",
  "free webinar",
  "online only",
  "virtual only",
];

export async function scrapeEventbriteForMarket(
  opts: ScrapeOptions,
): Promise<ScrapeResult> {
  const { city, state } = opts;
  const daysOutMin = opts.daysOutMin ?? 15;
  const daysOutMax = opts.daysOutMax ?? 90;
  const maxResults = opts.maxResults ?? 50;

  const stateSlug = state.toLowerCase();
  const citySlug = city.toLowerCase().replace(/\s+/g, "-");

  const today = new Date();
  const startDate = new Date(today.getTime() + daysOutMin * 86_400_000);
  const endDate = new Date(today.getTime() + daysOutMax * 86_400_000);
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate(),
    ).padStart(2, "0")}`;

  const searchUrl =
    `https://www.eventbrite.com/d/${stateSlug}--${citySlug}/all-events/` +
    `?start_date=${fmt(startDate)}&end_date=${fmt(endDate)}`;

  const result: ScrapeResult = {
    scraped: 0,
    inserted: 0,
    updated: 0,
    skipped: 0,
    errors: [],
    searchUrl,
    sampleRaw: null,
  };

  let raw: EventbriteRawEvent[];
  try {
    raw = await runActorSync<EventbriteRawEvent>({
      actorId: ACTOR_ID,
      input: { searchUrls: [searchUrl], maxResults },
      timeoutSecs: 600,
    });
  } catch (err) {
    result.errors.push(err instanceof Error ? err.message : String(err));
    return result;
  }

  result.scraped = raw.length;
  result.sampleRaw = raw[0] ?? null;

  if (raw[0]) {
    console.log(
      "[eventbrite] sample raw event:",
      JSON.stringify(raw[0], null, 2).slice(0, 2000),
    );
  }

  for (const e of raw) {
    if (!e.id || !e.title || !e.start_date) {
      result.skipped++;
      continue;
    }

    // Online-only events aren't useful for ground transport leads
    if (e.is_online) {
      result.skipped++;
      continue;
    }

    const tagsText = Array.isArray(e.tags) ? e.tags.join(" ") : "";
    const text =
      `${e.title ?? ""} ${e.description ?? ""} ${tagsText}`.toLowerCase();

    if (NOISE_KEYWORDS.some((k) => text.includes(k))) {
      result.skipped++;
      continue;
    }

    const eventDate = new Date(e.start_date);
    if (Number.isNaN(eventDate.getTime())) {
      result.skipped++;
      continue;
    }

    const { min: priceMin, max: priceMax } = parsePriceRange(e.price);
    const score = computeRelevanceScore(e, text, priceMin, priceMax);

    if (score < 50) {
      result.skipped++;
      continue;
    }

    try {
      await db.eventbriteEvent.upsert({
        where: { eventbriteId: e.id },
        create: {
          eventbriteId: e.id,
          eventName: e.title,
          eventDate,
          venueName: e.venue_name ?? null,
          venueAddress: e.venue_address ?? null,
          venueLat: e.latitude ?? null,
          venueLng: e.longitude ?? null,
          organizerName: e.organizer_name ?? null,
          organizerEmail: null,
          organizerPhone: null,
          ticketPriceMin: priceMin != null ? priceMin.toString() : null,
          ticketPriceMax: priceMax != null ? priceMax.toString() : null,
          expectedAttendance:
            typeof e.attendee_count === "number" ? e.attendee_count : null,
          category: e.category ?? null,
          marketCity: city,
          marketState: state,
          aiScore: score,
        },
        update: {
          eventName: e.title,
          eventDate,
          venueName: e.venue_name ?? null,
          venueAddress: e.venue_address ?? null,
          venueLat: e.latitude ?? null,
          venueLng: e.longitude ?? null,
          organizerName: e.organizer_name ?? null,
          ticketPriceMin: priceMin != null ? priceMin.toString() : null,
          ticketPriceMax: priceMax != null ? priceMax.toString() : null,
          expectedAttendance:
            typeof e.attendee_count === "number" ? e.attendee_count : null,
          category: e.category ?? null,
          aiScore: score,
        },
      });

      result.inserted++;
    } catch (err) {
      result.errors.push(
        `Failed to upsert ${e.id}: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
    }
  }

  return result;
}

/**
 * Parses Eventbrite's price string into min/max numbers.
 * Examples:
 *   "0.0 - 535.38" → { min: 0, max: 535.38 }
 *   "25.00"        → { min: 25, max: 25 }
 *   "Free"         → { min: 0, max: 0 }
 *   undefined      → { min: null, max: null }
 */
function parsePriceRange(price: string | undefined): {
  min: number | null;
  max: number | null;
} {
  if (!price) return { min: null, max: null };
  const trimmed = price.trim().toLowerCase();
  if (trimmed === "free" || trimmed === "0") return { min: 0, max: 0 };

  const rangeMatch = price.match(/(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)/);
  if (rangeMatch) {
    return {
      min: Number.parseFloat(rangeMatch[1]),
      max: Number.parseFloat(rangeMatch[2]),
    };
  }

  const singleMatch = price.match(/(\d+(?:\.\d+)?)/);
  if (singleMatch) {
    const num = Number.parseFloat(singleMatch[1]);
    return { min: num, max: num };
  }

  return { min: null, max: null };
}

function computeRelevanceScore(
  e: EventbriteRawEvent,
  textLower: string,
  priceMin: number | null,
  priceMax: number | null,
): number {
  let score = 0;

  // Has a real venue (not online-only — already filtered above, but score it)
  if (e.venue_name) score += 20;
  if (e.latitude && e.longitude) score += 10;

  // High-value keyword matches (capped to prevent runaway from spammy titles)
  const matched = HIGH_VALUE_KEYWORDS.filter((k) => textLower.includes(k));
  score += Math.min(matched.length * 15, 45);

  // Ticket price signals
  if (priceMin != null) {
    if (priceMin >= 100) score += 15;
    else if (priceMin >= 50) score += 10;
    else if (priceMin >= 25) score += 5;
  }
  if (priceMax != null && priceMax >= 500) score += 10;

  // Has organizer info
  if (e.organizer_name) score += 5;

  // Bonus: recognizable categories
  const cat = (e.category ?? "").toLowerCase();
  if (
    [
      "business",
      "charity",
      "fundraiser",
      "conference",
      "food and drink",
      "performing & visual arts",
    ].some((c) => cat.includes(c))
  ) {
    score += 10;
  }

  return Math.min(score, 100);
}
