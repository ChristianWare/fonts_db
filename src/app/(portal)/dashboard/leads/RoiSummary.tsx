// Server component. Drop into the leads dashboard:
//   import RoiSummary from "./RoiSummary";
//   ...
//   <RoiSummary clientProfileId={profile.id} />
//
// Renders the "your results" headline over data you already store.

import { getRoiStats } from "@/lib/leads/roiStats";
import styles from "./RoiSummary.module.css";

function formatUsd(n: number): string {
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

export default async function RoiSummary({
  clientProfileId,
}: {
  clientProfileId: string;
}) {
  const stats = await getRoiStats(clientProfileId);

  // Nothing to show yet — don't render an empty, sad panel.
  if (stats.totalSaved === 0) return null;

  return (
    <section className={styles.wrap}>
      <div className={styles.sectionHeader}>
        <span className={styles.sectionNumber}>—</span>
        <h2 className={styles.sectionHeading}>Your results</h2>
      </div>

      <div className={styles.grid}>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Accounts contacted</span>
          <span className={styles.statValue}>{stats.contacted}</span>
          <span className={styles.statSub}>of {stats.totalSaved} saved</span>
        </div>

        <div className={styles.stat}>
          <span className={styles.statLabel}>In conversation</span>
          <span className={styles.statValue}>{stats.inConversation}</span>
          <span className={styles.statSub}>currently nurturing</span>
        </div>

        <div className={styles.stat}>
          <span className={styles.statLabel}>Booked</span>
          <span className={styles.statValue}>{stats.booked}</span>
          <span className={styles.statSub}>
            {stats.contactedToBookedPct !== null
              ? `${stats.contactedToBookedPct}% of contacted`
              : "—"}
          </span>
        </div>

        <div className={`${styles.stat} ${styles.statHighlight}`}>
          <span className={styles.statLabel}>Est. bookings won</span>
          <span className={styles.statValue}>
            {formatUsd(stats.estValueBooked)}
          </span>
          {stats.roiMultiple !== null && (
            <span className={styles.statSub}>
              ≈ {stats.roiMultiple}× your {formatUsd(stats.monthlyCost)}/mo
            </span>
          )}
        </div>
      </div>

      {stats.booked === 0 && (
        <p className={styles.hint}>
          Mark a lead <strong>Won</strong> and add what it&apos;s worth to start
          tracking the revenue this tool brings in.
        </p>
      )}
    </section>
  );
}
