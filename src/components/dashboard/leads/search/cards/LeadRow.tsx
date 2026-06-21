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
  return date.toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "2-digit",
  });
}

function daysUntilEvent(iso: string): number | null {
  const date = new Date(iso);
  if (isNaN(date.getTime())) return null;
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

  let businessName: string;
  let businessSub: string;
  let metaLabel: string;
  let metaPrimary: string | null;
  let metaSecondary: string | null;
  let viewHref: string;

  // Hot leads surface time-left as a badge in the business cell so the urgency
  // signal isn't lost when we drop the contact column
  let timeLeftBadge: { text: string; urgencyClass: string } | null = null;

  if (result.temperature === "cold") {
    businessName = result.name;
    businessSub = "";
    metaLabel = "Google rating";
    metaPrimary =
      result.rating !== null ? `★ ${result.rating.toFixed(1)}` : null;
    metaSecondary =
      result.reviewCount !== null ? `(${result.reviewCount})` : null;
    viewHref = buildColdHref(result.placeId, result.category);
  } else if (result.temperature === "warm") {
    businessName = result.eventName;
    // Keep venue visible under the event name — category gets its own column
    businessSub = result.venue ?? "";
    metaLabel = "Date";
    metaPrimary = formatEventDate(result.eventDateIso);
    metaSecondary = null;
    viewHref = `/dashboard/leads/warm/${encodeURIComponent(result.externalId)}`;
  } else {
    // hot
    businessName = result.eventName;
    businessSub = "";
    metaLabel = "Date";
    metaPrimary = formatEventDate(result.eventDateIso);
    metaSecondary = null;

    const days = daysUntilEvent(result.eventDateIso);
    if (days !== null) {
      timeLeftBadge = {
        text: formatDaysLeft(days),
        urgencyClass:
          days <= 3
            ? styles.urgencyHigh
            : days <= 7
              ? styles.urgencyMed
              : styles.urgencyLow,
      };
    }

    viewHref = `/dashboard/leads/hot/${encodeURIComponent(result.externalId)}`;
  }

  return (
    <div className={styles.row}>
      <div className={`${styles.cell} ${styles.colNumber}`}>{index}.</div>

      <div className={`${styles.cell} ${styles.colBusiness}`}>
        <p className={styles.businessName}>{businessName}</p>
        {businessSub && (
          <p className={styles.businessCategory}>{businessSub}</p>
        )}
        <div className={styles.businessBadges}>
          {result.contactReady && (
            <span className={styles.contactReadyBadge}>✓ Contact Ready</span>
          )}
          {typeof result.aiScore === "number" && result.aiScore >= 85 && (
            <span className={styles.topMatchBadge}>⭐ Top Match</span>
          )}

          {/* --- Lead-quality badges (cold only) --- */}
          {result.temperature === "cold" && result.isRecurring && (
            <span className={styles.badgeRecurring}>Recurring</span>
          )}
          {result.temperature === "cold" &&
            result.hasTransportPartner === false && (
              <span className={styles.badgeOpen}>No partner</span>
            )}
          {result.temperature === "cold" &&
            result.hasTransportPartner === true && (
              <span className={styles.badgeHasPartner}>Has partner</span>
            )}

          {timeLeftBadge && (
            <span
              className={`${styles.scoreBadge} ${timeLeftBadge.urgencyClass}`}
            >
              ⏰ {timeLeftBadge.text}
            </span>
          )}
        </div>
      </div>

      <div className={`${styles.cell} ${styles.colCategory}`}>
        <span className={styles.cellLabelMobile}>Category</span>
        <span className={styles.metaPrimary}>{result.category}</span>
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
        <span className={styles.cellLabelMobile}>Lead score</span>
        {typeof result.aiScore === "number" ? (
          <span className={styles.metaWrap}>
            <span className={styles.metaPrimary}>{result.aiScore}</span>
            <span className={styles.metaSecondary}>/100</span>
          </span>
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
