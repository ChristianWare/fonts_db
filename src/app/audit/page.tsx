/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState } from "react";
import styles from "./audit.module.css";
import LayoutWrapper from "@/components/shared/LayoutWrapper";
import SectionIntro from "@/components/shared/SectionIntro/SectionIntro";
import Link from "next/link";

// ── Types ─────────────────────────────────────────────────────────────────────
interface AuditResult {
  url: string;
  score: number;
  grade: string;
  categories: Category[];
  summary: string;
  monthlyVisitors: number;
  keywordsRanking: number;
  topKeywords: string[];
  estimatedLostBookings: number;
  email?: string;
  firstName?: string;
}

interface Category {
  id: string;
  label: string;
  grade: string;
  score: number;
  checks: Check[];
}

interface Check {
  id: string;
  label: string;
  passed: boolean;
  message: string;
  fix?: string;
  impact: "high" | "medium" | "low";
}

// ── Scanning steps ────────────────────────────────────────────────────────────
const SCAN_STEPS = [
  "Resolving domain...",
  "Checking SSL certificate...",
  "Testing page speed...",
  "Scanning mobile responsiveness...",
  "Analysing booking capability...",
  "Reading SEO signals...",
  "Fetching keyword traffic data...",
  "Checking trust indicators...",
  "Calculating lost bookings...",
  "Compiling your report...",
];

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

// ═══════════════════════════════════════════════════════════════════════════════
// ENTRY FORM
// ═══════════════════════════════════════════════════════════════════════════════
function EntryView({
  onSubmit,
}: {
  onSubmit: (url: string, email: string, firstName: string) => void;
}) {
  const [url, setUrl] = useState("");
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!url || !email || !firstName) {
      setError("All fields are required.");
      return;
    }
    setError("");
    onSubmit(url, email, firstName);
  }

  return (
    <section className={styles.container}>
      <LayoutWrapper borderDark>
        <div className={styles.content}>
          <div className={styles.dot1} />
          <div className={styles.dot2} />
          <div className={styles.dot3} />
          <div className={styles.dot4} />

          {/* ── LEFT ── */}
          <div className={styles.left}>
            <div className={styles.leftTop}>
              <SectionIntro
                text='Free website audit'
                color='colorWhite'
                background='bgBlack'
              />
              <h2 className={styles.heading}>
                Is your website
                <br />
                costing you
                <br />
                rides?
              </h2>
            </div>
            <div className={styles.leftBottom}>
              <h6 className={styles.pullQuote}>
                &ldquo;We had no idea how many bookings our old site was losing
                until we saw the audit. The instant quote tool alone changed
                everything.&rdquo;
              </h6>
              <div className={styles.quoteAttrib}>
                <div className={styles.quoteAvatar}>BL</div>
                <div className={styles.captionContainer}>
                  <p className={styles.captionName}>Barry La Nier</p>
                  <p className={styles.captionTitle}>
                    Owner, Nier Transportation
                  </p>
                </div>
              </div>
              <div className={styles.whatWeCheck}>
                <SectionIntro
                  text='What we check'
                  color='colorWhite'
                  background='bgBlack'
                />
                {[
                  "Page speed & Core Web Vitals",
                  "Booking capability & direct reservations",
                  "Organic keyword traffic estimate",
                  "Mobile experience on phones",
                  "Trust signals & social proof",
                  "Brand impression vs competitors",
                ].map((item) => (
                  <div key={item} className={styles.checkItem}>
                    <span className={styles.checkDash}>—</span>
                    <span className={styles.checkText}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── RIGHT ── */}
          <div className={styles.right}>
            <div className={styles.rightTop}>
              <p className={styles.copy}>
                Most black car operators are running premium services on
                websites that can&apos;t take a direct booking, rank for zero
                keywords, and don&apos;t match the level of service they
                deliver.
                <br />
                <br />
                Enter your details below. We&apos;ll scan your site in 60
                seconds and email you the full report with personalized fixes.
              </p>
            </div>
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>YOUR FIRST NAME</label>
                <input
                  type='text'
                  placeholder='Mike'
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className={styles.input}
                  required
                />
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>YOUR WEBSITE URL</label>
                <input
                  type='url'
                  placeholder='https://yourlimo.com'
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className={styles.input}
                  required
                />
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>YOUR EMAIL ADDRESS</label>
                <input
                  type='email'
                  placeholder='you@yourlimo.com'
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={styles.input}
                  required
                />
              </div>
              {error && <p className={styles.errorMsg}>{error}</p>}
              <button type='submit' className={styles.submitBtn}>
                Run Free Audit &nbsp;→
              </button>
              <p className={styles.disclaimer}>
                No spam. We&apos;ll email your full report and occasionally
                share tips for black car operators.
              </p>
            </form>
          </div>
        </div>
      </LayoutWrapper>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SCANNING STATE
// ═══════════════════════════════════════════════════════════════════════════════
function ScanningView({ step }: { step: number }) {
  const pct = Math.round(((step + 1) / SCAN_STEPS.length) * 100);

  return (
    <section className={styles.container}>
      <LayoutWrapper borderDark>
        <div className={styles.content}>
          <div className={styles.dot1} />
          <div className={styles.dot2} />
          <div className={styles.dot3} />
          <div className={styles.dot4} />

          <div className={styles.left}>
            <div className={styles.leftTop}>
              <SectionIntro
                text='Scanning your site'
                color='colorWhite'
                background='bgBlack'
              />
              <h2 className={styles.heading}>
                Analysing
                <br />
                your website
                <br />
                now...
              </h2>
            </div>
            <div className={styles.leftBottom}>
              <p className={styles.scanNote}>
                We&apos;re running {SCAN_STEPS.length} checks across
                performance, booking capability, SEO, and trust signals. This
                takes about 60 seconds.
              </p>
            </div>
          </div>

          <div className={styles.right}>
            <div className={styles.scanPanel}>
              <div className={styles.scanPctWrap}>
                <span className={styles.scanPct}>{pct}</span>
                <span className={styles.scanPctSymbol}>%</span>
              </div>
              <div className={styles.scanBarOuter}>
                <div
                  className={styles.scanBarInner}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className={styles.scanSteps}>
                {SCAN_STEPS.map((s, i) => (
                  <div
                    key={s}
                    className={`${styles.scanStepRow} ${
                      i < step
                        ? styles.scanStepDone
                        : i === step
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
        </div>
      </LayoutWrapper>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// RESULTS VIEW — preview only, full report sent to email
// ═══════════════════════════════════════════════════════════════════════════════
function ResultsView({
  result,
  onReset,
}: {
  result: AuditResult;
  onReset: () => void;
}) {
  return (
    <section className={styles.container}>
      <LayoutWrapper borderDark>
        <div className={styles.content}>
          <div className={styles.dot1} />
          <div className={styles.dot2} />
          <div className={styles.dot3} />
          <div className={styles.dot4} />

          {/* ── LEFT ── */}
          <div className={styles.left}>
            <div className={styles.leftTop}>
              <SectionIntro
                text='Your audit results'
                color='colorWhite'
                background='bgBlack'
              />
              <div className={styles.scoreBlock}>
                <GradeBadge grade={result.grade} large />
                <div className={styles.scoreNums}>
                  <span className={styles.scoreNum}>{result.score}</span>
                  <span className={styles.scoreMax}>/100</span>
                </div>
              </div>
              <p className={styles.resultSummary}>{result.summary}</p>
            </div>

            <div className={styles.leftBottom}>
              <div className={styles.statsGrid}>
                <div className={styles.statItem}>
                  <span className={styles.statVal}>
                    ~{result.monthlyVisitors}
                  </span>
                  <span className={styles.statLabel}>
                    monthly organic visitors
                  </span>
                </div>
                <div className={styles.statItem}>
                  <span className={styles.statVal}>
                    {result.keywordsRanking}
                  </span>
                  <span className={styles.statLabel}>keywords ranking</span>
                </div>
                <div className={styles.statItem}>
                  <span className={`${styles.statVal} ${styles.statRed}`}>
                    ~{result.estimatedLostBookings}
                  </span>
                  <span className={styles.statLabel}>
                    est. bookings lost/month
                  </span>
                </div>
              </div>
              <p className={styles.resultUrl}>{result.url}</p>
              <button onClick={onReset} className={styles.resetBtn}>
                ← Run another audit
              </button>
            </div>
          </div>

          {/* ── RIGHT ── */}
          <div className={styles.right}>
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
                    : "Check your inbox — your complete report with personalized fixes and a PDF is on its way."}
                </p>
              </div>
            </div>

            {/* ── Preview label ── */}
            <div className={styles.rightTop}>
              <p className={styles.copy}>
                This is a preview of your audit. The full breakdown with
                specific fixes for every failing item — plus a downloadable PDF
                report — is waiting in your inbox.
              </p>
            </div>

            {/* ── Category preview — grades + scores only ── */}
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
                      {cat.checks.filter((c) => !c.passed).length} issue
                      {cat.checks.filter((c) => !c.passed).length !== 1
                        ? "s"
                        : ""}{" "}
                      found
                      {cat.checks.filter(
                        (c) => !c.passed && c.impact === "high",
                      ).length > 0
                        ? ` — ${cat.checks.filter((c) => !c.passed && c.impact === "high").length} high impact`
                        : ""}
                      . Full fixes in your email.
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* ── CTA ── */}
            <div className={styles.resultCta}>
              <p className={styles.ctaCopy}>
                Want us to walk you through your results? Book a free 15-minute
                call — we&apos;ll show you the 2–3 things costing you the most
                rides right now.
              </p>
              <Link href='/#contact' className={styles.submitBtn}>
                Book Free 15-Min Call &nbsp;→
              </Link>
            </div>
          </div>
        </div>
      </LayoutWrapper>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ROOT PAGE
// ═══════════════════════════════════════════════════════════════════════════════
export default function AuditPage() {
  const [state, setState] = useState<"entry" | "scanning" | "results">("entry");
  const [scanStep, setScanStep] = useState(0);
  const [result, setResult] = useState<AuditResult | null>(null);
  const [error, setError] = useState("");

  async function handleSubmit(url: string, email: string, firstName: string) {
    setError("");
    setState("scanning");
    setScanStep(0);

    for (let i = 0; i < SCAN_STEPS.length; i++) {
      await new Promise((r) => setTimeout(r, 700));
      setScanStep(i);
    }

    try {
      const res = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, email, firstName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Audit failed");
      setResult({ ...data, email, firstName });
      setState("results");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setState("entry");
    }
  }

  function handleReset() {
    setResult(null);
    setState("entry");
    setError("");
  }

  if (state === "scanning") return <ScanningView step={scanStep} />;
  if (state === "results" && result)
    return <ResultsView result={result} onReset={handleReset} />;
  return <EntryView onSubmit={handleSubmit} />;
}
