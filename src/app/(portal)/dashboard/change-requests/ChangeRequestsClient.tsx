"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { submitChangeRequest } from "@/actions/client/submitChangeRequest";
import styles from "./ChangeRequestsClient.module.css";

type ChangeRequest = {
  id: string;
  title: string;
  description: string;
  status: string;
  adminNotes: string | null;
  completedAt: Date | null;
  createdAt: Date;
};

const statusLabels: Record<string, string> = {
  PENDING: "Pending",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  DECLINED: "Declined",
};

export default function ChangeRequestsClient({
  requests,
  isLive,
}: {
  requests: ChangeRequest[];
  isLive: boolean;
}) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) {
      setError("Please fill out both fields.");
      return;
    }

    setError(null);
    setSubmitting(true);

    const result = await submitChangeRequest({ title, description });

    if (result?.error) {
      setError(result.error);
      setSubmitting(false);
      return;
    }

    setSuccess(true);
    setTitle("");
    setDescription("");
    setSubmitting(false);
    router.refresh();
  };

  if (!isLive) {
    return (
      <div className={styles.page}>
        <div className={styles.header}>
          <h1 className={styles.heading}>Change Requests</h1>
        </div>
        <div className={styles.lockedState}>
          <div className={styles.lockedIcon}>
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
              <rect x='3' y='11' width='18' height='11' rx='2' ry='2' />
              <path d='M7 11V7a5 5 0 0 1 10 0v4' />
            </svg>
          </div>
          <h3 className={styles.lockedHeading}>Not available yet</h3>
          <p className={styles.lockedText}>
            Change requests become available once your site is live. We&apos;ll
            unlock this section when you launch.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.heading}>Change Requests</h1>
        <p className={styles.subheading}>
          Need something updated on your site? Submit a request and we&apos;ll
          take care of it.
        </p>
      </div>

      {/* Submit form */}
      <div className={styles.formCard}>
        <h3 className={styles.formHeading}>Submit a request</h3>

        {success && (
          <div className={styles.successBanner}>
            Request submitted — we&apos;ll be in touch shortly.
          </div>
        )}

        <div className={styles.field}>
          <label className={styles.label}>What needs to change?</label>
          <input
            type='text'
            className={styles.input}
            placeholder='Update hero headline, fix booking button, add new vehicle...'
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setSuccess(false);
            }}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Describe the change in detail</label>
          <textarea
            className={styles.textarea}
            placeholder='Please be as specific as possible. Include any links, copy, or reference images if relevant...'
            value={description}
            rows={5}
            onChange={(e) => {
              setDescription(e.target.value);
              setSuccess(false);
            }}
          />
        </div>

        {error && <div className={styles.errorBanner}>{error}</div>}

        <div className={styles.formFooter}>
          <button
            onClick={handleSubmit}
            className={styles.submitBtn}
            disabled={submitting}
          >
            {submitting ? "Submitting..." : "Submit request"}
          </button>
        </div>
      </div>

      {/* Request history */}
      {requests.length > 0 && (
        <div className={styles.historySection}>
          <h3 className={styles.historySectionHeading}>
            Previous requests ({requests.length})
          </h3>
          <div className={styles.requestList}>
            {requests.map((request) => (
              <div key={request.id} className={styles.requestCard}>
                <div className={styles.requestTop}>
                  <div className={styles.requestInfo}>
                    <h4 className={styles.requestTitle}>{request.title}</h4>
                    <p className={styles.requestDate}>
                      {format(new Date(request.createdAt), "MMMM d, yyyy")}
                    </p>
                  </div>
                  <span
                    className={`${styles.requestStatus} ${
                      request.status === "PENDING"
                        ? styles.statusPending
                        : request.status === "IN_PROGRESS"
                          ? styles.statusInProgress
                          : request.status === "COMPLETED"
                            ? styles.statusCompleted
                            : styles.statusDeclined
                    }`}
                  >
                    {statusLabels[request.status]}
                  </span>
                </div>

                <p className={styles.requestDesc}>{request.description}</p>

                {request.adminNotes && (
                  <div className={styles.adminNote}>
                    <span className={styles.adminNoteLabel}>
                      Note from Fonts & Footers
                    </span>
                    <p className={styles.adminNoteText}>{request.adminNotes}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
