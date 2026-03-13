import { getClientProfile } from "@/actions/client/getClientProfile";
import styles from "./BillingPage.module.css";
import { format } from "date-fns";

const statusLabels: Record<string, string> = {
  INACTIVE: "Inactive",
  ACTIVE: "Active",
  PAST_DUE: "Past Due",
  CANCELLED: "Cancelled",
  PAUSED: "Paused",
};

const invoiceStatusLabels: Record<string, string> = {
  DRAFT: "Draft",
  OPEN: "Due",
  PAID: "Paid",
  VOID: "Void",
  UNCOLLECTIBLE: "Uncollectible",
};

function formatCents(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

export default async function BillingPage() {
  const profile = await getClientProfile();
  const subscription = profile?.subscription ?? null;
  const invoices = profile?.invoices ?? [];

  const isActive = subscription?.status === "ACTIVE";
  const isPastDue = subscription?.status === "PAST_DUE";

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={`${styles.heading} h2`}>Billing</h1>
        <p className={styles.subheading}>
          Manage your subscription and view your invoice history.
        </p>
      </div>

      {/* Subscription block */}
      <div className={styles.subscriptionCard}>
        <div className={styles.subscriptionTop}>
          <div className={styles.subscriptionLeft}>
            <span className={styles.subscriptionLabel}>Subscription</span>
            <h2 className={styles.subscriptionPlan}>
              {subscription?.planAmountCents
                ? `${formatCents(subscription.planAmountCents)} / month`
                : "No active plan"}
            </h2>
          </div>

          {subscription && (
            <span
              className={`${styles.subscriptionStatus} ${
                isActive
                  ? styles.statusActive
                  : isPastDue
                    ? styles.statusPastDue
                    : styles.statusInactive
              }`}
            >
              {statusLabels[subscription.status]}
            </span>
          )}
        </div>

        {subscription && (
          <div className={styles.subscriptionDetails}>
            {subscription.currentPeriodEnd && (
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>
                  {isActive ? "Next billing date" : "Period ended"}
                </span>
                <span className={styles.detailValue}>
                  {format(
                    new Date(subscription.currentPeriodEnd),
                    "MMMM d, yyyy",
                  )}
                </span>
              </div>
            )}
            {subscription.billingAnchorDate && (
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Billing day</span>
                <span className={styles.detailValue}>
                  Day {subscription.billingAnchorDate} of each month
                </span>
              </div>
            )}
          </div>
        )}

        {!subscription && (
          <div className={styles.noSubscription}>
            <p className={styles.noSubscriptionText}>
              Your subscription will be set up by your account manager once your
              site is ready to launch.
            </p>
          </div>
        )}

        {isPastDue && (
          <div className={styles.pastDueBanner}>
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
              <circle cx='12' cy='12' r='10' />
              <line x1='12' y1='8' x2='12' y2='12' />
              <line x1='12' y1='16' x2='12.01' y2='16' />
            </svg>
            Your payment is past due. Please update your payment method to avoid
            service interruption.
          </div>
        )}
      </div>

      {/* Invoice history */}
      <div className={styles.invoiceSection}>
        <h3 className={styles.invoiceSectionHeading}>Invoice History</h3>

        {invoices.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              <svg
                width='28'
                height='28'
                viewBox='0 0 24 24'
                fill='none'
                stroke='currentColor'
                strokeWidth='1.5'
                strokeLinecap='round'
                strokeLinejoin='round'
              >
                <rect x='1' y='4' width='22' height='16' rx='2' ry='2' />
                <line x1='1' y1='10' x2='23' y2='10' />
              </svg>
            </div>
            <p className={styles.emptyText}>No invoices yet</p>
          </div>
        ) : (
          <div className={styles.invoiceList}>
            {invoices.map((invoice) => (
              <div key={invoice.id} className={styles.invoiceRow}>
                <div className={styles.invoiceLeft}>
                  <span className={styles.invoiceNumber}>
                    {invoice.invoiceNumber}
                  </span>
                  <span className={styles.invoiceDesc}>
                    {invoice.description ??
                      (invoice.periodStart && invoice.periodEnd
                        ? `${format(new Date(invoice.periodStart), "MMM d")} – ${format(new Date(invoice.periodEnd), "MMM d, yyyy")}`
                        : "Subscription")}
                  </span>
                </div>

                <div className={styles.invoiceRight}>
                  <span className={styles.invoiceAmount}>
                    {formatCents(invoice.amountCents)}
                  </span>

                  <span
                    className={`${styles.invoiceStatus} ${
                      invoice.status === "PAID"
                        ? styles.invoicePaid
                        : invoice.status === "OPEN"
                          ? styles.invoiceOpen
                          : styles.invoiceOther
                    }`}
                  >
                    {invoiceStatusLabels[invoice.status]}
                  </span>

                  {invoice.pdfUrl && (
                    <a
                      href={invoice.pdfUrl}
                      target='_blank'
                      rel='noopener noreferrer'
                      className={styles.downloadBtn}
                    >
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
                        <path d='M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4' />
                        <polyline points='7 10 12 15 17 10' />
                        <line x1='12' y1='15' x2='12' y2='3' />
                      </svg>
                      PDF
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
