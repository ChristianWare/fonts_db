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

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
);

function UpdateForm({ onDone }: { onDone: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!stripe || !elements) return;

    setSubmitting(true);
    setError(null);

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
  };

  return (
    <div className={styles.form}>
      <PaymentElement options={{ layout: "tabs" }} />
      {error && <p className={styles.error}>{error}</p>}
      <div className={styles.formActions}>
        <button
          onClick={handleSubmit}
          disabled={submitting || !stripe || !elements}
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

    createCardUpdateIntent().then((result) => {
      if ("error" in result && result.error) {
        setLoadError(result.error);
      } else if ("clientSecret" in result && result.clientSecret) {
        setClientSecret(result.clientSecret);
      }
    });
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

  if (loadError) {
    return <p className={styles.error}>{loadError}</p>;
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
