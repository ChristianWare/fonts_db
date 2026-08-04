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
import { createCardUpdateIntent } from "@/actions/client/createCardUpdateIntent";
import { updateDefaultPaymentMethod } from "@/actions/client/updateDefaultPaymentMethod";
import { stripeAppearance } from "@/lib/stripeAppearance";
import styles from "./UpdatePaymentMethod.module.css";

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

function UpdateForm({ onDone }: { onDone: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!stripe || !elements) return;

    setSubmitting(true);
    setError(null);

    try {
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

      const result = await updateDefaultPaymentMethod({ paymentMethodId });

      if (result?.error) {
        setError(result.error);
        setSubmitting(false);
        return;
      }

      onDone();
      router.refresh();
    } catch (err) {
      console.error("[UpdatePaymentMethod] confirm failed:", err);
      setError(
        "We couldn't save that card. Please try again, or contact support.",
      );
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.form}>
      <PaymentElement
        options={{ layout: "tabs" }}
        onReady={() => setReady(true)}
        onLoadError={(e) =>
          setError(e.error?.message ?? "The payment form failed to load.")
        }
      />
      {!ready && !error && (
        <p className={styles.loading}>Loading payment form...</p>
      )}
      {error && <p className={styles.error}>{error}</p>}
      <div className={styles.formActions}>
        <button
          onClick={handleSubmit}
          disabled={submitting || !ready || !stripe || !elements}
          className={styles.saveBtn}
          type='button'
        >
          {submitting ? "Saving..." : "Save new card"}
        </button>
        <button onClick={onDone} className={styles.cancelBtn} type='button'>
          Cancel
        </button>
      </div>
    </div>
  );
}

export default function UpdatePaymentMethod() {
  const [open, setOpen] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || clientSecret) return;

    let cancelled = false;

    // Never let a rejected action leave the UI stuck on "Loading...".
    const timeout = setTimeout(() => {
      if (!cancelled) {
        setLoadError(
          "The payment form is taking too long to load. Please refresh and try again.",
        );
      }
    }, 15000);

    createCardUpdateIntent()
      .then((result) => {
        if (cancelled) return;
        if ("error" in result && result.error) {
          setLoadError(result.error);
        } else if ("clientSecret" in result && result.clientSecret) {
          setClientSecret(result.clientSecret);
        } else {
          setLoadError(
            "We couldn't start the card update. Please contact support.",
          );
        }
      })
      .catch((err) => {
        // THE BUG: this branch didn't exist, so any thrown error — a Stripe
        // API failure, a bad customer id, a serverless DB hiccup — resolved
        // to nothing and the component sat on "Loading payment form..."
        // forever with no message and no way forward.
        console.error("[UpdatePaymentMethod] createCardUpdateIntent:", err);
        if (!cancelled) {
          setLoadError(
            "We couldn't load the payment form. Please refresh, or email support and we'll send you a secure link.",
          );
        }
      })
      .finally(() => clearTimeout(timeout));

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [open, clientSecret]);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className={styles.openBtn}
        type='button'
      >
        Update payment method
      </button>
    );
  }

  if (!stripePromise) {
    return (
      <p className={styles.error}>
        Payments aren&apos;t configured. Please contact support.
      </p>
    );
  }

  if (loadError) {
    return (
      <div className={styles.form}>
        <p className={styles.error}>{loadError}</p>
        <div className={styles.formActions}>
          <button
            onClick={() => {
              setLoadError(null);
              setClientSecret(null);
            }}
            className={styles.saveBtn}
            type='button'
          >
            Try again
          </button>
          <button
            onClick={() => setOpen(false)}
            className={styles.cancelBtn}
            type='button'
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  if (!clientSecret) {
    return <p className={styles.loading}>Loading payment form...</p>;
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{ clientSecret, appearance: stripeAppearance }}
    >
      <UpdateForm
        onDone={() => {
          setOpen(false);
          setClientSecret(null);
        }}
      />
    </Elements>
  );
}
