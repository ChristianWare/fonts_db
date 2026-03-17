"use client";

import { useState } from "react";
import styles from "./ROICalculator.module.css";
import LayoutWrapper from "../../shared/LayoutWrapper";
import SectionIntro from "../../shared/SectionIntro/SectionIntro";

const FF_MONTHLY = 499;

function fmt(n: number) {
  return Math.abs(n).toLocaleString("en-US", { maximumFractionDigits: 0 });
}

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

export default function ROICalculator() {
  const [bookings, setBookings] = useState(150);
  const [avgFare, setAvgFare] = useState(160);
  const [feePercent, setFeePercent] = useState(5);
  const [extraFees, setExtraFees] = useState(150);

  const competitorBookingFees = bookings * avgFare * (feePercent / 100);
  const trueCompetitorMonthly = competitorBookingFees + extraFees;
  const monthlySavings = trueCompetitorMonthly - FF_MONTHLY;
  const annualSavings = monthlySavings * 12;
  const breakEven =
    avgFare > 0 && feePercent > 0
      ? Math.ceil(FF_MONTHLY / (avgFare * (feePercent / 100)))
      : 0;

  const getMessage = () => {
    if (monthlySavings <= 0)
      return `Reach ${breakEven} bookings/month and you break even. Every ride after that is money back in your pocket.`;
    if (monthlySavings < 200)
      return `You're saving $${fmt(monthlySavings)}/month — and that includes a custom website, driver portal, and everything else your current platform charges extra for.`;
    if (monthlySavings < 500)
      return `You're overpaying by $${fmt(monthlySavings)}/month — that's $${fmt(annualSavings)} a year. And you still don't own your site.`;
    return `You're leaving $${fmt(annualSavings)} on the table every year. At $499 flat, Fonts & Footers includes everything your platform charges extra for.`;
  };

  return (
    <section className={styles.container}>
      <LayoutWrapper>
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

            <div className={styles.inputs}>
              {/* Bookings per month */}
              <div className={styles.inputGroup}>
                <label htmlFor='bookings' className={styles.label}>
                  Bookings per month
                </label>
                <div className={styles.inputRow}>
                  <input
                    id='bookings'
                    type='number'
                    min={1}
                    max={2000}
                    value={bookings}
                    onChange={(e) =>
                      setBookings(Math.max(1, Number(e.target.value)))
                    }
                    className={styles.input}
                  />
                  <span className={styles.unit}>Rides</span>
                </div>
                <input
                  type='range'
                  min={1}
                  max={500}
                  value={bookings}
                  onChange={(e) => setBookings(Number(e.target.value))}
                  className={styles.slider}
                  aria-label='Bookings per month slider'
                />
              </div>

              {/* Average fare */}
              <div className={styles.inputGroup}>
                <label htmlFor='avgFare' className={styles.label}>
                  Average fare per booking
                </label>
                <div className={styles.inputRow}>
                  <span className={styles.prefix}>$</span>
                  <input
                    id='avgFare'
                    type='number'
                    min={1}
                    max={2000}
                    step={5}
                    value={avgFare}
                    onChange={(e) =>
                      setAvgFare(Math.max(1, Number(e.target.value)))
                    }
                    className={styles.input}
                  />
                  <span className={styles.unit}>/ ride</span>
                </div>
                <input
                  type='range'
                  min={25}
                  max={500}
                  step={5}
                  value={avgFare}
                  onChange={(e) => setAvgFare(Number(e.target.value))}
                  className={styles.slider}
                  aria-label='Average fare slider'
                />
              </div>

              {/* Platform fee percentage */}
              <div className={styles.inputGroup}>
                <label htmlFor='feePercent' className={styles.label}>
                  Platform fee (%)
                </label>
                <div className={styles.inputRow}>
                  <input
                    id='feePercent'
                    type='number'
                    min={0.1}
                    max={25}
                    step={0.5}
                    value={feePercent}
                    onChange={(e) =>
                      setFeePercent(Math.max(0.1, Number(e.target.value)))
                    }
                    className={styles.input}
                  />
                  <span className={styles.unit}>% per booking</span>
                </div>
                <input
                  type='range'
                  min={0.5}
                  max={20}
                  step={0.5}
                  value={feePercent}
                  onChange={(e) => setFeePercent(Number(e.target.value))}
                  className={styles.slider}
                  aria-label='Platform fee percentage slider'
                />
              </div>

              {/* Additional monthly fees */}
              <div className={styles.inputGroup}>
                <label htmlFor='extra' className={styles.label}>
                  Other monthly fees
                </label>
                <div className={styles.inputRow}>
                  <span className={styles.prefix}>$</span>
                  <input
                    id='extra'
                    type='number'
                    min={0}
                    max={2000}
                    step={5}
                    value={extraFees}
                    onChange={(e) =>
                      setExtraFees(Math.max(0, Number(e.target.value)))
                    }
                    className={styles.input}
                  />
                  <span className={styles.unit}>/ month</span>
                </div>
                <input
                  type='range'
                  min={0}
                  max={500}
                  step={5}
                  value={extraFees}
                  onChange={(e) => setExtraFees(Number(e.target.value))}
                  className={styles.slider}
                  aria-label='Additional monthly fees slider'
                />
              </div>
            </div>

            <p className={styles.footnote}>
              At {feePercent}% per booking on a ${avgFare} average fare,
              you&apos;re paying ${(avgFare * (feePercent / 100)).toFixed(2)}{" "}
              per ride. You break even vs. Fonts &amp; Footers at just{" "}
              {breakEven} bookings/month. Include website fees, app fees, and
              overages in &ldquo;Other monthly fees&rdquo; — at Fonts &amp;
              Footers, those are all $0.
            </p>

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

              {/* Booking fees */}
              <div className={styles.outputRow}>
                <div className={styles.outputLabelStack}>
                  <span className={styles.outputLabel}>Booking fees</span>
                  <span className={styles.outputSub}>
                    {bookings} rides × ${avgFare} × {feePercent}%
                  </span>
                </div>
                <span className={`${styles.outputValue} ${styles.outputRed}`}>
                  ${fmt(competitorBookingFees)}
                  <span className={styles.outputPer}>/mo</span>
                </span>
              </div>

              <div className={styles.divider} />

              {/* Extra fees — only show if > 0 */}
              {extraFees > 0 && (
                <>
                  <div className={styles.outputRow}>
                    <div className={styles.outputLabelStack}>
                      <span className={styles.outputLabel}>Add-on fees</span>
                      <span className={styles.outputSub}>
                        Website, apps, overages, etc.
                      </span>
                    </div>
                    <span
                      className={`${styles.outputValue} ${styles.outputRed}`}
                    >
                      +${fmt(extraFees)}
                      <span className={styles.outputPer}>/mo</span>
                    </span>
                  </div>
                  <div className={styles.divider} />
                </>
              )}

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
                <span className={styles.savingsLabel}>Annual Savings</span>
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
