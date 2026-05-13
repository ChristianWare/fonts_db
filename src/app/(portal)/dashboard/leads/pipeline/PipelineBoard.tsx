"use client";

import styles from "./PipelinePage.module.css";
import { useMemo, useState } from "react";
import Button from "@/components/shared/Button/Button";

type LeadStatus =
  | "NEW"
  | "CONTACTED"
  | "NURTURING"
  | "SNOOZED"
  | "WON"
  | "DEAD";

type TypeFilter = "hot" | "warm" | "cold";

type SortField =
  | "leadScore"
  | "business"
  | "googleRating"
  | "venue"
  | "eventDate"
  | "eventName"
  | "saved";

type SortDirection = "asc" | "desc";

type HeaderSortState = {
  field: SortField;
  direction: SortDirection;
};

type SerializedLead = {
  id: string;
  leadType: string;
  googlePlaceId: string | null;
  eventbriteId: string | null;
  status: LeadStatus;
  category: string;
  businessName: string | null;
  rating: number | null;
  reviewCount: number | null;
  businessPhone: string | null;
  aiScore: number | null;
  createdAt: string;
  // Event-specific (null for cold)
  eventName: string | null;
  eventDate: string | null;
  venueName: string | null;
  expectedAttendance: number | null;
  organizerName: string | null;
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

function formatEventDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "2-digit",
  });
}

function leadHref(lead: SerializedLead): string {
  if (
    (lead.leadType === "WARM" || lead.leadType === "HOT") &&
    lead.eventbriteId
  ) {
    return `/dashboard/leads/warm/${encodeURIComponent(lead.eventbriteId)}`;
  }
  if (lead.googlePlaceId) {
  return `/dashboard/leads/cold/${encodeURIComponent(lead.googlePlaceId)}`;
  }
  return `/dashboard/leads/${lead.id}`;
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

function getSortValue(
  lead: SerializedLead,
  field: SortField,
): string | number | null {
  switch (field) {
    case "leadScore":
      return lead.aiScore;
    case "business":
      return (lead.businessName ?? "").toLowerCase();
    case "googleRating":
      return lead.rating;
    case "venue":
      return (lead.venueName ?? "").toLowerCase();
    case "eventDate":
      return lead.eventDate ?? "";
    case "eventName":
      return (lead.eventName ?? "").toLowerCase();
    case "saved":
      return lead.createdAt;
  }
}

function sortLeads(
  leads: SerializedLead[],
  sort: HeaderSortState | null,
): SerializedLead[] {
  if (!sort) return leads;
  const copy = [...leads];
  copy.sort((a, b) => {
    const aVal = getSortValue(a, sort.field);
    const bVal = getSortValue(b, sort.field);
    // Empty / null values sink to the bottom regardless of direction
    const aEmpty = aVal === null || aVal === "";
    const bEmpty = bVal === null || bVal === "";
    if (aEmpty && bEmpty) return 0;
    if (aEmpty) return 1;
    if (bEmpty) return -1;
    if (aVal! < bVal!) return sort.direction === "asc" ? -1 : 1;
    if (aVal! > bVal!) return sort.direction === "asc" ? 1 : -1;
    return 0;
  });
  return copy;
}

function SortableHeader({
  label,
  field,
  currentSort,
  onSort,
}: {
  label: string;
  field: SortField;
  currentSort: HeaderSortState | null;
  onSort: (field: SortField) => void;
}) {
  const isActive = currentSort?.field === field;
  const direction = isActive ? currentSort!.direction : null;
  return (
    <th
      onClick={() => onSort(field)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSort(field);
        }
      }}
      role='button'
      tabIndex={0}
      className={`${styles.sortableHeader} ${isActive ? styles.sortableHeaderActive : ""}`}
    >
      {label}
      <span className={styles.sortIndicator}>
        {direction === "asc" ? "▲" : direction === "desc" ? "▼" : ""}
      </span>
    </th>
  );
}

type Props = {
  initialLeads: SerializedLead[];
  typeFilter?: TypeFilter;
};

export default function PipelineBoard({
  initialLeads,
  typeFilter = "cold",
}: Props) {
  const [leadsByStatus, setLeadsByStatus] = useState(() =>
    groupByStatus(initialLeads),
  );
  const [collapsed, setCollapsed] = useState<Set<LeadStatus>>(new Set());
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [draggingFrom, setDraggingFrom] = useState<LeadStatus | null>(null);
  const [dropTarget, setDropTarget] = useState<LeadStatus | null>(null);
  const [headerSort, setHeaderSort] = useState<HeaderSortState | null>(null);

  const isEventView = typeFilter === "hot" || typeFilter === "warm";

  // Apply sort within each status bucket (memoized so sort doesn't run on every render)
  const sortedLeadsByStatus = useMemo(() => {
    const out: Record<LeadStatus, SerializedLead[]> = {
      NEW: sortLeads(leadsByStatus.NEW, headerSort),
      CONTACTED: sortLeads(leadsByStatus.CONTACTED, headerSort),
      NURTURING: sortLeads(leadsByStatus.NURTURING, headerSort),
      SNOOZED: sortLeads(leadsByStatus.SNOOZED, headerSort),
      WON: sortLeads(leadsByStatus.WON, headerSort),
      DEAD: sortLeads(leadsByStatus.DEAD, headerSort),
    };
    return out;
  }, [leadsByStatus, headerSort]);

  function handleSort(field: SortField) {
    setHeaderSort((prev) => {
      if (prev?.field === field) {
        return { field, direction: prev.direction === "asc" ? "desc" : "asc" };
      }
      return { field, direction: "asc" };
    });
  }

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

    if (collapsed.has(toStatus)) {
      setCollapsed((prev) => {
        const next = new Set(prev);
        next.delete(toStatus);
        return next;
      });
    }

    setLeadsByStatus((prev) => ({
      ...prev,
      [payload.fromStatus]: prev[payload.fromStatus].filter(
        (l) => l.id !== payload.id,
      ),
      [toStatus]: [{ ...lead, status: toStatus }, ...prev[toStatus]],
    }));

    try {
      const res = await fetch(`/api/leads/${payload.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: toStatus }),
      });
      if (!res.ok) {
        console.error("Status update failed", await res.text());
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
        const leadsInStatus = sortedLeadsByStatus[status];
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
              <span
                className={`${styles.collapseIcon} ${isCollapsed ? styles.collapseIconClosed : ""}`}
              >
                ▼
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

            <div
              className={`${styles.sectionBody} ${!isCollapsed ? styles.sectionBodyOpen : ""}`}
            >
              <div className={styles.sectionBodyInner}>
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
                        <SortableHeader
                          label='Lead score'
                          field='leadScore'
                          currentSort={headerSort}
                          onSort={handleSort}
                        />
                        {isEventView ? (
                          <>
                            <SortableHeader
                              label='Event'
                              field='eventName'
                              currentSort={headerSort}
                              onSort={handleSort}
                            />
                            <SortableHeader
                              label='Date'
                              field='eventDate'
                              currentSort={headerSort}
                              onSort={handleSort}
                            />
                            <SortableHeader
                              label='Venue'
                              field='venue'
                              currentSort={headerSort}
                              onSort={handleSort}
                            />
                          </>
                        ) : (
                          <>
                            <SortableHeader
                              label='Business'
                              field='business'
                              currentSort={headerSort}
                              onSort={handleSort}
                            />
                            <SortableHeader
                              label='Google rating'
                              field='googleRating'
                              currentSort={headerSort}
                              onSort={handleSort}
                            />
                          </>
                        )}
                        <SortableHeader
                          label='Saved'
                          field='saved'
                          currentSort={headerSort}
                          onSort={handleSort}
                        />
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
                          <td className={styles.scoreCell}>
                            {lead.aiScore != null ? (
                              <span className={styles.leadScore}>
                                {lead.aiScore}
                                <span className={styles.leadScoreOutOf}>
                                  /100
                                </span>
                              </span>
                            ) : (
                              "—"
                            )}
                          </td>

                          {isEventView ? (
                            <>
                              <td className={styles.nameCell}>
                                <div className={styles.businessName}>
                                  {lead.eventName ??
                                    lead.businessName ??
                                    "Unnamed event"}
                                </div>
                                {lead.organizerName && (
                                  <div className={styles.category}>
                                    {lead.organizerName}
                                  </div>
                                )}
                              </td>
                              <td className={styles.phoneCell}>
                                {lead.eventDate
                                  ? formatEventDate(lead.eventDate)
                                  : "—"}
                              </td>
                              <td className={styles.phoneCell}>
                                {lead.venueName ?? "—"}
                              </td>
                            </>
                          ) : (
                            <>
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
                            </>
                          )}

                          <td className={styles.savedCell}>
                            {formatRelative(lead.createdAt)}
                          </td>
                          <td className={styles.actionCell}>
                            <div className={styles.btnContainer}>
                              <Button
                                href={leadHref(lead)}
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
            </div>
          </section>
        );
      })}
    </div>
  );
}
