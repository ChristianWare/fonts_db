"use client";

import { useState, useEffect } from "react";
import {
  useStripe,
  useElements,
  PaymentElement,
  Elements,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { createSetupIntent } from "@/actions/client/createSetupIntent";
import { confirmBillingSetup } from "@/actions/client/confirmBillingSetup";
import { useRouter } from "next/navigation";
import styles from "./BillingCheckout.module.css";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
);

function formatCents(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

function getFirstOfNextMonth(): string {
  const now = new Date();
  const first = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return first.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

// ── Inner form (needs to be inside <Elements>) ─────────────────────────────
function CheckoutForm({
  setupFeeAmountCents,
  monthlyAmountCents,
  onSuccess,
}: {
  setupFeeAmountCents: number;
  monthlyAmountCents: number;
  onSuccess: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!stripe || !elements) return;

    setSubmitting(true);
    setError(null);

    // Confirm the SetupIntent to get a payment method
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

    // Charge setup fee + create subscription
    const result = await confirmBillingSetup({ paymentMethodId });

    if (result?.error) {
      setError(result.error);
      setSubmitting(false);
      return;
    }

    onSuccess();
  };

  return (
    <div className={styles.form}>
      {/* Summary */}
      <div className={styles.summary}>
        <div className={styles.summaryRow}>
          <span className={styles.summaryLabel}>Due today</span>
          <span className={styles.summaryValue}>
            {setupFeeAmountCents > 0
              ? formatCents(setupFeeAmountCents)
              : "Free"}
          </span>
        </div>
        <div className={styles.summaryRowDesc}>
          <span className={styles.summaryDesc}>One-time setup fee</span>
        </div>
        <div className={styles.summaryDivider} />
        <div className={styles.summaryRow}>
          <span className={styles.summaryLabel}>
            Starting {getFirstOfNextMonth()}
          </span>
          <span className={styles.summaryValue}>
            {formatCents(monthlyAmountCents)}/mo
          </span>
        </div>
        <div className={styles.summaryRowDesc}>
          <span className={styles.summaryDesc}>
            Billed on the 1st of each month. Cancel anytime.
          </span>
        </div>
      </div>

      {/* Stripe card input */}
      <div className={styles.cardWrap}>
        <PaymentElement
          options={{
            layout: "tabs",
          }}
        />
      </div>

      {error && <div className={styles.errorBanner}>{error}</div>}

      <button
        onClick={handleSubmit}
        className={styles.submitBtn}
        disabled={submitting || !stripe || !elements}
      >
        {submitting
          ? "Processing..."
          : `Pay ${setupFeeAmountCents > 0 ? formatCents(setupFeeAmountCents) : "$0"} & activate`}
      </button>

      <p className={styles.legal}>
        By confirming, you authorize Fonts & Footers to charge your card{" "}
        {setupFeeAmountCents > 0
          ? `${formatCents(setupFeeAmountCents)} today and `
          : ""}
        {formatCents(monthlyAmountCents)} per month starting{" "}
        {getFirstOfNextMonth()}. You can cancel by contacting support.
      </p>
    </div>
  );
}

// ── Outer wrapper (loads SetupIntent, mounts Elements) ─────────────────────
export default function BillingCheckout({
  setupFeeAmountCents,
  monthlyAmountCents,
}: {
  setupFeeAmountCents: number;
  monthlyAmountCents: number;
}) {
  const router = useRouter();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    createSetupIntent().then((result) => {
      if ("error" in result && result.error) {
        setLoadError(result.error);
      } else if ("clientSecret" in result && result.clientSecret) {
        setClientSecret(result.clientSecret);
      }
    });
  }, []);

  if (success) {
    return (
      <div className={styles.successState}>
        <div className={styles.successIcon}>
          <svg
            width='24'
            height='24'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='2.5'
            strokeLinecap='round'
            strokeLinejoin='round'
          >
            <polyline points='20 6 9 17 4 12' />
          </svg>
        </div>
        <h3 className={styles.successHeading}>Billing activated</h3>
        <p className={styles.successText}>
          Your setup fee has been charged and your subscription is active.
          You&apos;ll be billed {formatCents(monthlyAmountCents)}/month starting
          the 1st of next month.
        </p>
        <button onClick={() => router.refresh()} className={styles.successBtn}>
          View billing details
        </button>
      </div>
    );
  }

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
            colorBackground: "#ffffff",
            colorText: "#0a0a0a",
            colorDanger: "#c53030",
            fontFamily: '"Roboto", system-ui, sans-serif',
            fontSizeBase: "14px",
            borderRadius: "0px",
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
            ".Input::placeholder": {
              color: "#888888",
            },
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
            ".Tab:focus": {
              boxShadow: "none",
              outline: "none",
            },
            ".TabLabel": {
              fontFamily: '"Courier New", Courier, monospace',
              fontSize: "14px",
              textTransform: "uppercase",
              letterSpacing: "0.07em",
            },
            ".Block": {
              border: "1px solid #d4d4d4",
              boxShadow: "none",
            },
            ".CheckboxLabel": {
              fontFamily: '"Roboto", system-ui, sans-serif',
              fontSize: "14px",
              color: "#555555",
            },
          },
        },
      }}
    >
      <CheckoutForm
        setupFeeAmountCents={setupFeeAmountCents}
        monthlyAmountCents={monthlyAmountCents}
        onSuccess={() => setSuccess(true)}
      />
    </Elements>
  );
}
