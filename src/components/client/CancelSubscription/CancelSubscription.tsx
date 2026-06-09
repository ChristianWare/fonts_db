"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Modal from "@/components/shared/Modal/Modal";
import {
  cancelSubscription,
  resumeSubscription,
} from "@/actions/client/cancelSubscription";
import styles from "./CancelSubscription.module.css";

type Props = {
  productType: "WEBSITE" | "LEADS";
  productLabel: string;
  /** ISO date access runs until (trial end or period end). Null if unknown. */
  endDate: string | null;
  /** True when cancellation is already scheduled. */
  cancelAtPeriodEnd: boolean;
  /** True for free/beta subs that cancel immediately (no Stripe sub). */
  immediate: boolean;
  /** True while in trial — changes copy to "card won't be charged". */
  inTrial: boolean;
  /** "link" = quiet text link (billing card). "danger" = danger-zone button. */
  variant?: "link" | "danger";
};

export default function CancelSubscription({
  productType,
  productLabel,
  endDate,
  cancelAtPeriodEnd,
  immediate,
  inTrial,
  variant = "link",
}: Props) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const endDateText = endDate
    ? new Date(endDate).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "the end of your current billing period";

  function openModal() {
    setModalOpen(true);
  }

  function closeModal() {
    if (loading) return; // don't allow dismiss mid-request
    setModalOpen(false);
  }

  async function handleCancel() {
    setLoading(true);

    const result = await cancelSubscription({ productType });

    if (result?.error) {
      toast.error(result.error);
      setLoading(false);
      return;
    }

    setModalOpen(false);
    setLoading(false);

    // Success toast — wording reflects what actually happened.
    if (result.immediate) {
      toast.success(`Your ${productLabel} subscription has been cancelled.`);
      // Immediate cancel kills access right away — leave product pages
      // gracefully instead of letting the gate redirect mid-view.
      router.push("/dashboard");
    } else {
      toast.success(`Cancelled — you'll keep access until ${endDateText}.`);
    }
    router.refresh();
  }

  async function handleResume() {
    setLoading(true);

    const result = await resumeSubscription({ productType });

    if (result?.error) {
      toast.error(result.error);
      setLoading(false);
      return;
    }

    setLoading(false);
    toast.success(`Your ${productLabel} subscription has been resumed.`);
    router.refresh();
  }

  // ── Cancellation already scheduled — offer resume ──
  if (cancelAtPeriodEnd) {
    return (
      <div className={styles.wrap}>
        <p className={styles.scheduledText}>
          Your {productLabel} subscription ends on {endDateText}.
          {inTrial && " Your card won't be charged."}
        </p>
        <button
          onClick={handleResume}
          disabled={loading}
          className={styles.resumeBtn}
          type='button'
        >
          {loading ? "Resuming..." : "Resume subscription"}
        </button>
      </div>
    );
  }

  const confirmCopy = immediate
    ? `Are you sure you want to cancel ${productLabel}? This is immediate — you'll lose access right away.`
    : inTrial
      ? `Are you sure you want to cancel ${productLabel}? You'll keep access until ${endDateText}, and your card won't be charged.`
      : `Are you sure you want to cancel ${productLabel}? You'll keep access until ${endDateText}. No further charges after that.`;

  return (
    <>
      <button
        onClick={openModal}
        className={variant === "danger" ? styles.dangerBtn : styles.cancelLink}
        type='button'
      >
        Cancel subscription
      </button>

      <Modal isOpen={modalOpen} onClose={closeModal}>
        <div className={styles.confirmRow}>
          <p className={styles.confirmText}>{confirmCopy}</p>
          <div className={styles.confirmActions}>
            <button
              type='button'
              onClick={handleCancel}
              disabled={loading}
              className={styles.confirmBtn}
            >
              {loading ? "Cancelling..." : "Yes, cancel"}
            </button>
            <button
              type='button'
              onClick={closeModal}
              disabled={loading}
              className={styles.keepBtn}
            >
              Keep subscription
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
