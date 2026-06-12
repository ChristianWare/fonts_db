"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Modal from "@/components/shared/Modal/Modal";
import { deleteClient } from "@/actions/admin/deleteClient";
import styles from "./DeleteClientCard.module.css";

export default function DeleteClientCard({
  clientProfileId,
  businessName,
}: {
  clientProfileId: string;
  businessName: string;
}) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  function openModal() {
    setModalOpen(true);
  }

  function closeModal() {
    if (deleting) return; // don't allow dismiss mid-request
    setModalOpen(false);
  }

  async function handleDelete() {
    setDeleting(true);

    const result = await deleteClient(clientProfileId);

    // If the action returns an error, surface it and stay put.
    if (result?.error) {
      toast.error(result.error);
      setDeleting(false);
      return;
    }

    toast.success(`${businessName} has been deleted.`);
    router.push("/admin/clients");
    router.refresh();
  }

  return (
    <div className={styles.card}>
      <h3 className={styles.cardHeading}>Danger Zone</h3>

      <div className={styles.row}>
        <div className={styles.text}>
          <span className={styles.label}>Delete this client</span>
          <span className={styles.desc}>
            Permanently deletes the client, all documents, assets, invoices, and
            their user account. This cannot be undone.
          </span>
        </div>
        <button onClick={openModal} className={styles.deleteBtn} type='button'>
          Delete client
        </button>
      </div>

      <Modal isOpen={modalOpen} onClose={closeModal}>
        <div className={styles.confirmRow}>
          <p className={styles.confirmText}>
            Are you sure you want to permanently delete {businessName}? This
            removes their account, documents, assets, and invoices. This cannot
            be undone.
          </p>
          <div className={styles.confirmActions}>
            <button
              type='button'
              onClick={handleDelete}
              disabled={deleting}
              className={styles.confirmBtn}
            >
              {deleting ? "Deleting..." : "Yes, delete"}
            </button>
            <button
              type='button'
              onClick={closeModal}
              disabled={deleting}
              className={styles.keepBtn}
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
