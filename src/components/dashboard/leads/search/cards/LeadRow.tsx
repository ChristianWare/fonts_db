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
  const path = `/dashboard/leads/place/${encodeURIComponent(placeId)}`;
  const slug = category.toLowerCase().replace(/\s+/g, "_");
  return `${path}?category=${encodeURIComponent(slug)}`;
}

function timeAgo(iso: string): string {
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function formatEventDate(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export default function LeadRow({ result, isPending, onSave, index }: Props) {
  const saved = isSaved(result.savedState);

  // Per-temperature display derivations
  let priorityClass: string;
  let typeLabel: string;
  let typeEmoji: string;
  let businessName: string;
  let businessSub: string;
  let metaPrimary: string | null;
  let metaSecondary: string | null;
  let contactDisplay: string | null;
  let contactHref: string | null;
  let viewHref: string;
  let viewExternal: boolean;

  if (result.temperature === "cold") {
    priorityClass = styles.priorityLow;
    typeLabel = "Cold";
    typeEmoji = "🧊";
    businessName = result.name;
    businessSub = result.category;
    metaPrimary =
      result.rating !== null ? `★ ${result.rating.toFixed(1)}` : null;
    metaSecondary =
      result.reviewCount !== null ? `(${result.reviewCount})` : null;
    contactDisplay = result.phone;
    contactHref = result.phone ? `tel:${result.phone}` : null;
    viewHref = buildColdHref(result.placeId, result.category);
    viewExternal = false;
  } else if (result.temperature === "warm") {
    priorityClass = styles.priorityMed;
    typeLabel = "Warm";
    typeEmoji = "🌡️";
    businessName = result.eventName;
    businessSub = result.category;
    metaPrimary = formatEventDate(result.eventDateIso);
    metaSecondary = null;
    contactDisplay = result.organizerPhone || result.organizerEmail;
    contactHref = result.organizerPhone
      ? `tel:${result.organizerPhone}`
      : result.organizerEmail
        ? `mailto:${result.organizerEmail}`
        : null;
    viewHref = result.url;
    viewExternal = true;
  } else {
    priorityClass = styles.priorityHigh;
    typeLabel = "Hot";
    typeEmoji = "🔥";
    businessName = result.posterName;
    businessSub = result.groupName ?? result.source;
    metaPrimary = timeAgo(result.postedAtIso);
    metaSecondary = null;
    contactDisplay = result.phone || result.email;
    contactHref = result.phone
      ? `tel:${result.phone}`
      : result.email
        ? `mailto:${result.email}`
        : null;
    viewHref = result.url;
    viewExternal = true;
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
        <span className={styles.cellLabelMobile}>Rating</span>
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
        <span className={styles.cellLabelMobile}>Phone</span>
        {contactDisplay ? (
          contactHref ? (
            <a href={contactHref} className={styles.contactLink}>
              {contactDisplay}
            </a>
          ) : (
            <span>{contactDisplay}</span>
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
        {viewExternal ? (
          <a
            href={viewHref}
            target='_blank'
            rel='noopener noreferrer'
            className={styles.viewBtn}
          >
            View <span className={styles.viewArrow}>↗</span>
          </a>
        ) : (
          <Link href={viewHref} className={styles.viewBtn}>
            View <span className={styles.viewArrow}>↗</span>
          </Link>
        )}
      </div>
    </div>
  );
}
