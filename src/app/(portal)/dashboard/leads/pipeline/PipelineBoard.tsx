"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import styles from "./PipelinePage.module.css";

type LeadStatus =
  | "NEW"
  | "CONTACTED"
  | "NURTURING"
  | "SNOOZED"
  | "WON"
  | "DEAD";

type SerializedLead = {
  id: string;
  category: string;
  businessName: string | null;
  businessAddress: string | null;
  rating: number | null;
  reviewCount: number | null;
  status: LeadStatus;
  createdAt: string;
};

const COLUMNS: Array<{ status: LeadStatus; label: string }> = [
  { status: "NEW", label: "New" },
  { status: "CONTACTED", label: "Contacted" },
  { status: "NURTURING", label: "Nurturing" },
  { status: "SNOOZED", label: "Snoozed" },
  { status: "WON", label: "Won" },
  { status: "DEAD", label: "Dead" },
];

export default function PipelineBoard({ leads }: { leads: SerializedLead[] }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [optimistic, setOptimistic] = useState<SerializedLead[]>(leads);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<LeadStatus | null>(null);

  // Re-sync local state when server state changes (after router.refresh)
  useEffect(() => {
    setOptimistic(leads);
  }, [leads]);

  function handleDragStart(e: React.DragEvent, leadId: string) {
    e.dataTransfer.setData("leadId", leadId);
    e.dataTransfer.effectAllowed = "move";
    setDraggingId(leadId);
  }

  function handleDragEnd() {
    setDraggingId(null);
    setDragOverColumn(null);
  }

  function handleDragOver(e: React.DragEvent, status: LeadStatus) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverColumn(status);
  }

  function handleDragLeave() {
    setDragOverColumn(null);
  }

  async function handleDrop(e: React.DragEvent, newStatus: LeadStatus) {
    e.preventDefault();
    const leadId = e.dataTransfer.getData("leadId");
    setDraggingId(null);
    setDragOverColumn(null);

    if (!leadId) return;

    const lead = optimistic.find((l) => l.id === leadId);
    if (!lead || lead.status === newStatus) return;

    const previousStatus = lead.status;

    // Optimistic update — card moves immediately, server sync follows
    setOptimistic((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, status: newStatus } : l)),
    );

    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        console.error("Status update failed", await res.text());
        // Revert on failure
        setOptimistic((prev) =>
          prev.map((l) =>
            l.id === leadId ? { ...l, status: previousStatus } : l,
          ),
        );
        return;
      }

      startTransition(() => router.refresh());
    } catch (err) {
      console.error("Status update failed", err);
      setOptimistic((prev) =>
        prev.map((l) =>
          l.id === leadId ? { ...l, status: previousStatus } : l,
        ),
      );
    }
  }

  return (
    <div className={styles.board}>
      {COLUMNS.map((col) => {
        const columnLeads = optimistic.filter((l) => l.status === col.status);
        const isDragOver = dragOverColumn === col.status;

        return (
          <div
            key={col.status}
            className={`${styles.column} ${isDragOver ? styles.columnDragOver : ""}`}
            onDragOver={(e) => handleDragOver(e, col.status)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, col.status)}
          >
            <div className={styles.columnHeader}>
              <span
                className={`${styles.columnLabel} ${styles[`label_${col.status}`]}`}
              >
                {col.label}
              </span>
              <span className={styles.columnCount}>{columnLeads.length}</span>
            </div>

            <div className={styles.columnCards}>
              {columnLeads.length === 0 ? (
                <p className={styles.columnEmpty}>—</p>
              ) : (
                columnLeads.map((lead) => (
                  <div
                    key={lead.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, lead.id)}
                    onDragEnd={handleDragEnd}
                    className={`${styles.leadCard} ${draggingId === lead.id ? styles.leadCardDragging : ""}`}
                  >
                    <p className={styles.leadCategory}>
                      {lead.category.replace(/_/g, " ")}
                    </p>
                    <p className={styles.leadName}>
                      {lead.businessName ?? "Unnamed"}
                    </p>
                    {lead.businessAddress && (
                      <p className={styles.leadAddress}>
                        {lead.businessAddress}
                      </p>
                    )}
                    {lead.rating !== null && (
                      <p className={styles.leadRating}>
                        ★ {lead.rating.toFixed(1)}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
