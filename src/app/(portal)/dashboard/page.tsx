import { getClientProfile } from "@/actions/client/getClientProfile";
import {
  getProductAccess,
  effectiveHasLeads,
  effectiveHasWebsite,
} from "@/lib/subscriptions";
import { auth } from "../../../../auth";
import styles from "./DashboardPage.module.css";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await auth();
  const profile = await getClientProfile();

  const firstName = session?.user?.name?.split(" ")[0] ?? "there";
  const isLive = profile?.onboardingStage === "SITE_LIVE";
  const liveUrl = profile?.liveUrl ?? null;

  // Product access — admin override only applies when no subscription exists.
  // Once a subscription is in place (active, cancelled, anything), admins
  // are treated like regular customers.
  const isAdmin = session?.user?.roles?.includes("ADMIN") ?? false;
  const access = profile ? await getProductAccess(profile.id) : null;
  const hasLeads = access ? effectiveHasLeads(access, isAdmin) : isAdmin;
  const hasWebsite = access ? effectiveHasWebsite(access, isAdmin) : isAdmin;

  // Website third state: admin approved them into the website flow (stage
  // advanced past REGISTERED) but they haven't paid the setup fee yet, so no
  // active subscription exists. Show "complete setup" instead of "not
  // enrolled". Mirrors the billing page's activation gate.
  const websiteSub =
    profile?.subscriptions?.find((s) => s.productType === "WEBSITE") ?? null;
  const setupFeePaid = profile?.setupFeePaid ?? false;
  const onboardingStage = profile?.onboardingStage ?? "REGISTERED";
  const websitePendingSetup =
    !hasWebsite &&
    (!!websiteSub || onboardingStage !== "REGISTERED") &&
    !setupFeePaid;

  // Pricing — the admin can set custom rates per client, so never hardcode.
  // Active subs show what Stripe actually bills (planAmountCents, synced by
  // the webhook). Pending / not-yet-enrolled website states show the rate the
  // admin set on the profile (defaults to $499). Leads has no per-profile
  // rate, so it falls back to the $125 list price.
  const leadsSub =
    profile?.subscriptions?.find((s) => s.productType === "LEADS") ?? null;

  const fmtMonthly = (cents: number) =>
    `${new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(cents / 100)}/mo`;

  const websitePrice = fmtMonthly(
    websiteSub?.planAmountCents ||
      websiteSub?.monthlyAmountCents ||
      profile?.monthlyAmountCents ||
      49900,
  );
  const leadsPrice = fmtMonthly(
    leadsSub?.planAmountCents || leadsSub?.monthlyAmountCents || 12500,
  );

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
        {hasWebsite ? (
          <Link href='/dashboard/website' className={styles.productCard}>
            <div className={styles.productCardTop}>
              <div className={styles.productStatus}>
                <span className={styles.statusDot} />
                <span className={styles.statusLabel}>
                  {isLive ? "Live" : "In Progress"}
                </span>
              </div>
              <span className={styles.productPrice}>{websitePrice}</span>
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
                  className={styles.productSecondaryCta}
                >
                  Visit Site ↗
                </a>
              )}
            </div>
          </Link>
        ) : websitePendingSetup ? (
          <Link
            href='/dashboard/billing/website'
            className={styles.productCard}
          >
            <div className={styles.productCardTop}>
              <div className={styles.productStatus}>
                <span
                  className={`${styles.statusDot} ${styles.statusDotPending}`}
                />
                <span className={styles.statusLabel}>Payment Needed</span>
              </div>
              <span className={styles.productPrice}>{websitePrice}</span>
            </div>
            <div className={styles.productCardMain}>
              <span className={styles.productLabel}>Product 01</span>
              <h3 className={styles.productTitle}>Custom Website</h3>
              <p className={styles.productDesc}>
                You&apos;re approved. Pay your one-time setup fee to activate
                your website subscription and start your build.
              </p>
            </div>
            <div className={styles.productCardBottom}>
              <span className={styles.productEnrollCta}>
                Complete Setup
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
          <div
            className={`${styles.productCard} ${styles.productCardInactive}`}
          >
            <div className={styles.productCardTop}>
              <div className={styles.productStatus}>
                <span
                  className={`${styles.statusDot} ${styles.statusDotInactive}`}
                />
                <span className={styles.statusLabel}>Not Enrolled</span>
              </div>
              <span className={styles.productPrice}>{websitePrice}</span>
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
        {hasLeads ? (
          <Link href='/dashboard/leads/search' className={styles.productCard}>
            <div className={styles.productCardTop}>
              <div className={styles.productStatus}>
                <span className={styles.statusDot} />
                <span className={styles.statusLabel}>Active</span>
              </div>
              <span className={styles.productPrice}>{leadsPrice}</span>
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
          <div
            className={`${styles.productCard} ${styles.productCardInactive}`}
          >
            <div className={styles.productCardTop}>
              <div className={styles.productStatus}>
                <span
                  className={`${styles.statusDot} ${styles.statusDotInactive}`}
                />
                <span className={styles.statusLabel}>Not Enrolled</span>
              </div>
              <span className={styles.productPrice}>{leadsPrice}</span>
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
