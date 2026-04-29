/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState } from "react";
import styles from "./audit.module.css";
import LayoutWrapper from "@/components/shared/LayoutWrapper";
import SectionIntro from "@/components/shared/SectionIntro/SectionIntro";
import Link from "next/link";
import AuditHero from "@/components/AuditPage/AuditHero/AuditHero";
import AuditHowItWorks from "@/components/AuditPage/AuditHowItWorks/AuditHowItWorks";
import AuditParallaxResults from "@/components/AuditPage/AuditParallaxResults/AuditParallaxResults";
import AuditExpectations from "@/components/AuditPage/AuditExpectations/AuditExpectations";
import Faq from "@/components/HomePage/Faq/Faq";

// ── Types ─────────────────────────────────────────────────────────────────────
interface TechStack {
  platform: string | null;
  bookingPlatform: string | null;
  analytics: string[];
  hasFavicon: boolean;
  hasSchemaMarkup: boolean;
  hasSocialLinks: boolean;
  copyrightYearCurrent: boolean;
}

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
  techStack?: TechStack;
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

// ── Tech stack pills ──────────────────────────────────────────────────────────
function TechStackDisplay({ techStack }: { techStack: TechStack }) {
  const pills: { label: string; value: string; warn?: boolean }[] = [];

  if (techStack.platform) {
    const warnPlatforms = ["Wix", "Squarespace", "Weebly"];
    pills.push({
      label: "Built on",
      value: techStack.platform,
      warn: warnPlatforms.includes(techStack.platform),
    });
  } else {
    pills.push({ label: "Built on", value: "Unknown", warn: false });
  }

  if (techStack.bookingPlatform) {
    pills.push({
      label: "Booking",
      value: techStack.bookingPlatform,
      warn: true,
    });
  }

  if (techStack.analytics.length > 0) {
    techStack.analytics.forEach((a) => {
      pills.push({ label: "Analytics", value: a });
    });
  } else {
    pills.push({ label: "Analytics", value: "None detected", warn: true });
  }

  if (techStack.hasSchemaMarkup) {
    pills.push({ label: "Schema", value: "Present" });
  }

  return (
    <div className={styles.techStackBlock}>
      <p className={styles.techStackLabel}>DETECTED TECHNOLOGIES</p>
      <div className={styles.techPills}>
        {pills.map((pill, i) => (
          <div
            key={i}
            className={`${styles.techPill} ${pill.warn ? styles.techPillWarn : styles.techPillOk}`}
          >
            <span className={styles.techPillKey}>{pill.label}</span>
            <span className={styles.techPillVal}>{pill.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ENTRY FORM
// ═══════════════════════════════════════════════════════════════════════════════
function EntryView({
  onSubmit,
  error,
}: {
  onSubmit: (url: string, email: string, firstName: string) => void;
  error?: string;
}) {
  const [url, setUrl] = useState("");
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [localError, setLocalError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const honeypot = (e.currentTarget as HTMLFormElement).elements.namedItem(
      "website_url_confirm",
    ) as HTMLInputElement;
    if (honeypot?.value) return; // bot filled it — silently do nothing
    if (!url || !email || !firstName) {
      setLocalError("All fields are required.");
      return;
    }
    setLocalError("");
    onSubmit(url, email, firstName);
  }

  return (
    <main className={styles.container}>
      <AuditHero />
      <AuditHowItWorks />
      <AuditParallaxResults />
      <AuditExpectations />
        <Faq />
      <LayoutWrapper borderDark>
        <section className={styles.content}>
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
                  "Tech stack & platform detection",
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
              {(localError || error) && (
                <p className={styles.errorMsg}>{localError || error}</p>
              )}

              {/* Honeypot — hidden from real users, bots fill it out */}
              <input
                type='text'
                name='website_url_confirm'
                value=''
                onChange={() => {}}
                style={{ display: "none" }}
                tabIndex={-1}
                autoComplete='off'
                aria-hidden='true'
              />

              <button type='submit' className={styles.submitBtn}>
                Run Free Audit &nbsp;→
              </button>
              <p className={styles.disclaimer}>
                No spam. We&apos;ll email your full report and occasionally
                share tips for black car operators.
              </p>
            </form>
          </div>
        </section>
      </LayoutWrapper>
    </main>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SCANNING STATE
// ═══════════════════════════════════════════════════════════════════════════════
function ScanningView({
  step,
  complete,
}: {
  step: number;
  complete?: boolean;
}) {
  const pct = complete
    ? 100
    : Math.min(99, Math.round(((step + 1) / SCAN_STEPS.length) * 100));

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
// RESULTS VIEW
// ═══════════════════════════════════════════════════════════════════════════════
function ResultsView({
  result,
  onReset,
}: {
  result: AuditResult;
  onReset: () => void;
}) {
  async function handleDownload() {
    try {
      const res = await fetch("/api/audit/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: result.url,
          score: result.score,
          grade: result.grade,
          summary: result.summary,
          monthlyVisitors: result.monthlyVisitors,
          keywordsRanking: result.keywordsRanking,
          estimatedLostBookings: result.estimatedLostBookings,
          categories: result.categories,
          firstName: result.firstName,
        }),
      });
      if (!res.ok) throw new Error("Failed to generate PDF");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `audit-${new URL(result.url).hostname}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("[download error]", err);
    }
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
                    ~ {result.monthlyVisitors}
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
                    ~ {result.estimatedLostBookings}
                  </span>
                  <span className={styles.statLabel}>
                    est. bookings lost/month
                  </span>
                </div>
              </div>

              <p className={styles.resultSummary}>
                *** Estimated bookings lost per month is calculated using your
                monthly organic visitor count, a 2% industry-average booking
                conversion rate, and the number of high-impact issues found.
                Each unresolved high-impact issue is estimated to reduce
                conversions by 15%.
              </p>

              {/* ── Tech stack pills ── */}
              {result.techStack && (
                <TechStackDisplay techStack={result.techStack} />
              )}

              <p className={styles.resultUrl}>{result.url}</p>
              <button onClick={onReset} className={styles.resetBtn}>
                ← Run another audit
              </button>
              {/* <button onClick={handleDownload} className={styles.resetBtn}>
                ↓ Download PDF report
              </button> */}
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
// ROOT PAGE — all state lives here
// ═══════════════════════════════════════════════════════════════════════════════
export default function AuditPage() {
  const [state, setState] = useState<"entry" | "scanning" | "results">("entry");
  const [scanStep, setScanStep] = useState(0);
  const [scanComplete, setScanComplete] = useState(false);
  const [result, setResult] = useState<AuditResult | null>(null);
  const [error, setError] = useState("");

  async function handleSubmit(url: string, email: string, firstName: string) {
    setError("");
    setScanComplete(false);
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

      // Flash 100% for 600ms before showing results
      setScanComplete(true);
      await new Promise((r) => setTimeout(r, 600));

      setResult({ ...data, email, firstName });
      setState("results");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setState("entry");
      setScanComplete(false);
    }
  }

  function handleReset() {
    setResult(null);
    setState("entry");
    setError("");
    setScanComplete(false);
  }

  if (state === "scanning")
    return <ScanningView step={scanStep} complete={scanComplete} />;
  if (state === "results" && result)
    return <ResultsView result={result} onReset={handleReset} />;
  return <EntryView onSubmit={handleSubmit} error={error} />;
}
