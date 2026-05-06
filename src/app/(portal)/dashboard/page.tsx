import { getClientProfile } from "@/actions/client/getClientProfile";
import { auth } from "../../../../auth";
import styles from "./DashboardPage.module.css";
import Link from "next/link";

// ── Mock subscription state — replace with real data later ──
// Same as the layout for now. Eventually pull from getClientProfile.
const MOCK_SUBSCRIPTIONS = {
  hasWebsite: true,
  hasLeads: false,
};

export default async function DashboardPage() {
  const session = await auth();
  const profile = await getClientProfile();

  const firstName = session?.user?.name?.split(" ")[0] ?? "there";
  const isLive = profile?.onboardingStage === "SITE_LIVE";
  const liveUrl = profile?.liveUrl ?? null;

  return (
    <div className={styles.page}>
      {/* ── Header ── */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <p className={styles.greeting}>Welcome back,</p>
          <h1 className={`${styles.heading} h2`}>{firstName}</h1>
          {profile?.businessName && (
            <p className={styles.businessName}>{profile.businessName}</p>
          )}
        </div>
      </div>

      {/* ── Section heading ── */}
      <div className={styles.sectionHeader}>
        <span className={styles.sectionNumber}>01.</span>
        <h2 className={styles.sectionHeading}>Your Products</h2>
      </div>

      {/* ── Two-card product overview ── */}
      <div className={styles.productGrid}>
        {/* WEBSITE CARD */}
        {MOCK_SUBSCRIPTIONS.hasWebsite ? (
          <Link href='/dashboard/website' className={styles.productCard}>
            <div className={styles.productCardTop}>
              <div className={styles.productStatus}>
                <span className={styles.statusDot} />
                <span className={styles.statusLabel}>
                  {isLive ? "Live" : "In Progress"}
                </span>
              </div>
              <span className={styles.productPrice}>$499/mo</span>
            </div>
            <div className={styles.productCardMain}>
              <span className={styles.productLabel}>Product 01</span>
              <h3 className={styles.productTitle}>Custom Website</h3>
              <p className={styles.productDesc}>
                {isLive
                  ? "Your platform is live and taking bookings."
                  : "Your platform is currently being built. Check your project status for next steps."}
              </p>
            </div>
            <div className={styles.productCardBottom}>
              <span className={styles.productCta}>
                Manage Website
                <svg
                  width='14'
                  height='14'
                  viewBox='0 0 24 24'
                  fill='none'
                  stroke='currentColor'
                  strokeWidth='2'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                >
                  <line x1='5' y1='12' x2='19' y2='12' />
                  <polyline points='12 5 19 12 12 19' />
                </svg>
              </span>
              {isLive && liveUrl && (
                <a
                  href={liveUrl}
                  target='_blank'
                  rel='noopener noreferrer'
                  // onClick={(e) => e.stopPropagation()}
                  className={styles.productSecondaryCta}
                >
                  Visit Site ↗
                </a>
              )}
            </div>
          </Link>
        ) : (
          <div className={`${styles.productCard} ${styles.productCardGhost}`}>
            <div className={styles.productCardTop}>
              <div className={styles.productStatus}>
                <span
                  className={`${styles.statusDot} ${styles.statusDotInactive}`}
                />
                <span className={styles.statusLabel}>Not Enrolled</span>
              </div>
              <span className={styles.productPrice}>$499/mo</span>
            </div>
            <div className={styles.productCardMain}>
              <span className={styles.productLabel}>Product 01</span>
              <h3 className={styles.productTitle}>Custom Website</h3>
              <p className={styles.productDesc}>
                A custom booking platform built for black car operators. Direct
                booking, no per-booking fees, flight tracking, driver portal —
                everything included.
              </p>
            </div>
            <div className={styles.productCardBottom}>
              <Link
                href='/dashboard/enroll/website'
                className={styles.productEnrollCta}
              >
                Get Started
                <svg
                  width='14'
                  height='14'
                  viewBox='0 0 24 24'
                  fill='none'
                  stroke='currentColor'
                  strokeWidth='2'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                >
                  <line x1='5' y1='12' x2='19' y2='12' />
                  <polyline points='12 5 19 12 12 19' />
                </svg>
              </Link>
            </div>
          </div>
        )}

        {/* LEADS CARD */}
        {MOCK_SUBSCRIPTIONS.hasLeads ? (
          <Link href='/dashboard/leads' className={styles.productCard}>
            <div className={styles.productCardTop}>
              <div className={styles.productStatus}>
                <span className={styles.statusDot} />
                <span className={styles.statusLabel}>Active</span>
              </div>
              <span className={styles.productPrice}>$125/mo</span>
            </div>
            <div className={styles.productCardMain}>
              <span className={styles.productLabel}>Product 02</span>
              <h3 className={styles.productTitle}>Leads Tool</h3>
              <p className={styles.productDesc}>
                Find your next corporate account before your competitor does.
                Hot, warm, and cold leads delivered to your dashboard daily.
              </p>
            </div>
            <div className={styles.productCardBottom}>
              <span className={styles.productCta}>
                Open Leads Tool
                <svg
                  width='14'
                  height='14'
                  viewBox='0 0 24 24'
                  fill='none'
                  stroke='currentColor'
                  strokeWidth='2'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                >
                  <line x1='5' y1='12' x2='19' y2='12' />
                  <polyline points='12 5 19 12 12 19' />
                </svg>
              </span>
            </div>
          </Link>
        ) : (
          <div className={`${styles.productCard} ${styles.productCardGhost}`}>
            <div className={styles.productCardTop}>
              <div className={styles.productStatus}>
                <span
                  className={`${styles.statusDot} ${styles.statusDotInactive}`}
                />
                <span className={styles.statusLabel}>Not Enrolled</span>
              </div>
              <span className={styles.productPrice}>$125/mo</span>
            </div>
            <div className={styles.productCardMain}>
              <span className={styles.productLabel}>Product 02</span>
              <h3 className={styles.productTitle}>Leads Tool</h3>
              <p className={styles.productDesc}>
                Find your next corporate account before your competitor does.
                Hot, warm, and cold leads delivered to your dashboard daily.
              </p>
            </div>
            <div className={styles.productCardBottom}>
              <Link
                href='/dashboard/enroll/leads'
                className={styles.productEnrollCta}
              >
                Get Started
                <svg
                  width='14'
                  height='14'
                  viewBox='0 0 24 24'
                  fill='none'
                  stroke='currentColor'
                  strokeWidth='2'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                >
                  <line x1='5' y1='12' x2='19' y2='12' />
                  <polyline points='12 5 19 12 12 19' />
                </svg>
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* ── Quick links ── */}
      <div className={styles.quickLinks}>
        <Link href='/dashboard/billing' className={styles.quickLink}>
          <span className={styles.quickLinkLabel}>Billing & Invoices</span>
          <svg
            width='16'
            height='16'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
          >
            <line x1='5' y1='12' x2='19' y2='12' />
            <polyline points='12 5 19 12 12 19' />
          </svg>
        </Link>
        <Link href='/dashboard/support' className={styles.quickLink}>
          <span className={styles.quickLinkLabel}>Get Support</span>
          <svg
            width='16'
            height='16'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
          >
            <line x1='5' y1='12' x2='19' y2='12' />
            <polyline points='12 5 19 12 12 19' />
          </svg>
        </Link>
        <Link href='/dashboard/profile' className={styles.quickLink}>
          <span className={styles.quickLinkLabel}>Account Profile</span>
          <svg
            width='16'
            height='16'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
          >
            <line x1='5' y1='12' x2='19' y2='12' />
            <polyline points='12 5 19 12 12 19' />
          </svg>
        </Link>
      </div>
    </div>
  );
}
