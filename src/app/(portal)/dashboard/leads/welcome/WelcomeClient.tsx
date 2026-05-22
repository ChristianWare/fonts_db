"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "./WelcomePage.module.css";

type Props = {
  jobId: string | null;
  initialStatus: string;
  initialStage: string;
  initialProgressPct: number;
  initialEventCount: number | null;
  marketCity: string;
  marketState: string;
};

const POLL_INTERVAL_MS = 3000;

const STAGES = [
  {
    key: "fetch",
    title: "Pulling events from Eventbrite",
    desc: "Scanning the public event calendar for high-value gatherings — galas, conferences, fundraisers, weddings, and trade shows.",
    estimate: "~2 minutes",
    minProgress: 0,
    maxProgress: 39,
  },
  {
    key: "categorize",
    title: "Categorizing with AI",
    desc: "Sorting events by type and value. Filtering out the noise — yoga classes, online webinars, and one-off meetups.",
    estimate: "~15 seconds",
    minProgress: 40,
    maxProgress: 59,
  },
  {
    key: "enrich",
    title: "Looking up venue & organizer contacts",
    desc: "Finding phone numbers, websites, and verified business details so you have somewhere to send your pitch.",
    estimate: "~30 seconds",
    minProgress: 60,
    maxProgress: 99,
  },
];

type StepStatus = "done" | "active" | "pending";

function getStageStatus(
  progressPct: number,
  isComplete: boolean,
  stage: (typeof STAGES)[number],
): StepStatus {
  if (isComplete) return "done";
  if (progressPct > stage.maxProgress) return "done";
  if (progressPct >= stage.minProgress) return "active";
  return "pending";
}

export default function WelcomeClient({
  jobId,
  initialStatus,
  initialStage,
  initialProgressPct,
  initialEventCount,
  marketCity,
  marketState,
}: Props) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [, setStage] = useState(initialStage);
  const [progressPct, setProgressPct] = useState(initialProgressPct);
  const [eventCount, setEventCount] = useState(initialEventCount);

  const isComplete = status === "COMPLETE";
  const isFailed = status === "FAILED";

  // Did this user arrive on a setup that's already done? True for re-enrollment
  // with cached events (no active scrape job). Stable across renders because
  // it's derived from initialStatus, not the live status state.
  const landedComplete = initialStatus === "COMPLETE";

  // Poll the job status until it completes or fails. Skip entirely when there's
  // no job to poll — this happens on re-enrollment with cached events, where
  // the server passed jobId=null and initialStatus=COMPLETE.
  useEffect(() => {
    if (!jobId) return;
    if (isComplete || isFailed) return;

    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const poll = async () => {
      if (cancelled) return;
      try {
        const res = await fetch(`/api/leads/search/status?jobId=${jobId}`);
        if (cancelled) return;
        if (!res.ok) throw new Error(`Status check failed (${res.status})`);
        const data = await res.json();

        if (data.status) setStatus(data.status);
        if (data.stage) setStage(data.stage);
        if (typeof data.progressPct === "number") {
          setProgressPct(data.progressPct);
        }
        if (typeof data.eventCount === "number") {
          setEventCount(data.eventCount);
        }

        if (data.status === "COMPLETE" || data.status === "FAILED") {
          return;
        }

        timeoutId = setTimeout(poll, POLL_INTERVAL_MS);
      } catch (err) {
        if (cancelled) return;
        console.error("Poll error", err);
        timeoutId = setTimeout(poll, POLL_INTERVAL_MS);
      }
    };

    timeoutId = setTimeout(poll, 1000);

    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [jobId, isComplete, isFailed]);

  function goNow() {
    router.push("/dashboard/leads/search");
  }

  return (
    <div className={styles.card}>
      <p className={styles.eyebrow}>Fonts &amp; Footers — Leads</p>
      <h1 className={styles.headline}>
        Welcome to your <span>lead engine</span>
      </h1>
      <p className={styles.subhead}>
        {landedComplete
          ? `Your market — ${marketCity}, ${marketState} — is set up and ready to go. Here's a quick refresher on how the three lead types work.`
          : `We're preparing your market — ${marketCity}, ${marketState}. This takes a few minutes the first time. While you wait, here's how the three lead types work.`}
      </p>

      {/* Progress stepper */}
      <div className={styles.progressSection}>
        <h2 className={styles.sectionLabel}>
          {landedComplete ? "Your market" : "Setting up your market"}
        </h2>

        <div className={styles.stepper}>
          {STAGES.map((s, i) => {
            const stageStatus = isFailed
              ? "pending"
              : getStageStatus(progressPct, isComplete, s);
            return (
              <div
                key={s.key}
                className={`${styles.step} ${styles[`step_${stageStatus}`]}`}
              >
                <div className={styles.stepIndicator}>
                  <span className={styles.stepNumber}>
                    {stageStatus === "done" ? "✓" : i + 1}
                  </span>
                </div>
                <div className={styles.stepContent}>
                  <p className={styles.stepTitle}>{s.title}</p>
                  {stageStatus === "active" && (
                    <>
                      <p className={styles.stepDesc}>{s.desc}</p>
                      <p className={styles.stepEstimate}>{s.estimate}</p>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {isFailed && (
          <p className={styles.errorBlock}>
            Something went wrong with the scrape. You can still browse the leads
            tool — try a search and we&apos;ll retry the scrape automatically.
          </p>
        )}
      </div>

      {/* Tutorial section */}
      <div className={styles.tutorial}>
        <h2 className={styles.sectionLabel}>How leads work</h2>
        <div className={styles.tutorialGrid}>
          <div className={styles.leadTypeCard}>
            <div className={styles.leadTypeHeader}>
              <span className={styles.leadTypeEmoji}>🔥</span>
              <h3 className={styles.leadTypeTitle}>Hot leads</h3>
            </div>
            <p className={styles.leadTypeDesc}>
              Events happening in the next 14 days. The organizer is finalizing
              every detail right now — including ground transportation. Speed
              wins; first responder usually gets the deal.
            </p>
            <p className={styles.leadTypeStrategy}>
              <strong>What to do:</strong> Send three sentences today. Be ready
              to quote within hours, not days.
            </p>
          </div>

          <div className={styles.leadTypeCard}>
            <div className={styles.leadTypeHeader}>
              <span className={styles.leadTypeEmoji}>🌡️</span>
              <h3 className={styles.leadTypeTitle}>Warm leads</h3>
            </div>
            <p className={styles.leadTypeDesc}>
              Events 15-90 days out. The organizer is actively coordinating
              logistics but hasn&apos;t booked transportation yet. Reference the
              specific event in your outreach to stand out.
            </p>
            <p className={styles.leadTypeStrategy}>
              <strong>What to do:</strong> Pitch as the missing piece of guest
              experience. Aim for a 24-48 hour response.
            </p>
          </div>

          <div className={styles.leadTypeCard}>
            <div className={styles.leadTypeHeader}>
              <span className={styles.leadTypeEmoji}>🧊</span>
              <h3 className={styles.leadTypeTitle}>Cold leads</h3>
            </div>
            <p className={styles.leadTypeDesc}>
              Businesses in your service area that match your ideal customer —
              wedding venues, hotels, corporate offices, country clubs. No
              specific event signal yet.
            </p>
            <p className={styles.leadTypeStrategy}>
              <strong>What to do:</strong> Long-term pipeline. Introduce
              yourself, drop a useful resource, follow up quarterly.
            </p>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className={styles.ctaRow}>
        {isComplete ? (
          <>
            <button type='button' onClick={goNow} className={styles.cta}>
              Take me to my leads →
            </button>
            <p className={styles.completeHint}>
              {eventCount != null && eventCount > 0
                ? `${eventCount} events ready in ${marketCity}, ${marketState}`
                : `Your market is ready — start exploring`}
            </p>
          </>
        ) : isFailed ? (
          <button type='button' onClick={goNow} className={styles.cta}>
            Go to leads anyway →
          </button>
        ) : (
          <>
            <button type='button' disabled className={styles.cta}>
              Preparing your market...
            </button>
            <p className={styles.pendingHint}>
              You can leave this page — we&apos;ll keep working in the
              background.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
