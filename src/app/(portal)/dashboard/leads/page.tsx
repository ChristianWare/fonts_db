import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "../../../../../auth";
import { db } from "@/lib/db";
import { getProductAccess } from "@/lib/subscriptions";
import OnboardingModal from "./OnboardingModal";
import styles from "./LeadsPage.module.css";

export const dynamic = "force-dynamic";

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

  const [settings, savedCount] = await Promise.all([
    db.leadsSettings.findUnique({
      where: { clientProfileId: profile.id },
    }),
    db.savedLead.count({
      where: { clientProfileId: profile.id },
    }),
  ]);

  const onboardingComplete = !!settings?.onboardingCompletedAt;
  const { welcome } = await searchParams;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <p className={styles.eyebrow}>Fonts &amp; Footers — Leads</p>
        <h1 className={styles.heading}>Lead Feed</h1>
      </div>

      {!onboardingComplete && <OnboardingModal welcomeFlow={!!welcome} />}

      {onboardingComplete && (
        <div className={styles.body}>
          {/* Market info bar */}
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

          {/* Cold Leads — LIVE */}
          <section className={styles.feedCard}>
            <div className={styles.feedHeader}>
              <span className={styles.statusBadgeLive}>Live</span>
              <h2 className={styles.feedTitle}>Cold Leads</h2>
            </div>
            <p className={styles.feedDesc}>
              Search for businesses that match your ideal customer profile —
              wedding venues, hotels, law firms, country clubs. Find them by
              category and radius, save the ones you want to pursue, and
              we&apos;ll generate AI outreach scripts for each.
            </p>
            <Link href='/dashboard/leads/search' className={styles.feedCta}>
              Search for leads →
            </Link>
          </section>

          {/* Hot Leads — COMING SOON */}
          <section className={`${styles.feedCard} ${styles.feedCardSoon}`}>
            <div className={styles.feedHeader}>
              <span className={styles.statusBadgeSoon}>Coming soon</span>
              <h2 className={styles.feedTitle}>Hot Leads</h2>
            </div>
            <p className={styles.feedDesc}>
              Real-time leads scraped from Facebook groups, Nextdoor, and
              Eventbrite — people in your market actively asking for the
              services you provide. SMS alerts the moment one drops.
            </p>
          </section>

          {/* Warm Leads — COMING SOON */}
          <section className={`${styles.feedCard} ${styles.feedCardSoon}`}>
            <div className={styles.feedHeader}>
              <span className={styles.statusBadgeSoon}>Coming soon</span>
              <h2 className={styles.feedTitle}>Warm Leads</h2>
            </div>
            <p className={styles.feedDesc}>
              Signal-based opportunities — new hotels opening in your area,
              corporate events being scheduled, venues hiring transportation
              coordinators. Surfaced before your competitors notice.
            </p>
          </section>

          {/* Saved leads summary — only shows if there are any */}
          {savedCount > 0 && (
            <section className={styles.savedCard}>
              <div>
                <p className={styles.savedCount}>{savedCount}</p>
                <p className={styles.savedLabel}>
                  saved lead{savedCount === 1 ? "" : "s"} in your pipeline
                </p>
              </div>
              <Link href='/dashboard/leads/saved' className={styles.savedCta}>
                View pipeline →
              </Link>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
