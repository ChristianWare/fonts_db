"use client";

import Link from "next/link";
import styles from "./LeadRow.module.css";
import type { SavedState, SearchResult } from "./types";

type Props = {
  result: SearchResult;
  isPending: boolean;
  onSave: () => void;
  index: number;
};

function isSaved(state: SavedState): boolean {
  return state !== "none";
}

function buildColdHref(placeId: string, category: string): string {
  const path = `/dashboard/leads/cold/${encodeURIComponent(placeId)}`;
  const slug = category.toLowerCase().replace(/\s+/g, "_");
  return `${path}?category=${encodeURIComponent(slug)}`;
}

function formatEventDate(iso: string): string | null {
  const date = new Date(iso);
  if (isNaN(date.getTime())) return null;
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function daysUntilEvent(iso: string): number | null {
  const date = new Date(iso);
  if (isNaN(date.getTime())) return null;
  // Midnight-to-midnight comparison — avoids time-of-day skew
  const now = new Date();
  const eventDay = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffMs = eventDay.getTime() - today.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

function formatDaysLeft(days: number): string {
  if (days < 0) return "Past";
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  return `${days} days`;
}

export default function LeadRow({ result, isPending, onSave, index }: Props) {
  const saved = isSaved(result.savedState);

  let priorityClass: string;
  let typeLabel: string;
  let typeEmoji: string;
  let businessName: string;
  let businessSub: string;
  let metaLabel: string;
  let metaPrimary: string | null;
  let metaSecondary: string | null;
  let contactLabel: string;
  let contactDisplay: string | null;
  let contactHref: string | null;
  let contactClass: string;
  let viewHref: string;

  if (result.temperature === "cold") {
    priorityClass = styles.priorityLow;
    typeLabel = "Cold";
    typeEmoji = "🧊";
    businessName = result.name;
    businessSub = result.category;
    metaLabel = "Rating";
    metaPrimary =
      result.rating !== null ? `★ ${result.rating.toFixed(1)}` : null;
    metaSecondary =
      result.reviewCount !== null ? `(${result.reviewCount})` : null;
    contactLabel = "Phone";
    contactDisplay = result.phone;
    contactHref = result.phone ? `tel:${result.phone}` : null;
    contactClass = "";
    viewHref = buildColdHref(result.placeId, result.category);
  } else if (result.temperature === "warm") {
    priorityClass = styles.priorityMed;
    typeLabel = "Warm";
    typeEmoji = "🌡️";
    businessName = result.eventName;
    businessSub = result.category;
    metaLabel = "Date";
    metaPrimary = formatEventDate(result.eventDateIso);
    metaSecondary = null;
    contactLabel = "Venue";
    contactDisplay = result.venue;
    contactHref = null;
    contactClass = "";
    viewHref = `/dashboard/leads/warm/${encodeURIComponent(result.externalId)}`;
  } else {
    // hot — Eventbrite event ≤14 days out
    priorityClass = styles.priorityHigh;
    typeLabel = "Hot";
    typeEmoji = "🔥";
    businessName = result.eventName;
    businessSub = result.category;
    metaLabel = "Date";
    metaPrimary = formatEventDate(result.eventDateIso);
    metaSecondary = null;
    contactLabel = "Time left";

    const days = daysUntilEvent(result.eventDateIso);
    if (days === null) {
      contactDisplay = null;
      contactClass = "";
    } else {
      contactDisplay = formatDaysLeft(days);
      contactClass =
        days <= 3
          ? styles.urgencyHigh
          : days <= 7
            ? styles.urgencyMed
            : styles.urgencyLow;
    }
    contactHref = null;
    viewHref = `/dashboard/leads/hot/${encodeURIComponent(result.externalId)}`;
  }

  return (
    <div className={styles.row}>
      <div className={`${styles.cell} ${styles.colNumber}`}>{index}.</div>
      <div className={`${styles.cell} ${styles.colType}`}>
        <span className={styles.cellLabelMobile}>Lead Type</span>
        <span className={`${styles.priorityBadge} ${priorityClass}`}>
          <span className={styles.priorityEmoji}>{typeEmoji}</span>
          {typeLabel}
        </span>
      </div>

      <div className={`${styles.cell} ${styles.colBusiness}`}>
        <p className={styles.businessName}>{businessName}</p>
        <p className={styles.businessCategory}>{businessSub}</p>
      </div>

      <div className={`${styles.cell} ${styles.colMeta}`}>
        <span className={styles.cellLabelMobile}>{metaLabel}</span>
        {metaPrimary ? (
          <span className={styles.metaWrap}>
            <span className={styles.metaPrimary}>{metaPrimary}</span>
            {metaSecondary && (
              <span className={styles.metaSecondary}>{metaSecondary}</span>
            )}
          </span>
        ) : (
          <span className={styles.metaSecondary}>—</span>
        )}
      </div>

      <div className={`${styles.cell} ${styles.colContact}`}>
        <span className={styles.cellLabelMobile}>{contactLabel}</span>
        {contactDisplay ? (
          contactHref ? (
            <a href={contactHref} className={styles.contactLink}>
              {contactDisplay}
            </a>
          ) : (
            <span className={contactClass || styles.contactText}>
              {contactDisplay}
            </span>
          )
        ) : (
          <span className={styles.metaSecondary}>—</span>
        )}
      </div>

      <div className={`${styles.cell} ${styles.colSave}`}>
        {saved ? (
          <span className={styles.savedBadge}>✓ Saved</span>
        ) : (
          <button
            type='button'
            onClick={onSave}
            disabled={isPending}
            className={styles.saveBtn}
          >
            {isPending ? "..." : "+ Save"}
          </button>
        )}
      </div>

      <div className={`${styles.cell} ${styles.colView}`}>
        <Link href={viewHref} className={styles.viewBtn}>
          View <span className={styles.viewArrow}>↗</span>
        </Link>
      </div>
    </div>
  );
}
