/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import styles from "./LeadEnhancements.module.css";

type Props = {
  leadType: "HOT" | "WARM" | "COLD";
  category: string;
  source: string;
  createdAt: string | Date;
  outreachAttempts: number;
  daysSinceLastContact: number | null;
};

const TYPE_CLASS: Record<string, string> = {
  HOT: styles.typeBadgeHot,
  WARM: styles.typeBadgeWarm,
  COLD: styles.typeBadgeCold,
};

const SOURCE_LABELS: Record<string, string> = {
  google_places: "Cold search",
  facebook: "Facebook",
  nextdoor: "Nextdoor",
  eventbrite: "Eventbrite",
  linkedin: "LinkedIn",
};

function formatDate(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatCategory(cat: string): string {
  return cat.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
}

export default function LeadSourceBar({
  leadType,
  category,
  source,
  createdAt,
  outreachAttempts,
  daysSinceLastContact,
}: Props) {
  const sourceLabel = SOURCE_LABELS[source] ?? source;
  return (
    <div className={styles.sourceBar}>
      <div className={styles.sourceBarLeft}>
        <span className={`${styles.typeBadge} ${TYPE_CLASS[leadType] ?? ""}`}>
          {leadType}
        </span>
        <span className={styles.sourceBarItem}>{formatCategory(category)}</span>
        <span className={styles.sourceBarItem}>·</span>
        <span className={styles.sourceBarItem}>via {sourceLabel}</span>
        {/* <span className={styles.sourceBarItem}>·</span> */}
        {/* <span className={styles.sourceBarItem}>
          saved {formatDate(createdAt)}
        </span> */}
      </div>
      <div className={styles.sourceBarRight}>
        {/* <span className={styles.sourceBarItem}>
          {outreachAttempts} attempt{outreachAttempts === 1 ? "" : "s"}
        </span> */}
        {daysSinceLastContact !== null && (
          <>
            <span className={styles.sourceBarItem}>·</span>
            <span className={styles.sourceBarItem}>
              last contact {daysSinceLastContact}d ago
            </span>
          </>
        )}
      </div>
    </div>
  );
}
