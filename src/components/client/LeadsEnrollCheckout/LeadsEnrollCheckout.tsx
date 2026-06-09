"use client";

import { useState, useEffect } from "react";
import {
  useStripe,
  useElements,
  PaymentElement,
  Elements,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useRouter } from "next/navigation";
import { createLeadsSetupIntent } from "@/actions/client/createLeadsSetupIntent";
import { confirmLeadsEnrollment } from "@/actions/client/confirmLeadsEnrollment";
import styles from "./LeadsEnrollCheckout.module.css";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
);

const LEADS_PRICE_CENTS = 12500;

function formatCents(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

function getTrialEndDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

// ── Inner form (must be inside <Elements>) ─────────────────────────────────
function CheckoutForm() {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!stripe || !elements) return;

    setSubmitting(true);
    setError(null);

    // Confirm the SetupIntent to save the card
    const { error: stripeError, setupIntent } = await stripe.confirmSetup({
      elements,
      confirmParams: { return_url: window.location.href },
      redirect: "if_required",
    });

    if (stripeError) {
      setError(stripeError.message ?? "Something went wrong.");
      setSubmitting(false);
      return;
    }

    if (!setupIntent?.payment_method) {
      setError("No payment method returned. Please try again.");
      setSubmitting(false);
      return;
    }

    const paymentMethodId =
      typeof setupIntent.payment_method === "string"
        ? setupIntent.payment_method
        : setupIntent.payment_method.id;

    // Create the trialing subscription server-side
    const result = await confirmLeadsEnrollment({ paymentMethodId });

    if (result?.error) {
      setError(result.error);
      setSubmitting(false);
      return;
    }

    router.push("/dashboard/leads/settings?welcome=1");
  };

  return (
    <div className={styles.form}>
      {/* Summary */}
      <div className={styles.summary}>
        <div className={styles.summaryRow}>
          <span className={styles.summaryLabel}>Due today</span>
          <span className={styles.summaryValue}>$0.00</span>
        </div>
        <div className={styles.summaryRowDesc}>
          <span className={styles.summaryDesc}>
            7-day free trial — no charge today.
          </span>
        </div>
        <div className={styles.summaryDivider} />
        <div className={styles.summaryRow}>
          <span className={styles.summaryLabel}>
            Starting {getTrialEndDate()}
          </span>
          <span className={styles.summaryValue}>
            {formatCents(LEADS_PRICE_CENTS)}/mo
          </span>
        </div>
        <div className={styles.summaryRowDesc}>
          <span className={styles.summaryDesc}>
            Billed monthly after your trial. Cancel anytime.
          </span>
        </div>
      </div>

      {/* Stripe card input */}
      <div className={styles.cardWrap}>
        <PaymentElement options={{ layout: "tabs" }} />
      </div>

      {error && <div className={styles.errorBanner}>{error}</div>}

      <button
        onClick={handleSubmit}
        className={styles.submitBtn}
        disabled={submitting || !stripe || !elements}
      >
        {submitting ? "Starting your trial..." : "Start 7-day free trial"}
      </button>

      <p className={styles.legal}>
        No charge today. After your 7-day trial you&apos;ll be billed{" "}
        {formatCents(LEADS_PRICE_CENTS)} per month. You can cancel anytime from
        your billing page.
      </p>
    </div>
  );
}

// ── Outer wrapper (loads SetupIntent, mounts Elements) ─────────────────────
export default function LeadsEnrollCheckout() {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    createLeadsSetupIntent().then((result) => {
      if ("error" in result && result.error) {
        setLoadError(result.error);
      } else if ("clientSecret" in result && result.clientSecret) {
        setClientSecret(result.clientSecret);
      }
    });
  }, []);

  if (loadError) {
    return (
      <div className={styles.errorState}>
        <p className={styles.errorStateText}>{loadError}</p>
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div className={styles.loadingState}>
        <div className={styles.spinner} />
        <p className={styles.loadingText}>Loading payment form...</p>
      </div>
    );
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: {
          theme: "flat",
          variables: {
            colorBackground: "#fff",
            colorText: "#0a0a0a",
            colorDanger: "#c53030",
            fontFamily: '"Roboto", system-ui, sans-serif',
            fontSizeBase: "14px",
            borderRadius: "0",
            colorTextPlaceholder: "#888888",
            colorTextSecondary: "#555555",
            spacingUnit: "4px",
          },
          rules: {
            ".Input": {
              border: "1px solid #d4d4d4",
              boxShadow: "none",
              padding: "11px 14px",
              fontSize: "14px",
              fontFamily: '"Roboto", system-ui, sans-serif',
            },
            ".Input:focus": {
              border: "1px solid #0a0a0a",
              boxShadow: "none",
              outline: "none",
            },
            ".Input::placeholder": { color: "#888888" },
            ".Label": {
              fontFamily: '"Courier New", Courier, monospace',
              fontSize: "14px",
              fontWeight: "400",
              textTransform: "uppercase",
              letterSpacing: "0.07em",
              color: "#555555",
            },
            ".Tab": {
              border: "1px solid #d4d4d4",
              boxShadow: "none",
              fontFamily: '"Courier New", Courier, monospace',
              fontSize: "14px",
            },
            ".Tab--selected": {
              border: "1px solid #0a0a0a",
              boxShadow: "none",
            },
            ".Tab:focus": { boxShadow: "none", outline: "none" },
            ".TabLabel": {
              fontFamily: '"Courier New", Courier, monospace',
              fontSize: "14px",
              textTransform: "uppercase",
              letterSpacing: "0.07em",
            },
            ".Block": { border: "1px solid #d4d4d4", boxShadow: "none" },
            ".CheckboxLabel": {
              fontFamily: '"Roboto", system-ui, sans-serif',
              fontSize: "14px",
              color: "#555555",
            },
          },
        },
      }}
    >
      <CheckoutForm />
    </Elements>
  );
}
