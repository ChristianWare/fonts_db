import { getClientProfile } from "@/actions/client/getClientProfile";
import styles from "./ProductBillingDetail.module.css";
import { format } from "date-fns";
import Link from "next/link";
import Stripe from "stripe";
import stripe from "@/lib/stripe";
import BillingCheckout from "@/components/admin/BillingCheckout/BillingCheckout";
import UpdatePaymentMethod from "@/components/client/UpdatePaymentMethod/UpdatePaymentMethod";
import CancelSubscription from "@/components/client/CancelSubscription/CancelSubscription";

const productLabels = {
  WEBSITE: "Custom Website",
  LEADS: "Leads Tool",
} as const;
const productNumbers = {
  WEBSITE: "Product 01",
  LEADS: "Product 02",
} as const;
const invoiceStatusLabels: Record<string, string> = {
  DRAFT: "Draft",
  OPEN: "Due",
  PAID: "Paid",
  VOID: "Void",
  UNCOLLECTIBLE: "Uncollectible",
};
const LEADS_PRICE_CENTS = 12500;

function formatCents(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

type PaymentMethodDisplay = {
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
};

export default async function ProductBillingDetail({
  productType,
}: {
  productType: "WEBSITE" | "LEADS";
}) {
  const profile = await getClientProfile();
  const subscriptions = profile?.subscriptions ?? [];
  const allInvoices = profile?.invoices ?? [];
  const sub = subscriptions.find((s) => s.productType === productType) ?? null;
  const now = new Date();
  const slug = productType === "WEBSITE" ? "website" : "leads";

  const setupFeePaid = profile?.setupFeePaid ?? false;
  const onboardingStage = profile?.onboardingStage ?? "REGISTERED";
  const setupFeeAmountCents = profile?.setupFeeAmountCents ?? 50000;
  const monthlyAmountCents = profile?.monthlyAmountCents ?? 49900;

  const inTrial = !!sub?.trialEndsAt && new Date(sub.trialEndsAt) > now;
  const isActive = sub?.status === "ACTIVE";
  const isPastDue = sub?.status === "PAST_DUE";
  const isCancelled = sub?.status === "CANCELLED";
  const accessSub = isActive || isPastDue || inTrial;
  const isBeta = sub?.planAmountCents === 0 && accessSub;

  // Leads runs a 7-day trial; trial start = trial end minus the trial length.
  const LEADS_TRIAL_DAYS = 7;
  const trialStart = sub?.trialEndsAt
    ? new Date(
        new Date(sub.trialEndsAt).getTime() - LEADS_TRIAL_DAYS * 86400000,
      )
    : null;

  // Day of the month they'll be charged. Leads anchors to the trial-end date;
  // fall back to deriving it from trialEndsAt if billingAnchorDate isn't set yet.
  const chargeDay =
    sub?.billingAnchorDate ??
    (sub?.trialEndsAt ? new Date(sub.trialEndsAt).getDate() : null);

  const showWebsiteCheckout =
    productType === "WEBSITE" &&
    !accessSub &&
    (!!sub || onboardingStage !== "REGISTERED") &&
    !setupFeePaid;

  const enrolled = !!sub || showWebsiteCheckout;

  // Invoices for this product; legacy untagged invoices fall back to WEBSITE.
  const invoices = allInvoices.filter(
    (inv) =>
      inv.productType === productType ||
      (productType === "WEBSITE" && !inv.productType),
  );

  // Payment method is customer-level (shared across all products).
  let paymentMethod: PaymentMethodDisplay | null = null;
  if (profile?.stripeCustomerId) {
    try {
      const customer = (await stripe.customers.retrieve(
        profile.stripeCustomerId,
        { expand: ["invoice_settings.default_payment_method"] },
      )) as Stripe.Customer | Stripe.DeletedCustomer;
      if (!("deleted" in customer) || !customer.deleted) {
        const pm = (customer as Stripe.Customer).invoice_settings
          ?.default_payment_method;
        if (pm && typeof pm !== "string" && pm.card) {
          paymentMethod = {
            brand: pm.card.brand,
            last4: pm.card.last4,
            expMonth: pm.card.exp_month,
            expYear: pm.card.exp_year,
          };
        }
      }
    } catch {
      // non-fatal
    }
  }

  const dotClass = showWebsiteCheckout
    ? styles.dotPending
    : inTrial
      ? styles.dotTrial
      : isActive
        ? styles.dotActive
        : isPastDue
          ? styles.dotPastDue
          : styles.dotInactive;

  const statusText = showWebsiteCheckout
    ? "Payment Needed"
    : inTrial
      ? "Free Trial"
      : isActive
        ? "Active"
        : isPastDue
          ? "Past Due"
          : isCancelled
            ? "Cancelled"
            : sub?.status === "PAUSED"
              ? "Paused"
              : "Not Enrolled";

  const priceText = isBeta
    ? "Free"
    : productType === "WEBSITE"
      ? `${formatCents(monthlyAmountCents)}/mo`
      : sub
        ? `${formatCents(sub.planAmountCents)}/mo`
        : `${formatCents(LEADS_PRICE_CENTS)}/mo`;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <Link href='/dashboard/billing' className={styles.backLink}>
          ← All billing
        </Link>
        <h1 className={`${styles.heading} h2`}>{productLabels[productType]}</h1>
        <p className={styles.subheading}>
          Manage this subscription, your payment method, and invoices.
        </p>
      </div>

      {/* Status card */}
      <div className={styles.soloSection}>
        <div className={`${styles.productCard} ${styles.cardSolo}`}>
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

            {!enrolled ? (
              <p className={styles.productDesc}>
                You&apos;re not enrolled in this product.{" "}
                <Link
                  href={`/dashboard/enroll/${slug}`}
                  className={styles.inlineLink}
                >
                  Get started →
                </Link>
              </p>
            ) : (
              <div className={styles.cardDetails}>
                {isBeta && (
                  <div className={styles.cardDetailRow}>
                    <span className={styles.cardDetailLabel}>Plan</span>
                    <span className={styles.cardDetailValue}>
                      Beta access — free
                    </span>
                  </div>
                )}
                {inTrial && sub?.trialEndsAt && (
                  <>
                    {trialStart && (
                      <div className={styles.cardDetailRow}>
                        <span className={styles.cardDetailLabel}>
                          Trial started
                        </span>
                        <span className={styles.cardDetailValue}>
                          {format(trialStart, "MMM d, yyyy")}
                        </span>
                      </div>
                    )}
                    <div className={styles.cardDetailRow}>
                      <span className={styles.cardDetailLabel}>Trial ends</span>
                      <span className={styles.cardDetailValue}>
                        {format(new Date(sub.trialEndsAt), "MMM d, yyyy")}
                      </span>
                    </div>
                    {!isBeta && !sub.cancelAtPeriodEnd && (
                      <>
                        <div className={styles.cardDetailRow}>
                          <span className={styles.cardDetailLabel}>
                            First payment
                          </span>
                          <span className={styles.cardDetailValue}>
                            {formatCents(sub.planAmountCents)} on{" "}
                            {format(new Date(sub.trialEndsAt), "MMM d, yyyy")}
                          </span>
                        </div>
                        {chargeDay && (
                          <div className={styles.cardDetailRow}>
                            <span className={styles.cardDetailLabel}>
                              Billing
                            </span>
                            <span className={styles.cardDetailValue}>
                              Monthly — day {chargeDay} of each month
                            </span>
                          </div>
                        )}
                      </>
                    )}
                  </>
                )}
                {sub?.cancelAtPeriodEnd && (
                  <div className={styles.cardDetailRow}>
                    <span className={styles.cardDetailLabel}>Access until</span>
                    <span className={styles.cardDetailValue}>
                      {format(
                        new Date(
                          (inTrial ? sub.trialEndsAt : sub.currentPeriodEnd) ??
                            now,
                        ),
                        "MMM d, yyyy",
                      )}
                    </span>
                  </div>
                )}
                {sub &&
                  !sub.cancelAtPeriodEnd &&
                  !inTrial &&
                  sub.currentPeriodEnd && (
                    <div className={styles.cardDetailRow}>
                      <span className={styles.cardDetailLabel}>
                        {isActive ? "Next billing date" : "Period ended"}
                      </span>
                      <span className={styles.cardDetailValue}>
                        {format(new Date(sub.currentPeriodEnd), "MMM d, yyyy")}
                      </span>
                    </div>
                  )}
                {sub?.billingAnchorDate &&
                  !inTrial &&
                  !isCancelled &&
                  !sub.cancelAtPeriodEnd && (
                    <div className={styles.cardDetailRow}>
                      <span className={styles.cardDetailLabel}>
                        Billing day
                      </span>
                      <span className={styles.cardDetailValue}>
                        Day {sub.billingAnchorDate} of each month
                      </span>
                    </div>
                  )}
                {productType === "WEBSITE" && (
                  <div className={styles.cardDetailRow}>
                    <span className={styles.cardDetailLabel}>Setup fee</span>
                    <span className={styles.cardDetailValue}>
                      {setupFeePaid ? "Paid" : "Not yet paid"}
                    </span>
                  </div>
                )}
                {isCancelled && sub?.cancelledAt && (
                  <div className={styles.cardDetailRow}>
                    <span className={styles.cardDetailLabel}>Cancelled on</span>
                    <span className={styles.cardDetailValue}>
                      {format(new Date(sub.cancelledAt), "MMM d, yyyy")}
                    </span>
                  </div>
                )}
              </div>
            )}

            {showWebsiteCheckout && (
              <p className={styles.productDesc} style={{ marginTop: "1.2rem" }}>
                Pay your one-time {formatCents(setupFeeAmountCents)} setup fee
                below to activate your subscription.
              </p>
            )}
            {isPastDue && (
              <p className={styles.cardAlert}>
                Payment past due — update your card in the payment method
                section below to avoid interruption.
              </p>
            )}
          </div>

          {(isActive || isPastDue) && sub && (
            <div className={styles.productCardBottom}>
              <CancelSubscription
                productType={productType}
                productLabel={productLabels[productType]}
                endDate={
                  (inTrial
                    ? sub.trialEndsAt
                    : sub.currentPeriodEnd
                  )?.toISOString() ?? null
                }
                cancelAtPeriodEnd={sub.cancelAtPeriodEnd}
                immediate={!sub.stripeSubscriptionId}
                inTrial={inTrial}
              />
            </div>
          )}
          {isCancelled && (
            <div className={styles.productCardBottom}>
              <Link
                href={`/dashboard/enroll/${slug}`}
                className={styles.cardCta}
              >
                Re-Enroll
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
          )}
        </div>
      </div>

      {/* Website activation checkout */}
      {showWebsiteCheckout && (
        <div id='activate' className={styles.checkoutSection}>
          <div className={styles.checkoutLeft}>
            <h2 className={styles.checkoutHeading}>
              Activate your website subscription
            </h2>
            <p className={styles.checkoutDesc}>
              Enter your payment details below to pay your one-time setup fee
              and start your monthly subscription.
            </p>
            <div className={styles.checkoutDetails}>
              <div className={styles.checkoutDetailRow}>
                <span className={styles.checkoutDetailLabel}>Setup fee</span>
                <span className={styles.checkoutDetailValue}>
                  {formatCents(setupFeeAmountCents)} — due today
                </span>
              </div>
              <div className={styles.checkoutDetailRow}>
                <span className={styles.checkoutDetailLabel}>Monthly</span>
                <span className={styles.checkoutDetailValue}>
                  {formatCents(monthlyAmountCents)}/month
                </span>
              </div>
              <div className={styles.checkoutDetailRow}>
                <span className={styles.checkoutDetailLabel}>Billing day</span>
                <span className={styles.checkoutDetailValue}>
                  1st of each month
                </span>
              </div>
            </div>
          </div>
          <div className={styles.checkoutRight}>
            <BillingCheckout
              setupFeeAmountCents={setupFeeAmountCents}
              monthlyAmountCents={monthlyAmountCents}
            />
          </div>
        </div>
      )}

      {/* Payment method (shared across products) */}
      {enrolled && profile?.stripeCustomerId && (
        <div className={styles.paymentSection}>
          <h3 className={styles.paymentSectionHeading}>Payment Method</h3>
          <div className={styles.paymentRow}>
            {paymentMethod ? (
              <div className={styles.paymentInfo}>
                <span className={styles.cardBrand}>{paymentMethod.brand}</span>
                <span className={styles.cardMeta}>
                  •••• {paymentMethod.last4}
                </span>
                <span className={styles.cardMeta}>
                  Exp {String(paymentMethod.expMonth).padStart(2, "0")}/
                  {String(paymentMethod.expYear).slice(-2)}
                </span>
              </div>
            ) : (
              <p className={styles.noCardText}>No card on file.</p>
            )}
            <UpdatePaymentMethod />
          </div>
          <p className={styles.sharedCardNote}>
            This card is used for all your Fonts &amp; Footers subscriptions.
            Updating it here updates it everywhere.
          </p>
        </div>
      )}

      {/* Invoices (this product only) */}
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
                  <div className={styles.invoiceTopLine}>
                    <span className={styles.invoiceNumber}>
                      {invoice.invoiceNumber}
                    </span>
                  </div>
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
