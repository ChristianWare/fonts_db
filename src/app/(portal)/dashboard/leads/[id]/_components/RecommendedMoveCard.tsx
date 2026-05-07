"use client";
import styles from "./LeadEnhancements.module.css";
import type { NextMoveSuggestion } from "../../../../../../lib/leadNextMove";

type Props = { suggestion: NextMoveSuggestion };

const PRIORITY_CLASS: Record<string, string> = {
  urgent: styles.moveCardUrgent,
  due: styles.moveCardDue,
  wait: styles.moveCardWait,
  info: styles.moveCardInfo,
};

const CHANNEL_LABEL: Record<string, string> = {
  EMAIL: "Email",
  PHONE: "Phone",
  LINKEDIN: "LinkedIn",
  SMS: "SMS",
  IN_PERSON: "In person",
};

export default function RecommendedMoveCard({ suggestion }: Props) {
  return (
    <section
      className={`${styles.moveCard} ${PRIORITY_CLASS[suggestion.priority] ?? ""}`}
    >
      <p className={styles.moveCardLabel}>
        {suggestion.fromUser ? "Your next action" : "Recommended next move"}
      </p>
      <h2 className={styles.moveCardHeadline}>{suggestion.headline}</h2>
      <p className={styles.moveCardDetail}>{suggestion.detail}</p>
      {suggestion.channel && (
        <p className={styles.moveCardChannel}>
          Suggested channel:{" "}
          <strong>{CHANNEL_LABEL[suggestion.channel]}</strong>
        </p>
      )}
    </section>
  );
}
