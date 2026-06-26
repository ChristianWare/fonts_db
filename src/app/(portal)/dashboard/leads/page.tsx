import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "../../../../../auth";
import { db } from "@/lib/db";
import { getProductAccess } from "@/lib/subscriptions";
import { getLeadsHomeData } from "@/lib/leads/getLeadsHomeData";
import OnboardingModal from "./OnboardingModal";
import RoiSummary from "./RoiSummary";
import styles from "./LeadsPage.module.css";

export const dynamic = "force-dynamic";

export default async function LeadsHomePage({
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

  const { welcome } = await searchParams;
  const data = await getLeadsHomeData(profile.id);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <p className={styles.eyebrow}>Fonts &amp; Footers — Leads</p>
        <h1 className={`${styles.heading} h2`}>Today</h1>
      </div>

      {/* SETUP — onboarding not finished: one job, set the market */}
      {data.state === "SETUP" && <OnboardingModal welcomeFlow={!!welcome} />}

      {data.state !== "SETUP" && (
        <div className={styles.body}>
          {/* M9 — Market card (both states) */}
          <section className={styles.marketCard}>
            <div>
              <p className={styles.marketLabel}>Your market</p>
              <p className={styles.marketValue}>
                {data.market?.city}, {data.market?.state}
                <span className={styles.marketRadius}>
                  &nbsp;· {data.market?.radiusMiles}-mile radius
                </span>
              </p>
            </div>
            <Link href='/dashboard/leads/settings' className={styles.marketCta}>
              Manage settings →
            </Link>
          </section>

          {/* HOT IN MARKET — urgent; shown in both states when present */}
          {data.hotMarketEvents.length > 0 && (
            <section className={styles.attentionCard}>
              <div className={styles.sectionHeader}>
                <p className={styles.sectionEyebrow}>🔥 Hot in your market</p>
                <h2 className={styles.sectionTitle}>
                  Events in the next 14 days
                </h2>
                <span className={styles.attentionCount}>
                  {data.hotMarketEvents.length}
                </span>
              </div>
              <ul className={styles.attentionList}>
                {data.hotMarketEvents.map((e) => {
                  const meta = [
                    e.daysUntil === 0
                      ? "Today"
                      : e.daysUntil === 1
                        ? "Tomorrow"
                        : `${e.daysUntil} days away`,
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
            </section>
          )}

          {data.state === "ESTABLISHED" ? (
            <>
              {/* M1 — THIS WEEK / NEXT MOVES (hero) */}
              <section className={styles.attentionCard}>
                <div className={styles.sectionHeader}>
                  <p className={styles.sectionEyebrow}>This week</p>
                  <h2 className={styles.sectionTitle}>Your next moves</h2>
                  {data.nextMoves.length > 0 && (
                    <span className={styles.attentionCount}>
                      {data.nextMoves.length}
                    </span>
                  )}
                </div>
                {data.nextMoves.length === 0 ? (
                  <p className={styles.allCaughtUp}>
                    All caught up. Pull fresh leads or work your pipeline below.
                  </p>
                ) : (
                  <ul className={styles.attentionList}>
                    {data.nextMoves.map((m) => (
                      <li key={m.id}>
                        <Link href={m.href} className={styles.attentionItem}>
                          <span className={styles.attentionName}>
                            {m.businessName}
                          </span>
                          <span className={styles.attentionMeta}>
                            {m.reason}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              {/* M2 — ROI (returns null until something is Won with a value) */}
              <RoiSummary clientProfileId={profile.id} />

              {/* M6 — PIPELINE STRIP */}
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
                      {data.pipeline.new}
                    </span>
                    <span className={styles.pipelineLabel}>New</span>
                  </Link>
                  <Link
                    href='/dashboard/leads/saved?status=CONTACTED'
                    className={styles.pipelineStat}
                  >
                    <span className={styles.pipelineCount}>
                      {data.pipeline.contacted}
                    </span>
                    <span className={styles.pipelineLabel}>Contacted</span>
                  </Link>
                  <Link
                    href='/dashboard/leads/saved?status=NURTURING'
                    className={styles.pipelineStat}
                  >
                    <span className={styles.pipelineCount}>
                      {data.pipeline.nurturing}
                    </span>
                    <span className={styles.pipelineLabel}>Nurturing</span>
                  </Link>
                  <Link
                    href='/dashboard/leads/saved?status=WON'
                    className={styles.pipelineStat}
                  >
                    <span className={styles.pipelineCount}>
                      {data.pipeline.wonThisMonth}
                    </span>
                    <span className={styles.pipelineLabel}>Won this month</span>
                  </Link>
                </div>
                <div className={styles.pipelineFooter}>
                  <p className={styles.pipelineFooterText}>
                    {data.pipeline.newThisWeek > 0 ? (
                      <>
                        <strong>{data.pipeline.newThisWeek}</strong> new lead
                        {data.pipeline.newThisWeek === 1 ? "" : "s"} saved in
                        the last 7 days
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

              {/* FIND MORE */}
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
            /* TRIAL_EMPTY — market set, nothing saved yet. Phase 1: nudge +
               explore. The live "your market right now" snapshot is Phase 2. */
            <>
              <section className={styles.attentionCard}>
                <div className={styles.sectionHeader}>
                  <p className={styles.sectionEyebrow}>Start here</p>
                  <h2 className={styles.sectionTitle}>
                    Your market is set — pull your first leads
                  </h2>
                </div>
                <p className={styles.allCaughtUp}>
                  Run a search to see what&apos;s in{" "}
                  {data.market?.city ?? "your market"} right now, then save your
                  first lead to start your pipeline.
                </p>
              </section>

              <section className={styles.feedCard}>
                <div className={styles.feedHeader}>
                  <span className={styles.statusBadgeLive}>Live</span>
                  <h2 className={styles.feedTitle}>Hot Leads</h2>
                </div>
                <p className={styles.feedDesc}>
                  Events happening in the next 14 days in your market —
                  organizers are finalizing transportation right now.
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
                  Events 15-90 days out — pitch organizers before they finalize
                  transport vendors.
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
                  Search businesses that match your ICP — wedding venues,
                  hotels, law firms, country clubs, corporate offices.
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
