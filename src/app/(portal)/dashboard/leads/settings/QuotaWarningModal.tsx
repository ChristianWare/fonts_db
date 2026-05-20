"use client";

import Modal from "@/components/shared/Modal/Modal";
import styles from "./QuotaWarningModal.module.css";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  dailyUsed: number;
  dailyLimit: number;
  monthlyUsed: number;
  monthlyLimit: number;
};

export default function QuotaWarningModal({
  isOpen,
  onClose,
  dailyUsed,
  dailyLimit,
  monthlyUsed,
  monthlyLimit,
}: Props) {
  const dailyRemaining = Math.max(0, dailyLimit - dailyUsed);
  const monthlyRemaining = Math.max(0, monthlyLimit - monthlyUsed);
  const atLimit = dailyRemaining === 0 || monthlyRemaining === 0;

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className={styles.content}>
        <h3 className={styles.title}>
          {atLimit ? "You've hit your scrape limit" : "Heads up — running low"}
        </h3>
        <p className={styles.body}>
          Each new market you switch to consumes one scrape from your quota.
          Here&apos;s what you have left:
        </p>
        <ul className={styles.list}>
          <li>
            You only have <strong>{dailyRemaining}</strong> market change
            {dailyRemaining === 1 ? "" : "s"} for today.
          </li>
          <li>
            You only have <strong>{monthlyRemaining}</strong> market change
            {monthlyRemaining === 1 ? "" : "s"} for this month.
          </li>
        </ul>
        <p className={styles.note}>
          Quotas reset daily at midnight and monthly on the 1st. Your last saved
          market stays active in the meantime.
        </p>
        <div className={styles.actions}>
          <button type='button' onClick={onClose} className={styles.button}>
            Got it
          </button>
        </div>
      </div>
    </Modal>
  );
}
