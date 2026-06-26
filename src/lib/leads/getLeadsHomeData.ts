// Data layer for the Leads Home page. Salvages the queries the old Lead Feed
// page ran, adds non-draft-aware state detection, and assembles a single typed
// object the page branches on. Reusable later by the weekly digest (#4).

import { db } from "@/lib/db";
import { LeadStatus } from "@prisma/client";

const HOT_THRESHOLD_DAYS = 14;
const STALE_DAYS = 7;
const MAX_NEXT_MOVES = 6;

export type LeadsHomeState = "SETUP" | "TRIAL_EMPTY" | "ESTABLISHED";

export type NextMove = {
  id: string;
  kind: "followup" | "snooze" | "stale";
  businessName: string;
  reason: string;
  href: string;
};

export type HotMarketEvent = {
  eventbriteId: string;
  eventName: string;
  eventDateIso: string;
  venueName: string | null;
  aiScore: number | null;
  isCorporate: boolean | null;
  daysUntil: number;
};

export type LeadsHomeData = {
  state: LeadsHomeState;
  onboardingComplete: boolean;
  market: {
    city: string | null;
    state: string | null;
    radiusMiles: number | null;
  } | null;
  savedNonDraftCount: number;
  pipeline: {
    new: number;
    contacted: number;
    nurturing: number;
    wonThisMonth: number;
    followUpsDue: number;
    snoozesDue: number;
    newThisWeek: number;
  };
  nextMoves: NextMove[];
  hotMarketEvents: HotMarketEvent[];
};

function coldHref(googlePlaceId: string, category: string | null): string {
  const base = `/dashboard/leads/cold/${googlePlaceId}`;
  return category ? `${base}?category=${encodeURIComponent(category)}` : base;
}

export async function getLeadsHomeData(
  clientProfileId: string,
): Promise<LeadsHomeData> {
  const now = new Date();
  const endOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    23,
    59,
    59,
    999,
  );
  const sevenDaysAgo = new Date(now.getTime() - STALE_DAYS * 86_400_000);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const fourteenDaysOut = new Date(
    now.getTime() + HOT_THRESHOLD_DAYS * 86_400_000,
  );

  const settings = await db.leadsSettings.findUnique({
    where: { clientProfileId },
  });

  const [
    snoozesDueToday,
    nextActionsDueToday,
    staleNewLeads,
    newThisWeek,
    pipelineGroups,
    wonThisMonth,
    savedNonDraftCount,
    hotMarketEventsRaw,
  ] = await Promise.all([
    db.savedLead.findMany({
      where: {
        clientProfileId,
        status: "SNOOZED",
        snoozeUntil: { lte: endOfToday },
      },
      orderBy: { snoozeUntil: "asc" },
      take: 10,
      select: {
        id: true,
        businessName: true,
        snoozeUntil: true,
        googlePlaceId: true,
        category: true,
      },
    }),
    db.savedLead.findMany({
      where: {
        clientProfileId,
        nextActionAt: { lte: endOfToday },
        status: { notIn: ["WON", "DEAD"] },
      },
      orderBy: { nextActionAt: "asc" },
      take: 10,
      select: {
        id: true,
        businessName: true,
        nextActionNote: true,
        googlePlaceId: true,
        category: true,
      },
    }),
    db.savedLead.findMany({
      where: {
        clientProfileId,
        status: "NEW",
        createdAt: { lt: sevenDaysAgo },
        lastContactedAt: null,
      },
      orderBy: { createdAt: "asc" },
      take: 10,
      select: {
        id: true,
        businessName: true,
        createdAt: true,
        googlePlaceId: true,
        category: true,
      },
    }),
    db.savedLead.count({
      where: {
        clientProfileId,
        createdAt: { gte: sevenDaysAgo },
        isDraft: false,
      },
    }),
    db.savedLead.groupBy({
      by: ["status"],
      where: { clientProfileId, isDraft: false },
      _count: { _all: true },
    }),
    db.savedLead.count({
      where: { clientProfileId, status: "WON", wonAt: { gte: startOfMonth } },
    }),
    db.savedLead.count({ where: { clientProfileId, isDraft: false } }),
    settings?.primaryCity && settings?.primaryState
      ? db.eventbriteEvent.findMany({
          where: {
            marketCity: { equals: settings.primaryCity, mode: "insensitive" },
            marketState: {
              equals: settings.primaryState,
              mode: "insensitive",
            },
            eventDate: { gte: now, lte: fourteenDaysOut },
          },
          orderBy: [{ aiScore: "desc" }, { eventDate: "asc" }],
          take: 5,
          select: {
            eventbriteId: true,
            eventName: true,
            eventDate: true,
            venueName: true,
            aiScore: true,
            isCorporate: true,
          },
        })
      : Promise.resolve([]),
  ]);

  const countByStatus = (status: LeadStatus) =>
    pipelineGroups.find((g) => g.status === status)?._count._all ?? 0;

  const daysSince = (d: Date) =>
    Math.floor((now.getTime() - d.getTime()) / 86_400_000);
  const daysUntil = (d: Date) =>
    Math.max(0, Math.floor((d.getTime() - now.getTime()) / 86_400_000));

  // Ranked "This Week" list: follow-ups first, then woken snoozes, then stale.
  // Cold-only (needs googlePlaceId for the detail link) — matches prior behavior.
  const moves: NextMove[] = [];
  for (const l of nextActionsDueToday) {
    if (!l.googlePlaceId) continue;
    moves.push({
      id: l.id,
      kind: "followup",
      businessName: l.businessName ?? "Unnamed lead",
      reason: l.nextActionNote ?? "Follow-up due",
      href: coldHref(l.googlePlaceId, l.category),
    });
  }
  for (const l of snoozesDueToday) {
    if (!l.googlePlaceId) continue;
    moves.push({
      id: l.id,
      kind: "snooze",
      businessName: l.businessName ?? "Unnamed lead",
      reason: "Snooze ended — time to follow up",
      href: coldHref(l.googlePlaceId, l.category),
    });
  }
  for (const l of staleNewLeads) {
    if (!l.googlePlaceId) continue;
    moves.push({
      id: l.id,
      kind: "stale",
      businessName: l.businessName ?? "Unnamed lead",
      reason: `Untouched ${daysSince(l.createdAt)} days`,
      href: coldHref(l.googlePlaceId, l.category),
    });
  }

  const onboardingComplete = !!settings?.onboardingCompletedAt;
  const state: LeadsHomeState = !onboardingComplete
    ? "SETUP"
    : savedNonDraftCount === 0
      ? "TRIAL_EMPTY"
      : "ESTABLISHED";

  return {
    state,
    onboardingComplete,
    market: settings
      ? {
          city: settings.primaryCity,
          state: settings.primaryState,
          radiusMiles: settings.serviceRadiusMiles,
        }
      : null,
    savedNonDraftCount,
    pipeline: {
      new: countByStatus("NEW"),
      contacted: countByStatus("CONTACTED"),
      nurturing: countByStatus("NURTURING"),
      wonThisMonth,
      followUpsDue: nextActionsDueToday.filter((l) => l.googlePlaceId).length,
      snoozesDue: snoozesDueToday.filter((l) => l.googlePlaceId).length,
      newThisWeek,
    },
    nextMoves: moves.slice(0, MAX_NEXT_MOVES),
    hotMarketEvents: hotMarketEventsRaw.map((e) => ({
      eventbriteId: e.eventbriteId,
      eventName: e.eventName,
      eventDateIso: e.eventDate.toISOString(),
      venueName: e.venueName,
      aiScore: e.aiScore,
      isCorporate: e.isCorporate,
      daysUntil: daysUntil(e.eventDate),
    })),
  };
}
