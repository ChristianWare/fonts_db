/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import styles from "./AuditModalContent.module.css";
import { AuditResult, ModalState, SCAN_STEPS } from "@/app/audit/page";
import AuditFormModal from "../AuditFormModal/AuditFormModal";
import Link from "next/link";

interface Props {
  state: ModalState;
  scanStep: number;
  scanComplete: boolean;
  result: AuditResult | null;
  error: string;
  onSubmit: (url: string, email: string, firstName: string) => void;
  onReset: () => void;
  onClose: () => void;
}

// ── Grade badge ───────────────────────────────────────────────────────────────
function GradeBadge({ grade, large }: { grade: string; large?: boolean }) {
  const map: Record<string, string> = {
    A: styles.gradeA,
    B: styles.gradeB,
    C: styles.gradeC,
    D: styles.gradeD,
    F: styles.gradeF,
  };
  return (
    <span
      className={`${styles.grade} ${map[grade] ?? styles.gradeF} ${large ? styles.gradeLarge : ""}`}
    >
      {grade}
    </span>
  );
}

export default function AuditModalContent({
  state,
  scanStep,
  scanComplete,
  result,
  error,
  onSubmit,
  onReset,
  onClose,
}: Props) {
  // ── FORM STATE ─────────────────────────────────────────────────────────────
  if (state === "form") {
    return <AuditFormModal onSubmit={onSubmit} error={error} />;
  }

  // ── SCANNING STATE ─────────────────────────────────────────────────────────
  if (state === "scanning") {
    const pct = scanComplete
      ? 100
      : Math.min(99, Math.round(((scanStep + 1) / SCAN_STEPS.length) * 100));

    return (
      <div className={styles.scanContainer}>
        <div className={styles.scanHeading}>
          <h2 className={styles.heading}>Analysing your website now...</h2>
          <p className={styles.subheading}>
            We&apos;re running {SCAN_STEPS.length} checks across performance,
            booking capability, SEO, and trust signals. This takes about 60
            seconds.
          </p>
        </div>

        <div className={styles.scanPanel}>
          <div className={styles.scanPctWrap}>
            <span className={styles.scanPct}>{pct}</span>
            <span className={styles.scanPctSymbol}>%</span>
          </div>
          <div className={styles.scanBarOuter}>
            <div className={styles.scanBarInner} style={{ width: `${pct}%` }} />
          </div>
          <div className={styles.scanSteps}>
            {SCAN_STEPS.map((s, i) => (
              <div
                key={s}
                className={`${styles.scanStepRow} ${
                  i < scanStep
                    ? styles.scanStepDone
                    : i === scanStep
                      ? styles.scanStepActive
                      : styles.scanStepPending
                }`}
              >
                <span className={styles.scanStepDot} />
                <span className={styles.scanStepText}>{s}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── RESULTS STATE ──────────────────────────────────────────────────────────
  if (state === "results" && result) {
    return (
      <div className={styles.resultsContainer}>
        <div className={styles.resultsHeading}>
          <h2 className={styles.heading}>Your audit results</h2>
          <div className={styles.scoreBlock}>
            <GradeBadge grade={result.grade} large />
            <div className={styles.scoreNums}>
              <span className={styles.scoreNum}>{result.score}</span>
              <span className={styles.scoreMax}>/100</span>
            </div>
          </div>
          <p className={styles.resultSummary}>{result.summary}</p>
        </div>

        {/* ── Email banner ── */}
        <div className={styles.emailBanner}>
          <span className={styles.emailBannerIcon}>✉</span>
          <div className={styles.emailBannerText}>
            <p className={styles.emailBannerTitle}>
              Your full report is on its way
            </p>
            <p className={styles.emailBannerSub}>
              {result.email
                ? `Check ${result.email} — your complete report with personalized fixes and a PDF is on its way.`
                : "Check your inbox — your complete report is on its way."}
            </p>
          </div>
        </div>

        {/* ── Stats grid ── */}
        <div className={styles.statsGrid}>
          <div className={styles.statItem}>
            <span className={styles.statVal}>~ {result.monthlyVisitors}</span>
            <span className={styles.statLabel}>monthly organic visitors</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statVal}>{result.keywordsRanking}</span>
            <span className={styles.statLabel}>keywords ranking</span>
          </div>
          <div className={styles.statItem}>
            <span className={`${styles.statVal} ${styles.statRed}`}>
              ~ {result.estimatedLostBookings}
            </span>
            <span className={styles.statLabel}>est. bookings lost/month</span>
          </div>
        </div>

        {/* ── Category preview ── */}
        <div className={styles.categories}>
          {result.categories.map((cat) => (
            <div className={styles.catBlock} key={cat.id}>
              <div className={styles.catRow}>
                <div className={styles.catHeaderLeft}>
                  <GradeBadge grade={cat.grade} />
                  <span className={styles.catLabel}>{cat.label}</span>
                </div>
                <div className={styles.catHeaderRight}>
                  <div className={styles.catBar}>
                    <div
                      className={styles.catBarFill}
                      style={{ width: `${cat.score}%` }}
                    />
                  </div>
                  <span className={styles.catScore}>{cat.score}/100</span>
                </div>
              </div>
              <div className={styles.catTeaser}>
                <span className={styles.catTeaserText}>
                  {(() => {
                    const failCount = cat.checks.filter(
                      (c) => !c.passed,
                    ).length;
                    const highCount = cat.checks.filter(
                      (c) => !c.passed && c.impact === "high",
                    ).length;
                    if (failCount === 0) return "0 issues found.";
                    return `${failCount} issue${failCount !== 1 ? "s" : ""} found${highCount > 0 ? ` — ${highCount} high impact` : ""}. Full fixes in your email.`;
                  })()}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* ── CTA ── */}
        <div className={styles.resultCta}>
          <p className={styles.ctaCopy}>
            Want us to walk you through your results? Book a free 15-minute call
            — we&apos;ll show you the 2–3 things costing you the most rides
            right now.
          </p>
          <Link href='/contact' className={styles.submitBtn}>
            Book Free 15-Min Call &nbsp;→
          </Link>
          <button onClick={onReset} className={styles.resetBtn}>
            ← Run another audit
          </button>
        </div>
      </div>
    );
  }

  return null;
}
