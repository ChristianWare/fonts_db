import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import { auth } from "../../../../../auth";
import { db } from "@/lib/db";
import {
  searchPlaces,
  geocodeCity,
  filterPlacesByCategory,
} from "@/lib/googlePlaces";
import {
  normalizeMarketKey,
  checkScrapeQuota,
  recordScrapeUsage,
  CACHE_TTL_HOURS,
  DAILY_MARKET_LIMIT,
  MONTHLY_MARKET_LIMIT,
} from "@/lib/leads/scrapeQuota";
import { runOnDemandScrape } from "@/lib/leads/onDemandScrape";
import { computeColdScore } from "@/lib/leads/coldScore";
import { generateColdScoreReasoning } from "@/lib/leads/coldScoreReasoning";
import { isRecurringCategory } from "@/lib/leads/recurringAccounts";
import {
  readSignals,
  backfillSignals,
} from "@/lib/leads/transportPartnerSignal";

export const runtime = "nodejs";
export const maxDuration = 300; // Vercel Pro — needed for after() background work

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
const CONCURRENT_JOB_LOOKBACK_MIN = 10;

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
      status: "ok",
      results: [],
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

  // === ON-DEMAND SCRAPE LOGIC ===
  // For warm/hot searches, check cache freshness. If stale, trigger background
  // scrape. Cold searches hit Google Places live so they skip this block.
  if ((includeWarm || includeHot) && searchCity && searchState) {
    const marketKey = normalizeMarketKey(searchCity, searchState);
    const primaryMarketKey =
      settings?.primaryCity && settings?.primaryState
        ? normalizeMarketKey(settings.primaryCity, settings.primaryState)
        : null;

    const cacheCutoff = new Date(Date.now() - CACHE_TTL_HOURS * 60 * 60 * 1000);

    // A market is "cached" if EITHER we have fresh events for it OR we
    // recently completed a scrape attempt (even one that returned zero
    // events). The second check prevents the infinite-rescrape loop in
    // markets with no Eventbrite presence.
    const cacheHit = await db.eventbriteEvent.findFirst({
      where: {
        marketCity: { equals: searchCity, mode: "insensitive" },
        marketState: { equals: searchState, mode: "insensitive" },
        fetchedAt: { gte: cacheCutoff },
      },
      select: { id: true },
    });

    const recentCompletedJob = cacheHit
      ? null
      : await db.scrapeJob.findFirst({
          where: {
            marketKey,
            status: "COMPLETE",
            completedAt: { gte: cacheCutoff },
          },
          select: { id: true, eventCount: true },
        });

    if (!cacheHit && !recentCompletedJob) {
      // Step 2 — check for an in-flight scrape for this market
      const recentJobCutoff = new Date(
        Date.now() - CONCURRENT_JOB_LOOKBACK_MIN * 60 * 1000,
      );
      const existingJob = await db.scrapeJob.findFirst({
        where: {
          marketKey,
          status: { in: ["PENDING", "SCRAPING", "ENRICHING"] },
          startedAt: { gte: recentJobCutoff },
        },
        orderBy: { startedAt: "desc" },
      });

      if (existingJob) {
        // Include quota fields so the client UI stays in sync when joining
        // an existing scrape (e.g. another tab kicked it off)
        const quota = await checkScrapeQuota(
          profile.id,
          marketKey,
          primaryMarketKey,
        );
        return NextResponse.json({
          status: "scraping",
          jobId: existingJob.id,
          stage: existingJob.stage,
          progressPct: existingJob.progressPct,
          marketCity: searchCity,
          marketState: searchState,
          dailyUsed: quota.dailyUsed,
          monthlyUsed: quota.monthlyUsed,
          dailyLimit: DAILY_MARKET_LIMIT,
          monthlyLimit: MONTHLY_MARKET_LIMIT,
        });
      }

      // Step 3 — quota check
      const quota = await checkScrapeQuota(
        profile.id,
        marketKey,
        primaryMarketKey,
      );
      if (!quota.allowed) {
        return NextResponse.json({
          status: "quota_exceeded",
          reason: quota.reason,
          dailyUsed: quota.dailyUsed,
          monthlyUsed: quota.monthlyUsed,
          dailyLimit: DAILY_MARKET_LIMIT,
          monthlyLimit: MONTHLY_MARKET_LIMIT,
        });
      }

      // Step 4 — create job, record usage, kick off background scrape
      const job = await db.scrapeJob.create({
        data: {
          clientProfileId: profile.id,
          marketCity: searchCity,
          marketState: searchState,
          marketKey,
          status: "PENDING",
          stage: "Starting up",
        },
      });

      // Primary market scrapes are free and don't count toward quota
      if (marketKey !== primaryMarketKey) {
        await recordScrapeUsage(profile.id, marketKey);
      }

      // Fire-and-forget — runs after response is sent
      after(async () => {
        await runOnDemandScrape(job.id, searchCity!, searchState!);
      });

      return NextResponse.json({
        status: "scraping",
        jobId: job.id,
        stage: "Starting up",
        progressPct: 0,
        marketCity: searchCity,
        marketState: searchState,
        dailyUsed: quota.dailyUsed + (quota.isAlreadyScrapedToday ? 0 : 1),
        monthlyUsed:
          quota.monthlyUsed + (quota.isAlreadyScrapedThisMonth ? 0 : 1),
        dailyLimit: DAILY_MARKET_LIMIT,
        monthlyLimit: MONTHLY_MARKET_LIMIT,
      });
    }
    // Cache hit OR recent completed scrape — fall through to search logic.
    // If recentCompletedJob has 0 events, the queries below will just return
    // empty arrays and the user sees the empty state.
  }

  // === HOT SEARCH ===
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
          aiScore: e.aiScore,
          isCorporate: e.isCorporate,
          aiCategory: e.aiCategory,
          savedState,
          savedLeadId: saved?.id ?? null,
          contactReady: !!(e.organizerEmail || e.organizerPhone),
        };
      });
    } catch (err) {
      console.error("Hot search failed", err);
    }
  }

  // === WARM SEARCH ===
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
          aiScore: e.aiScore,
          isCorporate: e.isCorporate,
          aiCategory: e.aiCategory,
          savedState,
          savedLeadId: saved?.id ?? null,
          contactReady: !!(e.organizerEmail || e.organizerPhone),
        };
      });
    } catch (err) {
      console.error("Warm search failed", err);
    }
  }

  // === COLD SEARCH ===
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
          }).then((places) => {
            // Filter out results whose Google Places `types` don't match
            // the category. Drops false positives like movie theaters
            // appearing under "casinos." See googlePlaces.ts for whitelist.
            const { kept } = filterPlacesByCategory(places, cat);
            return kept.map((p) => ({ ...p, category: cat }) as EnrichedPlace);
          }),
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

      // Read cached transport-partner signals for these places (shared cache,
      // keyed by googlePlaceId). Missing = not yet checked → null.
      const partnerSignals = await readSignals(placeIds);

      coldResults = allPlaces.map((r) => {
        const saved = savedMap.get(r.placeId);
        const savedState = !saved
          ? "none"
          : saved.isFavorite
            ? "favorite"
            : "pipeline";

        // Deterministic scoring from Google Places signals + search center
        const scoreBreakdown = computeColdScore({
          rating: r.rating,
          reviewCount: r.reviewCount,
          phone: r.phone,
          website: r.website,
          address: r.address,
          name: r.name,
          businessLat: r.coordinates.lat,
          businessLng: r.coordinates.lng,
          primaryLat: lat,
          primaryLng: lng,
          serviceRadiusMiles: radiusMiles,
        });

        const sig = partnerSignals.get(r.placeId);

        return {
          ...r,
          temperature: "cold" as const,
          savedState,
          savedLeadId: saved?.id ?? null,
          contactReady: false,
          aiScore: scoreBreakdown.total,
          aiScoreReasoning: generateColdScoreReasoning(scoreBreakdown),
          // --- Lead-quality filters (Feature #6, phase 1) ---
          isRecurring: isRecurringCategory(r.category),
          hasTransportPartner: sig?.hasPartner ?? null,
          partnerEvidence: sig?.evidence ?? null,
        };
      });

      // Warm the shared signal cache in the background for any place we don't
      // have (or whose check is stale). Runs after the response is sent.
      after(() =>
        backfillSignals(
          allPlaces.map((p) => ({
            placeId: p.placeId,
            website: p.website ?? null,
          })),
        ),
      );
    } catch (err) {
      console.error("Cold search failed", err);
    }
  }

  const results = [...hotResults, ...warmResults, ...coldResults];

  return NextResponse.json({
    status: "ok",
    results,
    center: lat != null && lng != null ? { lat, lng } : null,
    radiusMiles,
  });
}
