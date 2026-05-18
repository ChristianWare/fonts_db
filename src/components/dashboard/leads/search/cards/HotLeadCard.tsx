"use client";

import Button from "@/components/shared/Button/Button";
import styles from "./LeadCards.module.css";
import type { HotLeadResult, SavedState } from "./types";

type Props = {
  result: HotLeadResult;
  isPending: boolean;
  onSave: () => void;
};

function isSaved(state: SavedState): boolean {
  return state !== "none";
}

function daysUntil(iso: string): string {
  const diffMs = new Date(iso).getTime() - Date.now();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (days < 0) return "Passed";
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  return `${days} days away`;
}

function formatEventDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function HotLeadCard({ result, isPending, onSave }: Props) {
  const saved = isSaved(result.savedState);

  return (
    <div className={styles.card}>
      <div className={styles.cardTop}>
        <div className={styles.cardTempRow}>
          <span className={`${styles.tempBadge} ${styles.tempHot}`}>
            🔥 Hot
          </span>
          <span className={styles.cardCategory}>
            Eventbrite · {daysUntil(result.eventDateIso)}
          </span>
        </div>

        <h3 className={styles.cardName}>{result.eventName}</h3>

        {result.venue && (
          <p className={styles.cardAddress}>at {result.venue}</p>
        )}

        <p className={styles.cardPostText}>
          {formatEventDate(result.eventDateIso)}
          {result.organizerName ? ` · ${result.organizerName}` : ""}
          {result.attendeeCount
            ? ` · ~${result.attendeeCount.toLocaleString()} attendees`
            : ""}
        </p>

        <div className={styles.cardMeta}>
          {result.organizerPhone && (
            <a
              href={`tel:${result.organizerPhone}`}
              className={styles.cardLink}
            >
              {result.organizerPhone}
            </a>
          )}
          {result.organizerEmail && (
            <a
              href={`mailto:${result.organizerEmail}`}
              className={styles.cardLink}
            >
              {result.organizerEmail}
            </a>
          )}
        </div>
      </div>

      <div className={styles.cardBottom}>
        <div className={styles.cardActionRow}>
          {saved ? (
            <span className={styles.savedBadge}>✓ Saved</span>
          ) : (
            <button
              type='button'
              onClick={onSave}
              disabled={isPending}
              className={styles.saveBtn}
            >
              {isPending ? "Saving..." : "+ Save"}
            </button>
          )}
        </div>
        <div className={styles.btnContainer}>
          <Button
            href={result.url}
            text='View on Eventbrite'
            btnType='black'
            arrow
          />
        </div>
      </div>
    </div>
  );
}