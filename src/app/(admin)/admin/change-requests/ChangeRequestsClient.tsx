/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { updateChangeRequestStatus } from "@/actions/admin/updateChangeRequestStatus";
import styles from "./ChangeRequestsClient.module.css";

type ChangeRequest = {
  id: string;
  title: string;
  description: string;
  status: string;
  adminNotes: string | null;
  completedAt: Date | null;
  createdAt: Date;
  clientProfile: {
    businessName: string;
    user: { name: string | null; email: string };
  };
};

const statusLabels: Record<string, string> = {
  PENDING: "Pending",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  DECLINED: "Declined",
};

const statusOptions = [
  { value: "PENDING", label: "Pending" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "COMPLETED", label: "Completed" },
  { value: "DECLINED", label: "Declined" },
];

export default function ChangeRequestsClient({
  requests,
}: {
  requests: ChangeRequest[];
}) {
  const router = useRouter();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState<string>("");
  const [editNotes, setEditNotes] = useState<string>("");
  const [saving, setSaving] = useState(false);

  const pending = requests.filter((r) => r.status === "PENDING");
  const inProgress = requests.filter((r) => r.status === "IN_PROGRESS");
  const completed = requests.filter((r) => r.status === "COMPLETED");
  const declined = requests.filter((r) => r.status === "DECLINED");

  const handleEdit = (request: ChangeRequest) => {
    setEditingId(request.id);
    setEditStatus(request.status);
    setEditNotes(request.adminNotes ?? "");
  };

  const handleSave = async () => {
    if (!editingId) return;
    setSaving(true);

    await updateChangeRequestStatus({
      requestId: editingId,
      status: editStatus as any,
      adminNotes: editNotes,
    });

    setEditingId(null);
    setSaving(false);
    router.refresh();
  };

  const RequestCard = ({ request }: { request: ChangeRequest }) => {
    const isExpanded = expandedId === request.id;
    const isEditing = editingId === request.id;

    return (
      <div className={styles.requestCard}>
        <div
          className={styles.requestTop}
          onClick={() => setExpandedId(isExpanded ? null : request.id)}
        >
          <div className={styles.requestTopLeft}>
            <div className={styles.requestClient}>
              <span className={styles.requestBusiness}>
                {request.clientProfile.businessName}
              </span>
            </div>
            <h3 className={styles.requestTitle}>{request.title}</h3>
            <span className={styles.requestDate}>
              {format(new Date(request.createdAt), "MMMM d, yyyy")}
            </span>
          </div>

          <div className={styles.requestTopRight}>
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
            <svg
              width='16'
              height='16'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeWidth='2'
              strokeLinecap='round'
              strokeLinejoin='round'
              className={`${styles.chevron} ${isExpanded ? styles.chevronUp : ""}`}
            >
              <polyline points='6 9 12 15 18 9' />
            </svg>
          </div>
        </div>

        {isExpanded && (
          <div className={styles.requestBody}>
            <p className={styles.requestDesc}>{request.description}</p>

            {request.adminNotes && !isEditing && (
              <div className={styles.adminNotes}>
                <span className={styles.adminNotesLabel}>Admin notes</span>
                <p className={styles.adminNotesText}>{request.adminNotes}</p>
              </div>
            )}

            {isEditing ? (
              <div className={styles.editForm}>
                <div className={styles.editRow}>
                  <div className={styles.editField}>
                    <label className={styles.editLabel}>Status</label>
                    <select
                      className={styles.select}
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value)}
                    >
                      {statusOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className={styles.editField}>
                  <label className={styles.editLabel}>
                    Admin notes (optional)
                  </label>
                  <textarea
                    className={styles.textarea}
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    placeholder='Add internal notes or a message for the client...'
                    rows={3}
                  />
                </div>

                <div className={styles.editBtns}>
                  <button
                    onClick={() => setEditingId(null)}
                    className={styles.cancelBtn}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    className={styles.saveBtn}
                    disabled={saving}
                  >
                    {saving ? "Saving..." : "Save changes"}
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => handleEdit(request)}
                className={styles.editBtn}
              >
                Update status
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={`${styles.heading} h2`}>Change Requests</h1>
        <p className={styles.subheading}>
          {pending.length} pending · {inProgress.length} in progress ·{" "}
          {completed.length} completed
        </p>
      </div>

      {requests.length === 0 ? (
        <div className={styles.emptyState}>
          <p className={styles.emptyText}>No change requests yet.</p>
        </div>
      ) : (
        <>
          {pending.length > 0 && (
            <div className={styles.section}>
              <h2 className={styles.sectionHeading}>
                Pending ({pending.length})
              </h2>
              <div className={styles.requestList}>
                {pending.map((r) => (
                  <RequestCard key={r.id} request={r} />
                ))}
              </div>
            </div>
          )}

          {inProgress.length > 0 && (
            <div className={styles.section}>
              <h2 className={styles.sectionHeading}>
                In Progress ({inProgress.length})
              </h2>
              <div className={styles.requestList}>
                {inProgress.map((r) => (
                  <RequestCard key={r.id} request={r} />
                ))}
              </div>
            </div>
          )}

          {completed.length > 0 && (
            <div className={styles.section}>
              <h2 className={styles.sectionHeading}>
                Completed ({completed.length})
              </h2>
              <div className={styles.requestList}>
                {completed.map((r) => (
                  <RequestCard key={r.id} request={r} />
                ))}
              </div>
            </div>
          )}

          {declined.length > 0 && (
            <div className={styles.section}>
              <h2 className={styles.sectionHeading}>
                Declined ({declined.length})
              </h2>
              <div className={styles.requestList}>
                {declined.map((r) => (
                  <RequestCard key={r.id} request={r} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
