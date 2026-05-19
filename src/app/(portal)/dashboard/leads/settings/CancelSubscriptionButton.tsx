"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Modal from "@/components/shared/Modal/Modal";
import styles from "./LeadsSettingsPage.module.css";

export default function CancelSubscriptionButton() {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function openModal() {
    setError(null);
    setModalOpen(true);
  }

  function closeModal() {
    if (loading) return; // don't allow dismiss mid-request
    setModalOpen(false);
  }

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

      setModalOpen(false);
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <>
      <button type='button' onClick={openModal} className={styles.dangerBtn}>
        Cancel subscription
      </button>

      <Modal isOpen={modalOpen} onClose={closeModal}>
        <div className={styles.confirmRow}>
          <p className={styles.confirmText}>
            Are you sure you want to cancel? This is immediate — you&apos;ll
            lose access to the leads tool right away.
          </p>
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
              onClick={closeModal}
              disabled={loading}
              className={styles.cancelConfirmBtn}
            >
              Keep subscription
            </button>
          </div>
          {error && <p className={styles.error}>{error}</p>}
        </div>
      </Modal>
    </>
  );
}
