import { getClientProfile } from "@/actions/client/getClientProfile";
import styles from "./BillingPage.module.css";
import Link from "next/link";

const productLabels = {
  WEBSITE: "Custom Website",
  LEADS: "Leads Tool",
} as const;
const productNumbers = {
  WEBSITE: "Product 01",
  LEADS: "Product 02",
} as const;
const LEADS_PRICE_CENTS = 12500;

function formatCents(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

export default async function BillingPage() {
  const profile = await getClientProfile();
  const subscriptions = profile?.subscriptions ?? [];
  const now = new Date();
  const setupFeePaid = profile?.setupFeePaid ?? false;
  const onboardingStage = profile?.onboardingStage ?? "REGISTERED";
  const monthlyAmountCents = profile?.monthlyAmountCents ?? 49900;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={`${styles.heading} h2`}>Billing</h1>
        <p className={styles.subheading}>
          Choose a product to manage its subscription, payment method, and
          invoices.
        </p>
      </div>

      <div className={styles.productGrid}>
        {(["WEBSITE", "LEADS"] as const).map((productType) => {
          const sub =
            subscriptions.find((s) => s.productType === productType) ?? null;
          const inTrial = !!sub?.trialEndsAt && new Date(sub.trialEndsAt) > now;
          const isActive = sub?.status === "ACTIVE";
          const isPastDue = sub?.status === "PAST_DUE";
          const isCancelled = sub?.status === "CANCELLED";
          const accessSub = isActive || isPastDue || inTrial;
          const isBeta = sub?.planAmountCents === 0 && accessSub;

          const websiteMidSetup =
            productType === "WEBSITE" &&
            !accessSub &&
            (!!sub || onboardingStage !== "REGISTERED") &&
            !setupFeePaid;

          const enrolled = !!sub || websiteMidSetup;
          const slug = productType === "WEBSITE" ? "website" : "leads";
          const href = enrolled
            ? `/dashboard/billing/${slug}`
            : `/dashboard/enroll/${slug}`;

          let dotClass = styles.dotInactive;
          let statusText = "Not Enrolled";
          if (websiteMidSetup) {
            dotClass = styles.dotPending;
            statusText = "Payment Needed";
          } else if (inTrial) {
            dotClass = styles.dotTrial;
            statusText = "Free Trial";
          } else if (isActive) {
            dotClass = styles.dotActive;
            statusText = "Active";
          } else if (isPastDue) {
            dotClass = styles.dotPastDue;
            statusText = "Past Due";
          } else if (isCancelled) {
            dotClass = styles.dotInactive;
            statusText = "Cancelled";
          }

          const priceText = isBeta
            ? "Free"
            : productType === "WEBSITE"
              ? `${formatCents(monthlyAmountCents)}/mo`
              : sub
                ? `${formatCents(sub.planAmountCents)}/mo`
                : `${formatCents(LEADS_PRICE_CENTS)}/mo`;

          return (
            <Link
              key={productType}
              href={href}
              className={`${styles.productCard} ${styles.productCardClickable}`}
            >
              <div className={styles.productCardTop}>
                <div className={styles.productStatus}>
                  <span className={`${styles.statusDot} ${dotClass}`} />
                  <span className={styles.statusLabel}>{statusText}</span>
                </div>
                <span className={styles.productPrice}>{priceText}</span>
              </div>
              <div className={styles.productCardMain}>
                <span className={styles.productLabel}>
                  {productNumbers[productType]}
                </span>
                <h3 className={styles.productTitle}>
                  {productLabels[productType]}
                </h3>
                <p className={styles.productDesc}>
                  {enrolled
                    ? "Manage your subscription, payment method, and invoices."
                    : productType === "WEBSITE"
                      ? "A custom booking platform built for your operation. Get started with a discovery call."
                      : "Hot, warm, and cold leads for your market, scored daily. 7-day free trial."}
                </p>
              </div>
              <div className={styles.productCardBottom}>
                <span className={styles.cardCta}>
                  {enrolled ? "Manage Billing" : "Get Started"}
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
          );
        })}
      </div>
    </div>
  );
}
