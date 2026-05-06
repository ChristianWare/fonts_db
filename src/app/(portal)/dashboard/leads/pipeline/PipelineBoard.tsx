"use client";

import { useState } from "react";
// import Link from "next/link";
import styles from "./PipelinePage.module.css";
import Button from "@/components/shared/Button/Button";

type LeadStatus =
  | "NEW"
  | "CONTACTED"
  | "NURTURING"
  | "SNOOZED"
  | "WON"
  | "DEAD";

type SerializedLead = {
  id: string;
  status: LeadStatus;
  category: string;
  businessName: string | null;
  rating: number | null;
  reviewCount: number | null;
  businessPhone: string | null;
  createdAt: string;
};

const STATUSES: LeadStatus[] = [
  "NEW",
  "CONTACTED",
  "NURTURING",
  "SNOOZED",
  "WON",
  "DEAD",
];

function formatRelative(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const minutes = Math.floor(diffMs / (1000 * 60));
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

function groupByStatus(
  leads: SerializedLead[],
): Record<LeadStatus, SerializedLead[]> {
  const grouped: Record<LeadStatus, SerializedLead[]> = {
    NEW: [],
    CONTACTED: [],
    NURTURING: [],
    SNOOZED: [],
    WON: [],
    DEAD: [],
  };
  for (const lead of leads) {
    grouped[lead.status].push(lead);
  }
  return grouped;
}

export default function PipelineBoard({
  initialLeads,
}: {
  initialLeads: SerializedLead[];
}) {
  const [leadsByStatus, setLeadsByStatus] = useState(() =>
    groupByStatus(initialLeads),
  );
  const [collapsed, setCollapsed] = useState<Set<LeadStatus>>(new Set());
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [draggingFrom, setDraggingFrom] = useState<LeadStatus | null>(null);
  const [dropTarget, setDropTarget] = useState<LeadStatus | null>(null);

  function toggleCollapsed(status: LeadStatus) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(status)) next.delete(status);
      else next.add(status);
      return next;
    });
  }

  function clearDragState() {
    setDraggingId(null);
    setDraggingFrom(null);
    setDropTarget(null);
  }

  function handleDragStart(
    e: React.DragEvent,
    lead: SerializedLead,
    fromStatus: LeadStatus,
  ) {
    setDraggingId(lead.id);
    setDraggingFrom(fromStatus);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData(
      "application/json",
      JSON.stringify({ id: lead.id, fromStatus }),
    );
  }

  function handleDragEnd() {
    // Safety net for cancelled drags (Esc key, drop outside any zone).
    // For successful drops, handleDrop has already cleared state.
    clearDragState();
  }

  function handleDragOver(e: React.DragEvent, status: LeadStatus) {
    if (draggingFrom === status) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dropTarget !== status) {
      setDropTarget(status);
    }
  }

  async function handleDrop(e: React.DragEvent, toStatus: LeadStatus) {
    e.preventDefault();
    e.stopPropagation();

    // Clear drag state IMMEDIATELY. The optimistic update below unmounts
    // the original <tr>, so its onDragEnd never fires — without this,
    // draggingId stays set and the new row renders ghosted.
    clearDragState();

    let payload: { id: string; fromStatus: LeadStatus };
    try {
      payload = JSON.parse(e.dataTransfer.getData("application/json"));
    } catch {
      return;
    }

    if (payload.fromStatus === toStatus) return;

    const lead = leadsByStatus[payload.fromStatus]?.find(
      (l) => l.id === payload.id,
    );
    if (!lead) return;

    // Auto-expand destination if collapsed so user sees the result
    if (collapsed.has(toStatus)) {
      setCollapsed((prev) => {
        const next = new Set(prev);
        next.delete(toStatus);
        return next;
      });
    }

    // Optimistic update
    setLeadsByStatus((prev) => ({
      ...prev,
      [payload.fromStatus]: prev[payload.fromStatus].filter(
        (l) => l.id !== payload.id,
      ),
      [toStatus]: [{ ...lead, status: toStatus }, ...prev[toStatus]],
    }));

    // Persist
    try {
      const res = await fetch(`/api/leads/${payload.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: toStatus }),
      });
      if (!res.ok) {
        console.error("Status update failed", await res.text());
        // Rollback
        setLeadsByStatus((prev) => ({
          ...prev,
          [toStatus]: prev[toStatus].filter((l) => l.id !== payload.id),
          [payload.fromStatus]: [
            { ...lead, status: payload.fromStatus },
            ...prev[payload.fromStatus],
          ],
        }));
      }
    } catch (err) {
      console.error("Status update failed", err);
      // Rollback
      setLeadsByStatus((prev) => ({
        ...prev,
        [toStatus]: prev[toStatus].filter((l) => l.id !== payload.id),
        [payload.fromStatus]: [
          { ...lead, status: payload.fromStatus },
          ...prev[payload.fromStatus],
        ],
      }));
    }
  }

  return (
    <div className={styles.spreadsheet}>
      {STATUSES.map((status) => {
        const leadsInStatus = leadsByStatus[status];
        const isCollapsed = collapsed.has(status);
        const isDropTarget = dropTarget === status;

        return (
          <section
            key={status}
            className={`${styles.section} ${isDropTarget ? styles.sectionDragOver : ""}`}
            onDragOver={(e) => handleDragOver(e, status)}
            onDrop={(e) => handleDrop(e, status)}
          >
            <button
              type='button'
              onClick={() => toggleCollapsed(status)}
              className={styles.sectionHeader}
            >
              <span className={styles.collapseIcon}>
                {isCollapsed ? "▶" : "▼"}
              </span>
              <span
                className={`${styles.statusLabel} ${styles[`status_${status}`]}`}
              >
                {status}
              </span>
              <span className={styles.sectionCount}>
                ({leadsInStatus.length})
              </span>
            </button>

            {!isCollapsed && (
              <div className={styles.sectionBody}>
                {leadsInStatus.length === 0 ? (
                  <p className={styles.emptyRow}>
                    {isDropTarget
                      ? "Drop here to move into this section"
                      : "No leads in this section"}
                  </p>
                ) : (
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th className={styles.dragHeaderCell}></th>
                        <th>Business</th>
                        <th>Rating</th>
                        <th>Phone</th>
                        <th>Saved</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {leadsInStatus.map((lead) => (
                        <tr
                          key={lead.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, lead, status)}
                          onDragEnd={handleDragEnd}
                          className={`${styles.row} ${draggingId === lead.id ? styles.rowDragging : ""}`}
                        >
                          <td className={styles.dragCell}>
                            <span className={styles.dragHandle}>≡</span>
                          </td>
                          <td className={styles.nameCell}>
                            <div className={styles.businessName}>
                              {lead.businessName ?? "Unnamed"}
                            </div>
                            <div className={styles.category}>
                              {lead.category.replace(/_/g, " ")}
                            </div>
                          </td>
                          <td className={styles.ratingCell}>
                            {lead.rating !== null
                              ? `★ ${lead.rating.toFixed(1)} (${lead.reviewCount ?? 0})`
                              : "—"}
                          </td>
                          <td className={styles.phoneCell}>
                            {lead.businessPhone ?? "—"}
                          </td>
                          <td className={styles.savedCell}>
                            {formatRelative(lead.createdAt)}
                          </td>
                          <td className={styles.actionCell}>
                            {/* <Link
                              href={`/dashboard/leads/${lead.id}`}
                              className={styles.viewLink}
                            >
                              View →
                            </Link> */}
                            <div className={styles.btnContainer}>
                              <Button
                                href={`/dashboard/leads/${lead.id}`}
                                text='View'
                                btnType='accent'
                                arrow
                              />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
