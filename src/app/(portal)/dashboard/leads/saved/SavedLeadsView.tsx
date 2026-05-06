"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import styles from "./SavedLeadsPage.module.css";

type LeadStatus =
  | "NEW"
  | "CONTACTED"
  | "NURTURING"
  | "SNOOZED"
  | "WON"
  | "DEAD";

type SerializedLead = {
  id: string;
  leadType: string;
  source: string;
  category: string;
  businessName: string | null;
  businessAddress: string | null;
  businessPhone: string | null;
  businessWebsite: string | null;
  rating: number | null;
  reviewCount: number | null;
  status: LeadStatus;
  notes: string | null;
  createdAt: string;
};

type Counts = {
  all: number;
  NEW: number;
  CONTACTED: number;
  NURTURING: number;
  SNOOZED: number;
  WON: number;
  DEAD: number;
};

type FilterValue = "all" | LeadStatus;

const FILTERS: Array<{ value: FilterValue; label: string }> = [
  { value: "all", label: "All" },
  { value: "NEW", label: "New" },
  { value: "CONTACTED", label: "Contacted" },
  { value: "NURTURING", label: "Nurturing" },
  { value: "SNOOZED", label: "Snoozed" },
  { value: "WON", label: "Won" },
  { value: "DEAD", label: "Dead" },
];

const STATUS_OPTIONS: LeadStatus[] = [
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
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days} days ago`;
  if (days < 365) return `${Math.floor(days / 30)} months ago`;
  return `${Math.floor(days / 365)} years ago`;
}

export default function SavedLeadsView({
  leads,
  counts,
}: {
  leads: SerializedLead[];
  counts: Counts;
}) {
  const router = useRouter();
  const [filter, setFilter] = useState<FilterValue>("all");
  const [updating, setUpdating] = useState<Set<string>>(new Set());
  const [, startTransition] = useTransition();
  const [notesDraft, setNotesDraft] = useState<Record<string, string>>({});

  const filtered =
    filter === "all" ? leads : leads.filter((l) => l.status === filter);

  async function updateLead(
    id: string,
    patch: { status?: LeadStatus; notes?: string },
  ) {
    setUpdating((prev) => new Set(prev).add(id));
    try {
      const res = await fetch(`/api/leads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) {
        console.error("Update failed", await res.text());
        return;
      }
      startTransition(() => router.refresh());
    } catch (err) {
      console.error("Update failed", err);
    } finally {
      setUpdating((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }

  return (
    <>
      {/* Filter chips */}
      <div className={styles.filters}>
        {FILTERS.map((f) => {
          const count =
            f.value === "all" ? counts.all : counts[f.value as LeadStatus];
          // Hide empty filters except "All" or the currently selected one
          if (count === 0 && f.value !== "all" && filter !== f.value) {
            return null;
          }
          return (
            <button
              key={f.value}
              type="button"
              onClick={() => setFilter(f.value)}
              className={
                filter === f.value
                  ? `${styles.filterChip} ${styles.filterChipActive}`
                  : styles.filterChip
              }
            >
              {f.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Cards */}
      {filtered.length === 0 ? (
        <p className={styles.filterEmpty}>No leads with this status.</p>
      ) : (
        <div className={styles.cardsGrid}>
          {filtered.map((lead) => {
            const isUpdating = updating.has(lead.id);
            const currentNote = notesDraft[lead.id] ?? lead.notes ?? "";

            return (
              <div key={lead.id} className={styles.card}>
                <div className={styles.cardTop}>
                  <span
                    className={`${styles.statusBadge} ${styles[`status_${lead.status}`]}`}
                  >
                    {lead.status}
                  </span>
                  <span className={styles.cardCategory}>
                    {lead.category.replace(/_/g, " ")}
                  </span>
                </div>

                <h3 className={styles.cardName}>
                  {lead.businessName ?? "Unnamed"}
                </h3>

                {lead.businessAddress && (
                  <p className={styles.cardAddress}>
                    {lead.businessAddress}
                  </p>
                )}

                {lead.rating !== null && (
                  <p className={styles.cardRating}>
                    ★ {lead.rating.toFixed(1)}
                    <span className={styles.cardReviewCount}>
                      &nbsp;({lead.reviewCount ?? 0} reviews)
                    </span>
                  </p>
                )}

                <div className={styles.cardMeta}>
                  {lead.businessPhone && (
                    <a
                      href={`tel:${lead.businessPhone}`}
                      className={styles.cardLink}
                    >
                      {lead.businessPhone}
                    </a>
                  )}
                  {lead.businessWebsite && (
                    <a
                      href={lead.businessWebsite}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.cardLink}
                    >
                      Website ↗
                    </a>
                  )}
                </div>

                <div className={styles.cardActions}>
                  <label className={styles.actionLabel}>
                    <span className={styles.actionLabelText}>Status</span>
                    <select
                      value={lead.status}
                      disabled={isUpdating}
                      onChange={(e) =>
                        updateLead(lead.id, {
                          status: e.target.value as LeadStatus,
                        })
                      }
                      className={styles.statusSelect}
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className={styles.actionLabel}>
                    <span className={styles.actionLabelText}>Notes</span>
                    <textarea
                      value={currentNote}
                      disabled={isUpdating}
                      onChange={(e) =>
                        setNotesDraft({
                          ...notesDraft,
                          [lead.id]: e.target.value,
                        })
                      }
                      onBlur={() => {
                        if (currentNote !== (lead.notes ?? "")) {
                          updateLead(lead.id, { notes: currentNote });
                        }
                      }}
                      placeholder="Quick notes — autosave on blur"
                      className={styles.notesInput}
                      rows={2}
                    />
                  </label>
                </div>

                <p className={styles.cardSaved}>
                  Saved {formatRelative(lead.createdAt)}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}