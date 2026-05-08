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

function timeAgo(iso: string): string {
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min${mins === 1 ? "" : "s"} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

function sourceLabel(src: HotLeadResult["source"]): string {
  if (src === "facebook") return "Facebook";
  if (src === "reddit") return "Reddit";
  return "Eventbrite";
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
            {sourceLabel(result.source)} · {timeAgo(result.postedAtIso)}
          </span>
        </div>

        <h3 className={styles.cardName}>{result.posterName}</h3>

        {result.groupName && (
          <p className={styles.cardAddress}>posted in {result.groupName}</p>
        )}

        <p className={styles.cardPostText}>&ldquo;{result.postText}&rdquo;</p>

        <div className={styles.cardMeta}>
          {result.phone && (
            <a href={`tel:${result.phone}`} className={styles.cardLink}>
              {result.phone}
            </a>
          )}
          {result.email && (
            <a href={`mailto:${result.email}`} className={styles.cardLink}>
              {result.email}
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
            text='View original post'
            btnType='black'
            arrow
          />
        </div>
      </div>
    </div>
  );
}
