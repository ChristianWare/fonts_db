"use client";

import { useState } from "react";
import styles from "./ROICalculator.module.css";
import LayoutWrapper from "../../shared/LayoutWrapper";
import SectionIntro from "../../shared/SectionIntro/SectionIntro";

const FF_MONTHLY = 499;

function fmt(n: number) {
  return Math.abs(n).toLocaleString("en-US", { maximumFractionDigits: 0 });
}

function clamp(n: number, min: number, max: number) {
  if (Number.isNaN(n)) return min;
  return Math.min(max, Math.max(min, n));
}

type Mode = "marketplace" | "dispatch" | "template";

const MODES: { key: Mode; label: string }[] = [
  { key: "marketplace", label: "Booking marketplace" },
  { key: "dispatch", label: "Dispatch software" },
  { key: "template", label: "Template agency" },
];

const INCLUDED_FEATURES = [
  "Custom branded website",
  "Full booking engine",
  "Admin dashboard",
  "Driver portal",
  "Customer portal",
  "Corporate accounts",
  "Flight tracking",
  "Unlimited bookings",
];

type Line = { label: string; sub?: string; amount: number };

// Reusable input: number field + matching slider (shared min/max fixes the
// old bug where the slider maxed lower than the number input).
function Field({
  id,
  label,
  value,
  setValue,
  min,
  max,
  step = 1,
  prefix,
  unit,
}: {
  id: string;
  label: string;
  value: number;
  setValue: (n: number) => void;
  min: number;
  max: number;
  step?: number;
  prefix?: string;
  unit?: string;
}) {
  return (
    <div className={styles.inputGroup}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      <div className={styles.inputRow}>
        {prefix && <span className={styles.prefix}>{prefix}</span>}
        <input
          id={id}
          type='number'
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => setValue(clamp(Number(e.target.value), min, max))}
          className={styles.input}
        />
        {unit && <span className={styles.unit}>{unit}</span>}
      </div>
      <input
        type='range'
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => setValue(Number(e.target.value))}
        className={styles.slider}
        aria-label={label}
      />
    </div>
  );
}

export default function ROICalculator() {
  const [mode, setMode] = useState<Mode>("marketplace");

  // ── Marketplace inputs (per-booking cut) ──
  const [bookings, setBookings] = useState(150);
  const [avgFare, setAvgFare] = useState(160);
  const [feePercent, setFeePercent] = useState(5);
  const [mktExtra, setMktExtra] = useState(150);

  // ── Dispatch software inputs (flat base + add-on modules + separate site) ──
  const [dispBase, setDispBase] = useState(199);
  const [dispAddons, setDispAddons] = useState(175);
  const [dispSite, setDispSite] = useState(150);

  // ── Template agency inputs (hosting + bolt-on booking + maintenance) ──
  const [tmplHosting, setTmplHosting] = useState(120);
  const [tmplBooking, setTmplBooking] = useState(150);
  const [tmplMaint, setTmplMaint] = useState(100);

  const marketplaceBookingFees = bookings * avgFare * (feePercent / 100);

  // True all-in monthly cost to match what Fonts & Footers includes.
  let trueCompetitorMonthly = 0;
  let breakdown: Line[] = [];

  if (mode === "marketplace") {
    trueCompetitorMonthly = marketplaceBookingFees + mktExtra;
    breakdown = [
      {
        label: "Booking fees",
        sub: `${bookings} rides × $${avgFare} × ${feePercent}%`,
        amount: marketplaceBookingFees,
      },
      ...(mktExtra > 0
        ? [
            {
              label: "Add-on fees",
              sub: "Website, apps, overages, etc.",
              amount: mktExtra,
            },
          ]
        : []),
    ];
  } else if (mode === "dispatch") {
    trueCompetitorMonthly = dispBase + dispAddons + dispSite;
    breakdown = [
      {
        label: "Software fee",
        sub: "Base monthly subscription",
        amount: dispBase,
      },
      ...(dispAddons > 0
        ? [
            {
              label: "Add-on modules",
              sub: "Apps, payments, SMS, etc.",
              amount: dispAddons,
            },
          ]
        : []),
      ...(dispSite > 0
        ? [
            {
              label: "Website + hosting",
              sub: "Paid to a separate agency",
              amount: dispSite,
            },
          ]
        : []),
    ];
  } else {
    trueCompetitorMonthly = tmplHosting + tmplBooking + tmplMaint;
    breakdown = [
      {
        label: "Hosting / retainer",
        sub: "Monthly site upkeep",
        amount: tmplHosting,
      },
      ...(tmplBooking > 0
        ? [
            {
              label: "Booking software",
              sub: "The engine the template lacks",
              amount: tmplBooking,
            },
          ]
        : []),
      ...(tmplMaint > 0
        ? [
            {
              label: "Maintenance & changes",
              sub: "Edits, fixes, updates",
              amount: tmplMaint,
            },
          ]
        : []),
    ];
  }

  const monthlySavings = trueCompetitorMonthly - FF_MONTHLY;
  const annualSavings = monthlySavings * 12;
  const breakEven =
    avgFare > 0 && feePercent > 0
      ? Math.ceil(FF_MONTHLY / (avgFare * (feePercent / 100)))
      : 0;

  const getMessage = () => {
    const saveMo = fmt(monthlySavings);
    const saveYr = fmt(annualSavings);

    if (mode === "marketplace") {
      if (monthlySavings <= 0)
        return `Reach ${breakEven} bookings/month and you break even. Every ride after that is money back in your pocket.`;
      if (monthlySavings < 200)
        return `You're saving $${saveMo}/month — and that includes a custom website, driver portal, and everything your platform charges extra for.`;
      if (monthlySavings < 500)
        return `You're overpaying by $${saveMo}/month — that's $${saveYr} a year. And you still don't own your site.`;
      return `You're leaving $${saveYr} on the table every year. At $499 flat, Fonts & Footers includes everything your platform charges per ride for.`;
    }

    if (mode === "dispatch") {
      if (monthlySavings <= 0)
        return `You're close on monthly price — but Fonts & Footers includes a custom-built website (a $3,000+ build elsewhere), every portal, and no à-la-carte modules to stack up.`;
      return `You're spending $${saveMo}/month more than you need to — $${saveYr} a year — once you add the base fee, the modules, and the website you pay for separately.`;
    }

    // template
    if (monthlySavings <= 0)
      return `A template is cheap because it's just a brochure — no booking engine, no portals, no corporate accounts. Fonts & Footers is the whole platform, built and hosted, at one flat rate.`;
    return `You're paying $${saveMo}/month over $499 — and still bolting a booking tool onto a site you don't fully own. Fonts & Footers is everything in one.`;
  };

  const getFootnote = () => {
    if (mode === "marketplace")
      return (
        <>
          At {feePercent}% per booking on a ${avgFare} average fare, you&apos;re
          paying ${(avgFare * (feePercent / 100)).toFixed(2)} per ride. You
          break even vs. Fonts &amp; Footers at just {breakEven} bookings/month.
          Add website, app, and overage fees under &ldquo;Other monthly
          fees&rdquo; — at Fonts &amp; Footers, those are all $0.
        </>
      );
    if (mode === "dispatch")
      return (
        <>
          Dispatch tools start cheap, then bill every module separately — apps,
          payments, SMS — and never include a real website. Add what you pay an
          agency to build and host yours; at Fonts &amp; Footers it&apos;s built
          in.
        </>
      );
    return (
      <>
        Template agencies hand you a site with no booking engine, so you bolt on
        separate software and pay for every change. Fonts &amp; Footers includes
        the site, the engine, and the changes — flat.
      </>
    );
  };

  return (
    <section className={styles.container}>
      <LayoutWrapper borderDark>
        <div className={styles.content}>
          <div className={styles.dot1} />
          <div className={styles.dot2} />
          <div className={styles.dot3} />
          <div className={styles.dot4} />

          {/* ── LEFT: inputs ── */}
          <div className={styles.left}>
            <SectionIntro
              text='ROI Calculator'
              color='colorWhite'
              background='bgBlack'
            />
            <h2 className={styles.heading}>
              what you&apos;re
              <br />
              actually paying
              <br />
              with the other guys.
            </h2>

            {/* Mode selector */}
            <p className={styles.modeQuestion}>What are you using now?</p>
            <div className={styles.modeSelector}>
              {MODES.map((m) => (
                <button
                  key={m.key}
                  type='button'
                  onClick={() => setMode(m.key)}
                  className={`${styles.modeTab} ${
                    mode === m.key ? styles.modeTabActive : ""
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            <div className={styles.inputs}>
              {mode === "marketplace" && (
                <>
                  <Field
                    id='bookings'
                    label='Bookings per month'
                    value={bookings}
                    setValue={setBookings}
                    min={1}
                    max={600}
                    unit='Rides'
                  />
                  <Field
                    id='avgFare'
                    label='Average fare per booking'
                    value={avgFare}
                    setValue={setAvgFare}
                    min={25}
                    max={600}
                    step={5}
                    prefix='$'
                    unit='/ ride'
                  />
                  <Field
                    id='feePercent'
                    label='Platform fee (%)'
                    value={feePercent}
                    setValue={setFeePercent}
                    min={0.5}
                    max={20}
                    step={0.5}
                    unit='% per booking'
                  />
                  <Field
                    id='mktExtra'
                    label='Other monthly fees'
                    value={mktExtra}
                    setValue={setMktExtra}
                    min={0}
                    max={600}
                    step={5}
                    prefix='$'
                    unit='/ month'
                  />
                </>
              )}

              {mode === "dispatch" && (
                <>
                  <Field
                    id='dispBase'
                    label='Monthly software fee'
                    value={dispBase}
                    setValue={setDispBase}
                    min={0}
                    max={800}
                    step={5}
                    prefix='$'
                    unit='/ month'
                  />
                  <Field
                    id='dispAddons'
                    label='Add-on modules'
                    value={dispAddons}
                    setValue={setDispAddons}
                    min={0}
                    max={600}
                    step={5}
                    prefix='$'
                    unit='/ month'
                  />
                  <Field
                    id='dispSite'
                    label='Website + hosting (separate)'
                    value={dispSite}
                    setValue={setDispSite}
                    min={0}
                    max={600}
                    step={5}
                    prefix='$'
                    unit='/ month'
                  />
                </>
              )}

              {mode === "template" && (
                <>
                  <Field
                    id='tmplHosting'
                    label='Hosting / retainer'
                    value={tmplHosting}
                    setValue={setTmplHosting}
                    min={0}
                    max={600}
                    step={5}
                    prefix='$'
                    unit='/ month'
                  />
                  <Field
                    id='tmplBooking'
                    label='Booking software you still need'
                    value={tmplBooking}
                    setValue={setTmplBooking}
                    min={0}
                    max={600}
                    step={5}
                    prefix='$'
                    unit='/ month'
                  />
                  <Field
                    id='tmplMaint'
                    label='Maintenance & change fees'
                    value={tmplMaint}
                    setValue={setTmplMaint}
                    min={0}
                    max={600}
                    step={5}
                    prefix='$'
                    unit='/ month'
                  />
                </>
              )}
            </div>

            <p className={styles.footnote}>{getFootnote()}</p>

            {/* What's included callout */}
            <div className={styles.includedBlock}>
              <p className={styles.includedTitle}>
                Everything below is included at $499/mo.
                <br />
                Most platforms charge extra for all of it.
              </p>
              <ul className={styles.includedList}>
                {INCLUDED_FEATURES.map((f) => (
                  <li key={f} className={styles.includedItem}>
                    <span className={styles.check}>✓</span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* ── RIGHT: output card ── */}
          <div className={styles.right}>
            <div className={styles.outputCard}>
              <div className={styles.dot5} />
              <div className={styles.dot6} />
              <div className={styles.dot7} />
              <div className={styles.dot8} />

              {/* Mode-specific breakdown */}
              {breakdown.map((line, i) => (
                <div key={line.label}>
                  <div className={styles.outputRow}>
                    <div className={styles.outputLabelStack}>
                      <span className={styles.outputLabel}>{line.label}</span>
                      {line.sub && (
                        <span className={styles.outputSub}>{line.sub}</span>
                      )}
                    </div>
                    <span
                      className={`${styles.outputValue} ${styles.outputRed}`}
                    >
                      {i === 0 ? "" : "+"}${fmt(line.amount)}
                      <span className={styles.outputPer}>/mo</span>
                    </span>
                  </div>
                  <div className={styles.divider} />
                </div>
              ))}

              {/* True total */}
              <div className={styles.outputRow}>
                <span className={styles.outputLabel}>True monthly cost</span>
                <span className={`${styles.outputValue} ${styles.outputRed}`}>
                  ${fmt(trueCompetitorMonthly)}
                  <span className={styles.outputPer}>/mo</span>
                </span>
              </div>

              <div className={styles.divider} />

              {/* F&F */}
              <div className={styles.outputRow}>
                <div className={styles.outputLabelStack}>
                  <span className={styles.outputLabel}>
                    Fonts &amp; Footers
                  </span>
                  <span className={styles.outputSub}>
                    Everything included. No add-ons.
                  </span>
                </div>
                <span className={`${styles.outputValue} ${styles.outputGreen}`}>
                  $499
                  <span className={styles.outputPer}>/mo</span>
                </span>
              </div>

              <div className={styles.divider} />

              {/* Savings hero */}
              <div className={styles.savingsBlock}>
                <span className={styles.savingsLabel}>
                  {monthlySavings <= 0 ? "Also Included" : "Annual Savings"}
                </span>
                <span
                  className={`${styles.savingsNumber} ${
                    monthlySavings <= 0 ? styles.savingsNegative : ""
                  }`}
                >
                  {monthlySavings <= 0 ? "—" : `$${fmt(annualSavings)}`}
                </span>
                <p className={styles.savingsNote}>{getMessage()}</p>
              </div>

              <a href='#contact' className={styles.cta}>
                Book a discovery call →
              </a>
            </div>
          </div>
        </div>
      </LayoutWrapper>
    </section>
  );
}
