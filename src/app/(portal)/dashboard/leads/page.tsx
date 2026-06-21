/* eslint-disable @typescript-eslint/no-unused-vars */
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "../../../../../auth";
import { db } from "@/lib/db";
import { getProductAccess } from "@/lib/subscriptions";
import { LeadStatus } from "@prisma/client";
import OnboardingModal from "./OnboardingModal";
import styles from "./LeadsPage.module.css";
import RoiSummary from "./RoiSummary";

export const dynamic = "force-dynamic";

const HOT_THRESHOLD_DAYS = 14;

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ welcome?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const profile = await db.clientProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!profile) redirect("/dashboard");

  const access = await getProductAccess(profile.id);
  const isAdmin = session.user.roles?.includes("ADMIN") ?? false;
  if (!access.hasLeads && !isAdmin) {
    redirect("/dashboard/enroll/leads");
  }

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
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const fourteenDaysOut = new Date(
    now.getTime() + HOT_THRESHOLD_DAYS * 24 * 60 * 60 * 1000,
  );

  // Need settings first to query market-scoped hot events
  const settings = await db.leadsSettings.findUnique({
    where: { clientProfileId: profile.id },
  });

  const [
    snoozesDueToday,
    nextActionsDueToday,
    staleNewLeads,
    newThisWeek,
    pipelineGroups,
    wonThisMonth,
    hotMarketEvents,
  ] = await Promise.all([
    db.savedLead.findMany({
      where: {
        clientProfileId: profile.id,
        status: "SNOOZED",
        snoozeUntil: { lte: endOfToday },
      },
      orderBy: { snoozeUntil: "asc" },
      take: 10,
      select: {
        id: true,
        businessName: true,
        leadType: true,
        snoozeUntil: true,
        googlePlaceId: true,
        category: true,
      },
    }),
    db.savedLead.findMany({
      where: {
        clientProfileId: profile.id,
        nextActionAt: { lte: endOfToday },
        status: { notIn: ["WON", "DEAD"] },
      },
      orderBy: { nextActionAt: "asc" },
      take: 10,
      select: {
        id: true,
        businessName: true,
        leadType: true,
        nextActionAt: true,
        nextActionNote: true,
        googlePlaceId: true,
        category: true,
      },
    }),
    db.savedLead.findMany({
      where: {
        clientProfileId: profile.id,
        status: "NEW",
        createdAt: { lt: sevenDaysAgo },
        lastContactedAt: null,
      },
      orderBy: { createdAt: "asc" },
      take: 10,
      select: {
        id: true,
        businessName: true,
        leadType: true,
        createdAt: true,
        googlePlaceId: true,
        category: true,
      },
    }),
    db.savedLead.count({
      where: {
        clientProfileId: profile.id,
        createdAt: { gte: sevenDaysAgo },
      },
    }),
    db.savedLead.groupBy({
      by: ["status"],
      where: { clientProfileId: profile.id },
      _count: { _all: true },
    }),
    db.savedLead.count({
      where: {
        clientProfileId: profile.id,
        status: "WON",
        wonAt: { gte: startOfMonth },
      },
    }),
    // === HOT IN MARKET (chunk 6) ===
    // Eventbrite events ≤14 days out, scoped to operator's market.
    // Shown as urgent opportunities on the daily home.
    settings?.primaryCity && settings?.primaryState
      ? db.eventbriteEvent.findMany({
          where: {
            marketCity: {
              equals: settings.primaryCity,
              mode: "insensitive",
            },
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
            aiCategory: true,
            expectedAttendance: true,
          },
        })
      : Promise.resolve([]),
  ]);

  const validSnoozes = snoozesDueToday.filter((l) => l.googlePlaceId);
  const validNextActions = nextActionsDueToday.filter((l) => l.googlePlaceId);
  const validStaleLeads = staleNewLeads.filter((l) => l.googlePlaceId);

  const onboardingComplete = !!settings?.onboardingCompletedAt;
  const { welcome } = await searchParams;

  const savedCount = pipelineGroups.reduce((sum, g) => sum + g._count._all, 0);

  const countByStatus = (status: LeadStatus) =>
    pipelineGroups.find((g) => g.status === status)?._count._all ?? 0;

  const attentionCount =
    validSnoozes.length + validNextActions.length + validStaleLeads.length;

  const daysSince = (d: Date) =>
    Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));

  const daysUntil = (d: Date) =>
    Math.max(
      0,
      Math.floor((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
    );

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <p className={styles.eyebrow}>Fonts &amp; Footers — Leads</p>
        <h1 className={`${styles.heading} h2`}>Lead Feed</h1>
      </div>

      {!onboardingComplete && <OnboardingModal welcomeFlow={!!welcome} />}

      {onboardingComplete && (
        <div className={styles.body}>
          <RoiSummary clientProfileId={profile.id} />

          <section className={styles.marketCard}>
            <div>
              <p className={styles.marketLabel}>Your market</p>
              <p className={styles.marketValue}>
                {settings?.primaryCity}, {settings?.primaryState}
                <span className={styles.marketRadius}>
                  &nbsp;· {settings?.serviceRadiusMiles}-mile radius
                </span>
              </p>
            </div>
            <Link href='/dashboard/leads/settings' className={styles.marketCta}>
              Manage settings →
            </Link>
          </section>

          {/* === HOT IN MARKET (chunk 6) === */}
          {hotMarketEvents.length > 0 && (
            <section className={styles.attentionCard}>
              <div className={styles.sectionHeader}>
                <p className={styles.sectionEyebrow}>🔥 Hot in your market</p>
                <h2 className={styles.sectionTitle}>
                  Events happening in the next 14 days
                </h2>
                <span className={styles.attentionCount}>
                  {hotMarketEvents.length}
                </span>
              </div>
              <div className={styles.attentionLists}>
                <div className={styles.attentionGroup}>
                  <p className={styles.attentionGroupLabel}>
                    Respond now — organizers are finalizing logistics
                  </p>
                  <ul className={styles.attentionList}>
                    {hotMarketEvents.map((e) => {
                      const days = daysUntil(e.eventDate);
                      const meta = [
                        days === 0
                          ? "Today"
                          : days === 1
                            ? "Tomorrow"
                            : `${days} days away`,
                        e.venueName,
                        e.isCorporate ? "Corporate" : null,
                        e.aiScore != null ? `score ${e.aiScore}` : null,
                      ]
                        .filter(Boolean)
                        .join(" · ");
                      return (
                        <li key={e.eventbriteId}>
                          <Link
                            href={`/dashboard/leads/hot/${e.eventbriteId}`}
                            className={styles.attentionItem}
                          >
                            <span className={styles.attentionName}>
                              {e.eventName}
                            </span>
                            <span className={styles.attentionMeta}>{meta}</span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            </section>
          )}

          {savedCount > 0 ? (
            <>
              <section className={styles.attentionCard}>
                <div className={styles.sectionHeader}>
                  <p className={styles.sectionEyebrow}>Today</p>
                  <h2 className={styles.sectionTitle}>Needs your attention</h2>
                  {attentionCount > 0 && (
                    <span className={styles.attentionCount}>
                      {attentionCount}
                    </span>
                  )}
                </div>

                {attentionCount === 0 ? (
                  <p className={styles.allCaughtUp}>All caught up.</p>
                ) : (
                  <div className={styles.attentionLists}>
                    {validSnoozes.length > 0 && (
                      <div className={styles.attentionGroup}>
                        <p className={styles.attentionGroupLabel}>
                          Snoozed leads ready ({validSnoozes.length})
                        </p>
                        <ul className={styles.attentionList}>
                          {validSnoozes.map((l) => (
                            <li key={l.id}>
                              <Link
                                href={`/dashboard/leads/cold/${l.googlePlaceId}?category=${l.category}`}
                                className={styles.attentionItem}
                              >
                                <span className={styles.attentionName}>
                                  {l.businessName ?? "Unnamed lead"}
                                </span>
                                <span className={styles.attentionMeta}>
                                  Snooze ended
                                </span>
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {validNextActions.length > 0 && (
                      <div className={styles.attentionGroup}>
                        <p className={styles.attentionGroupLabel}>
                          Next actions due ({validNextActions.length})
                        </p>
                        <ul className={styles.attentionList}>
                          {validNextActions.map((l) => (
                            <li key={l.id}>
                              <Link
                                href={`/dashboard/leads/cold/${l.googlePlaceId}?category=${l.category}`}
                                className={styles.attentionItem}
                              >
                                <span className={styles.attentionName}>
                                  {l.businessName ?? "Unnamed lead"}
                                </span>
                                <span className={styles.attentionMeta}>
                                  {l.nextActionNote ?? "Follow up"}
                                </span>
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* {validStaleLeads.length > 0 && (
                      <div className={styles.attentionGroup}>
                        <p className={styles.attentionGroupLabel}>
                          Untouched for 7+ days ({validStaleLeads.length})
                        </p>
                        <ul className={styles.attentionList}>
                          {validStaleLeads.map((l) => (
                            <li key={l.id}>
                              <Link
                                href={`/dashboard/leads/cold/${l.googlePlaceId}?category=${l.category}`}
                                className={styles.attentionItem}
                              >
                                <span className={styles.attentionName}>
                                  {l.businessName ?? "Unnamed lead"}
                                </span>
                                <span className={styles.attentionMeta}>
                                  Saved {daysSince(l.createdAt)} days ago
                                </span>
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )} */}
                  </div>
                )}
              </section>

              <section className={styles.pipelineCard}>
                <div className={styles.sectionHeader}>
                  <p className={styles.sectionEyebrow}>Pipeline</p>
                  <h2 className={styles.sectionTitle}>
                    Where everything stands
                  </h2>
                </div>
                <div className={styles.pipelineGrid}>
                  <Link
                    href='/dashboard/leads/saved?status=NEW'
                    className={styles.pipelineStat}
                  >
                    <span className={styles.pipelineCount}>
                      {countByStatus("NEW")}
                    </span>
                    <span className={styles.pipelineLabel}>New</span>
                  </Link>
                  <Link
                    href='/dashboard/leads/saved?status=CONTACTED'
                    className={styles.pipelineStat}
                  >
                    <span className={styles.pipelineCount}>
                      {countByStatus("CONTACTED")}
                    </span>
                    <span className={styles.pipelineLabel}>Contacted</span>
                  </Link>
                  <Link
                    href='/dashboard/leads/saved?status=NURTURING'
                    className={styles.pipelineStat}
                  >
                    <span className={styles.pipelineCount}>
                      {countByStatus("NURTURING")}
                    </span>
                    <span className={styles.pipelineLabel}>Nurturing</span>
                  </Link>
                  <Link
                    href='/dashboard/leads/saved?status=WON'
                    className={styles.pipelineStat}
                  >
                    <span className={styles.pipelineCount}>{wonThisMonth}</span>
                    <span className={styles.pipelineLabel}>Won this month</span>
                  </Link>
                </div>
                <div className={styles.pipelineFooter}>
                  <p className={styles.pipelineFooterText}>
                    {newThisWeek > 0 ? (
                      <>
                        <strong>{newThisWeek}</strong> new lead
                        {newThisWeek === 1 ? "" : "s"} saved in the last 7 days
                      </>
                    ) : (
                      <>No new leads saved this week — try a new search.</>
                    )}
                  </p>
                  <Link
                    href='/dashboard/leads/saved'
                    className={styles.pipelineCta}
                  >
                    View pipeline →
                  </Link>
                </div>
              </section>

              {/* === EXPLORE (chunk 6: Hot + Warm now LIVE) === */}
              <section className={styles.exploreSection}>
                <div className={styles.sectionHeader}>
                  <p className={styles.sectionEyebrow}>Find more</p>
                  <h2 className={styles.sectionTitle}>Explore lead sources</h2>
                </div>
                <div className={styles.exploreGrid}>
                  <Link
                    href='/dashboard/leads/search'
                    className={styles.exploreTile}
                  >
                    <span className={styles.exploreBadgeLive}>Live</span>
                    <h3 className={styles.exploreTitle}>Hot Leads</h3>
                    <p className={styles.exploreDesc}>
                      Events in your market in the next 14 days. Respond now to
                      win the booking.
                    </p>
                  </Link>
                  <Link
                    href='/dashboard/leads/search'
                    className={styles.exploreTile}
                  >
                    <span className={styles.exploreBadgeLive}>Live</span>
                    <h3 className={styles.exploreTitle}>Warm Leads</h3>
                    <p className={styles.exploreDesc}>
                      Events 2-12 weeks out — organizers still finalizing
                      transportation.
                    </p>
                  </Link>
                  <Link
                    href='/dashboard/leads/search'
                    className={styles.exploreTile}
                  >
                    <span className={styles.exploreBadgeLive}>Live</span>
                    <h3 className={styles.exploreTitle}>Cold Leads</h3>
                    <p className={styles.exploreDesc}>
                      Venues, hotels, corporate offices that match your ICP.
                    </p>
                  </Link>
                </div>
              </section>
            </>
          ) : (
            <>
              {/* First-time empty state — explainer cards. Updated copy. */}
              <section className={styles.feedCard}>
                <div className={styles.feedHeader}>
                  <span className={styles.statusBadgeLive}>Live</span>
                  <h2 className={styles.feedTitle}>Hot Leads</h2>
                </div>
                <p className={styles.feedDesc}>
                  Events happening in the next 14 days in your market —
                  organizers are finalizing transportation right now. Respond
                  today to beat competitors.
                </p>
                <Link href='/dashboard/leads/search' className={styles.feedCta}>
                  See hot leads →
                </Link>
              </section>

              <section className={styles.feedCard}>
                <div className={styles.feedHeader}>
                  <span className={styles.statusBadgeLive}>Live</span>
                  <h2 className={styles.feedTitle}>Warm Leads</h2>
                </div>
                <p className={styles.feedDesc}>
                  Events 15-90 days out in your market — pitch organizers before
                  they finalize transport vendors. Includes full enrichment with
                  venue and organizer contacts.
                </p>
                <Link href='/dashboard/leads/search' className={styles.feedCta}>
                  See warm leads →
                </Link>
              </section>

              <section className={styles.feedCard}>
                <div className={styles.feedHeader}>
                  <span className={styles.statusBadgeLive}>Live</span>
                  <h2 className={styles.feedTitle}>Cold Leads</h2>
                </div>
                <p className={styles.feedDesc}>
                  Search businesses that match your ideal customer profile —
                  wedding venues, hotels, law firms, country clubs, corporate
                  offices.
                </p>
                <Link href='/dashboard/leads/search' className={styles.feedCta}>
                  Search for leads →
                </Link>
              </section>
            </>
          )}
        </div>
      )}
    </div>
  );
}
