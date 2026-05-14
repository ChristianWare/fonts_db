"use client";

import Button from "@/components/shared/Button/Button";
import styles from "./LeadCards.module.css";
import type { ColdLeadResult, SavedState } from "./types";

type Props = {
  result: ColdLeadResult;
  isPending: boolean;
  onSave: () => void;
};

function isSaved(state: SavedState): boolean {
  return state !== "none";
}

function buildPlaceHref(placeId: string, category: string): string {
  const path = `/dashboard/leads/cold/${encodeURIComponent(placeId)}`;
  const slug = category.toLowerCase().replace(/\s+/g, "_");
  return `${path}?category=${encodeURIComponent(slug)}`;
}

export default function ColdLeadCard({ result, isPending, onSave }: Props) {
  const saved = isSaved(result.savedState);

  return (
    <div className={styles.card}>
      <div className={styles.cardTop}>
        <div className={styles.cardTempRow}>
          <span className={`${styles.tempBadge} ${styles.tempCold}`}>
            🧊 Cold
          </span>
          <span className={styles.cardCategory}>{result.category}</span>
        </div>

        <h3 className={styles.cardName}>{result.name}</h3>
        <p className={styles.cardAddress}>{result.address}</p>

        {result.rating !== null && (
          <p className={styles.cardRating}>
            ★ {result.rating.toFixed(1)}{" "}
            <span className={styles.cardReviewCount}>
              ({result.reviewCount ?? 0} reviews)
            </span>
          </p>
        )}

        <div className={styles.cardMeta}>
          {result.phone && <span>{result.phone}</span>}
          {result.website && (
            <a
              href={result.website}
              target='_blank'
              rel='noopener noreferrer'
              className={styles.cardLink}
            >
              Visit website ↗
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
            href={buildPlaceHref(result.placeId, result.category)}
            text='View details'
            btnType='black'
            arrow
          />
        </div>
      </div>
    </div>
  );
}
