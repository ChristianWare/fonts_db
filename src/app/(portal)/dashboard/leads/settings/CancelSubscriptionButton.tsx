"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./LeadsSettingsPage.module.css";

export default function CancelSubscriptionButton() {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCancel() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/leads/cancel", { method: "POST" });
      const text = await res.text();
      let data: { error?: string } = {};
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(`Unexpected server response (status ${res.status})`);
      }

      if (!res.ok) {
        throw new Error(data.error ?? "Could not cancel");
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  if (!confirming) {
    return (
      <button
        type='button'
        onClick={() => setConfirming(true)}
        className={styles.dangerBtn}
      >
        Cancel subscription
      </button>
    );
  }

  return (
    <div className={styles.confirmRow}>
      <p className={styles.confirmText}>Are you sure? This is immediate.</p>
      <div className={styles.confirmActions}>
        <button
          type='button'
          onClick={handleCancel}
          disabled={loading}
          className={styles.dangerBtnConfirm}
        >
          {loading ? "Cancelling..." : "Yes, cancel"}
        </button>
        <button
          type='button'
          onClick={() => setConfirming(false)}
          disabled={loading}
          className={styles.cancelConfirmBtn}
        >
          Keep subscription
        </button>
      </div>
      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
}
