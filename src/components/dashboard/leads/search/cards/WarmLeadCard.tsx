"use client";

import Button from "@/components/shared/Button/Button";
import styles from "./LeadCards.module.css";
import type { WarmLeadResult, SavedState } from "./types";

type Props = {
  result: WarmLeadResult;
  isPending: boolean;
  onSave: () => void;
};

function isSaved(state: SavedState): boolean {
  return state !== "none";
}

function formatEventDate(iso: string): { display: string; daysAway: number } {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const daysAway = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  const display = date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  return { display, daysAway };
}

export default function WarmLeadCard({ result, isPending, onSave }: Props) {
  const saved = isSaved(result.savedState);
  const { display, daysAway } = formatEventDate(result.eventDateIso);

  return (
    <div className={styles.card}>
      <div className={styles.cardTop}>
        <div className={styles.cardTempRow}>
          <span className={`${styles.tempBadge} ${styles.tempWarm}`}>
            🌡️ Warm
          </span>
          <span className={styles.cardCategory}>{result.category}</span>
        </div>

        <h3 className={styles.cardName}>{result.eventName}</h3>

        <div className={styles.cardEventMeta}>
          <span className={styles.cardEventDate}>{display}</span>
          <span className={styles.cardEventCountdown}>
            {daysAway > 0
              ? `In ${daysAway} day${daysAway === 1 ? "" : "s"}`
              : "Today"}
          </span>
        </div>

        {result.venue && <p className={styles.cardAddress}>{result.venue}</p>}

        {result.attendeeCount !== null && (
          <p className={styles.cardAttendees}>
            ~{result.attendeeCount} attendees
          </p>
        )}

        {result.organizerName && (
          <p className={styles.cardOrganizer}>
            Organizer: <strong>{result.organizerName}</strong>
          </p>
        )}

        <div className={styles.cardMeta}>
          {result.organizerPhone && <span>{result.organizerPhone}</span>}
          {result.organizerEmail && <span>{result.organizerEmail}</span>}
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
