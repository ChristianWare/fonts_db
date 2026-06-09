import { getClientProfile } from "@/actions/client/getClientProfile";
import styles from "./BillingPage.module.css";
import { format } from "date-fns";
import Link from "next/link";
import Stripe from "stripe";
import stripe from "@/lib/stripe";
import BillingCheckout from "@/components/admin/BillingCheckout/BillingCheckout";
import UpdatePaymentMethod from "@/components/client/UpdatePaymentMethod/UpdatePaymentMethod";
import CancelSubscription from "@/components/client/CancelSubscription/CancelSubscription";

const productLabels: Record<string, string> = {
  WEBSITE: "Custom Website",
  LEADS: "Leads Tool",
};

const productNumbers: Record<string, string> = {
  WEBSITE: "Product 01",
  LEADS: "Product 02",
};

const invoiceStatusLabels: Record<string, string> = {
  DRAFT: "Draft",
  OPEN: "Due",
  PAID: "Paid",
  VOID: "Void",
  UNCOLLECTIBLE: "Uncollectible",
};

// Leads price lives in Stripe (STRIPE_LEADS_PRICE_ID), so there's no DB field
// to read for unenrolled users. Keep this in sync with the Stripe price.
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

export default async function BillingPage() {
  const profile = await getClientProfile();
  const subscriptions = profile?.subscriptions ?? [];
  const invoices = profile?.invoices ?? [];

  const websiteSub =
    subscriptions.find((s) => s.productType === "WEBSITE") ?? null;

  // ── Website activation gate ──
  // Show the setup-fee checkout only for clients in the website onboarding
  // flow. A leads-only signup stays at REGISTERED forever and never sees it.
  const setupFeePaid = profile?.setupFeePaid ?? false;
  const isWebsiteClient =
    !!websiteSub || (profile?.onboardingStage ?? "REGISTERED") !== "REGISTERED";
  const showWebsiteCheckout = isWebsiteClient && !setupFeePaid;

  const setupFeeAmountCents = profile?.setupFeeAmountCents ?? 50000;
  const monthlyAmountCents = profile?.monthlyAmountCents ?? 49900;

  const now = new Date();

  // ── Payment method on file (best-effort, non-fatal) ──
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
      // Stripe hiccup shouldn't break the billing page
    }
  }

  // ── Pending actions ──
  const pendingActions: string[] = [];
  if (showWebsiteCheckout) {
    pendingActions.push(
      "Pay your one-time setup fee below to activate your website subscription.",
    );
  }
  for (const sub of subscriptions) {
    if (sub.status === "PAST_DUE") {
      pendingActions.push(
        `Your ${productLabels[sub.productType]} payment is past due — update your payment method to avoid interruption.`,
      );
    }
  }
  const leadsSub = subscriptions.find((s) => s.productType === "LEADS") ?? null;
  if (
    leadsSub?.trialEndsAt &&
    new Date(leadsSub.trialEndsAt) > now &&
    !leadsSub.cancelAtPeriodEnd
  ) {
    const daysLeft = Math.ceil(
      (new Date(leadsSub.trialEndsAt).getTime() - now.getTime()) / 86400000,
    );
    if (daysLeft <= 3) {
      pendingActions.push(
        `Your Leads trial ends ${format(new Date(leadsSub.trialEndsAt), "MMMM d")}. Your card will be charged ${formatCents(leadsSub.planAmountCents)} on that date unless you cancel.`,
      );
    }
  }

  const hasAnySubscription = subscriptions.length > 0;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={`${styles.heading} h2`}>Billing</h1>
        <p className={styles.subheading}>
          Manage your subscriptions and view your invoice history.
        </p>
      </div>

      {/* ── Pending actions ── */}
      {pendingActions.length > 0 && (
        <div className={styles.alertStrip}>
          {pendingActions.map((text, i) => (
            <div key={i} className={styles.alertRow}>
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
              {text}
            </div>
          ))}
        </div>
      )}

      {/* ── Product cards — one per product, enrolled or not ── */}
      <div className={styles.productGrid}>
        {(["WEBSITE", "LEADS"] as const).map((productType) => {
          const sub =
            subscriptions.find((s) => s.productType === productType) ?? null;

          // ── Website mid-setup: card points down to the checkout ──
          if (productType === "WEBSITE" && showWebsiteCheckout) {
            return (
              <div key={productType} className={styles.productCard}>
                <div className={styles.productCardTop}>
                  <div className={styles.productStatus}>
                    <span
                      className={`${styles.statusDot} ${styles.dotPending}`}
                    />
                    <span className={styles.statusLabel}>
                      Payment Needed
                    </span>{" "}
                  </div>
                  <span className={styles.productPrice}>
                    {formatCents(monthlyAmountCents)}/mo
                  </span>
                </div>
                <div className={styles.productCardMain}>
                  <span className={styles.productLabel}>
                    {productNumbers[productType]}
                  </span>
                  <h3 className={styles.productTitle}>
                    {productLabels[productType]}
                  </h3>
                  <p className={styles.productDesc}>
                    Your account is ready to activate. Pay your one-time{" "}
                    {formatCents(setupFeeAmountCents)} setup fee below to start
                    your subscription.
                  </p>
                </div>
                <div className={styles.productCardBottom}>
                  <a href='#activate' className={styles.cardCta}>
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
                      <line x1='12' y1='5' x2='12' y2='19' />
                      <polyline points='19 12 12 19 5 12' />
                    </svg>
                  </a>
                </div>
              </div>
            );
          }

          // ── Not enrolled ──
          if (!sub) {
            const priceCents =
              productType === "WEBSITE"
                ? monthlyAmountCents
                : LEADS_PRICE_CENTS;

            return (
              <div key={productType} className={styles.productCard}>
                <div className={styles.productCardTop}>
                  <div className={styles.productStatus}>
                    <span
                      className={`${styles.statusDot} ${styles.dotInactive}`}
                    />
                    <span className={styles.statusLabel}>Not Enrolled</span>
                  </div>
                  <span className={styles.productPrice}>
                    {formatCents(priceCents)}/mo
                  </span>
                </div>
                <div className={styles.productCardMain}>
                  <span className={styles.productLabel}>
                    {productNumbers[productType]}
                  </span>
                  <h3 className={styles.productTitle}>
                    {productLabels[productType]}
                  </h3>
                  <p className={styles.productDesc}>
                    {productType === "WEBSITE"
                      ? `A custom booking platform built for your operation. ${formatCents(setupFeeAmountCents)} one-time setup, then ${formatCents(monthlyAmountCents)}/month.`
                      : "Hot, warm, and cold leads for your market, scored and delivered every morning. 7-day free trial."}
                  </p>
                </div>
                <div className={styles.productCardBottom}>
                  <Link
                    href={
                      productType === "WEBSITE"
                        ? "/dashboard/enroll/website"
                        : "/dashboard/enroll/leads"
                    }
                    className={styles.cardCta}
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
            );
          }

          // ── Enrolled ──
          const inTrial = !!sub.trialEndsAt && new Date(sub.trialEndsAt) > now;
          const isActive = sub.status === "ACTIVE";
          const isPastDue = sub.status === "PAST_DUE";
          const isCancelled = sub.status === "CANCELLED";
          const isBeta = sub.planAmountCents === 0;

          const dotClass = inTrial
            ? styles.dotTrial
            : isActive
              ? styles.dotActive
              : isPastDue
                ? styles.dotPastDue
                : styles.dotInactive;

          const statusText = inTrial
            ? "Free Trial"
            : isActive
              ? "Active"
              : isPastDue
                ? "Past Due"
                : isCancelled
                  ? "Cancelled"
                  : sub.status === "PAUSED"
                    ? "Paused"
                    : "Inactive";

          return (
            <div key={sub.id} className={styles.productCard}>
              <div className={styles.productCardTop}>
                <div className={styles.productStatus}>
                  <span className={`${styles.statusDot} ${dotClass}`} />
                  <span className={styles.statusLabel}>{statusText}</span>
                </div>
                <span className={styles.productPrice}>
                  {isBeta ? "Free" : `${formatCents(sub.planAmountCents)}/mo`}
                </span>
              </div>

              <div className={styles.productCardMain}>
                <span className={styles.productLabel}>
                  {productNumbers[sub.productType]}
                </span>
                <h3 className={styles.productTitle}>
                  {productLabels[sub.productType]}
                </h3>

                <div className={styles.cardDetails}>
                  {isBeta && (
                    <div className={styles.cardDetailRow}>
                      <span className={styles.cardDetailLabel}>Plan</span>
                      <span className={styles.cardDetailValue}>
                        Beta access — free
                      </span>
                    </div>
                  )}

                  {inTrial && sub.trialEndsAt && (
                    <>
                      <div className={styles.cardDetailRow}>
                        <span className={styles.cardDetailLabel}>
                          Trial ends
                        </span>
                        <span className={styles.cardDetailValue}>
                          {format(new Date(sub.trialEndsAt), "MMM d, yyyy")}
                        </span>
                      </div>
                      {!isBeta && !sub.cancelAtPeriodEnd && (
                        <div className={styles.cardDetailRow}>
                          <span className={styles.cardDetailLabel}>
                            First charge
                          </span>
                          <span className={styles.cardDetailValue}>
                            {formatCents(sub.planAmountCents)} on{" "}
                            {format(new Date(sub.trialEndsAt), "MMM d")}
                          </span>
                        </div>
                      )}
                    </>
                  )}

                  {sub.cancelAtPeriodEnd && (
                    <div className={styles.cardDetailRow}>
                      <span className={styles.cardDetailLabel}>
                        Access until
                      </span>
                      <span className={styles.cardDetailValue}>
                        {format(
                          new Date(
                            (inTrial
                              ? sub.trialEndsAt
                              : sub.currentPeriodEnd) ?? now,
                          ),
                          "MMM d, yyyy",
                        )}
                      </span>
                    </div>
                  )}

                  {!sub.cancelAtPeriodEnd &&
                    !inTrial &&
                    sub.currentPeriodEnd && (
                      <div className={styles.cardDetailRow}>
                        <span className={styles.cardDetailLabel}>
                          {isActive ? "Next billing date" : "Period ended"}
                        </span>
                        <span className={styles.cardDetailValue}>
                          {format(
                            new Date(sub.currentPeriodEnd),
                            "MMM d, yyyy",
                          )}
                        </span>
                      </div>
                    )}

                  {sub.billingAnchorDate &&
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

                  {isCancelled && sub.cancelledAt && (
                    <div className={styles.cardDetailRow}>
                      <span className={styles.cardDetailLabel}>
                        Cancelled on
                      </span>
                      <span className={styles.cardDetailValue}>
                        {format(new Date(sub.cancelledAt), "MMM d, yyyy")}
                      </span>
                    </div>
                  )}
                </div>

                {isPastDue && (
                  <p className={styles.cardAlert}>
                    Payment past due — update your card in the payment method
                    section below to avoid interruption.
                  </p>
                )}
              </div>

              {(isActive || isPastDue) && (
                <div className={styles.productCardBottom}>
                  <CancelSubscription
                    productType={sub.productType}
                    productLabel={productLabels[sub.productType]}
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
                    href={
                      sub.productType === "LEADS"
                        ? "/dashboard/enroll/leads"
                        : "/dashboard/enroll/website"
                    }
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
          );
        })}
      </div>

      {/* ── Website activation checkout (pre-setup) ── */}
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

      {/* ── Payment method ── */}
      {hasAnySubscription && profile?.stripeCustomerId && (
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
        </div>
      )}

      {/* ── Invoice history (always visible) ── */}
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
                    {invoice.productType && (
                      <span className={styles.productTag}>
                        {invoice.productType}
                      </span>
                    )}
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
