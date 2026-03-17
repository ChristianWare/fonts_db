"use client";

import { useState } from "react";
import styles from "./ROICalculator.module.css";
import LayoutWrapper from "../../shared/LayoutWrapper";
import SectionIntro from "../../shared/SectionIntro/SectionIntro";

const FF_MONTHLY = 499;

function fmt(n: number) {
  return Math.abs(n).toLocaleString("en-US", { maximumFractionDigits: 0 });
}

export default function ROICalculator() {
  const [bookings, setBookings] = useState(80);
  const [feePerBooking, setFeePerBooking] = useState(3.5);

  const competitorMonthly = bookings * feePerBooking;
  const monthlySavings = competitorMonthly - FF_MONTHLY;
  const annualSavings = monthlySavings * 12;
  const breakEven =
    feePerBooking > 0 ? Math.ceil(FF_MONTHLY / feePerBooking) : 0;

  const getMessage = () => {
    if (monthlySavings <= 0)
      return `Reach ${breakEven} bookings/month and you break even. Every ride after that is money back in your pocket.`;
    if (monthlySavings < 200)
      return `You're saving $${fmt(monthlySavings)}/month. Every new booking adds to the gap.`;
    if (monthlySavings < 500)
      return `You're overpaying by $${fmt(monthlySavings)}/month — that's $${fmt(annualSavings)} walking out the door every year.`;
    return `You're leaving $${fmt(annualSavings)} on the table every year. That's a serious number.`;
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
              See what you&apos;re
              <br />
              actually paying.
            </h2>

            <div className={styles.inputs}>
              {/* Bookings */}
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

              {/* Fee per booking */}
              <div className={styles.inputGroup}>
                <label htmlFor='fee' className={styles.label}>
                  Platform fee per booking
                </label>
                <div className={styles.inputRow}>
                  <span className={styles.prefix}>$</span>
                  <input
                    id='fee'
                    type='number'
                    min={0.01}
                    max={50}
                    step={0.25}
                    value={feePerBooking}
                    onChange={(e) =>
                      setFeePerBooking(Math.max(0.01, Number(e.target.value)))
                    }
                    className={styles.input}
                  />
                  <span className={styles.unit}>/ booking</span>
                </div>
                <input
                  type='range'
                  min={0.5}
                  max={20}
                  step={0.25}
                  value={feePerBooking}
                  onChange={(e) => setFeePerBooking(Number(e.target.value))}
                  className={styles.slider}
                  aria-label='Fee per booking slider'
                />
              </div>
            </div>

            <p className={styles.footnote}>
              At ${feePerBooking.toFixed(2)}/booking, you break even vs. Fonts
              &amp; Footers at just {breakEven} rides/month.
            </p>
          </div>

          {/* ── RIGHT: output card ── */}
          <div className={styles.right}>
            <div className={styles.outputCard}>
              <div className={styles.dot5} />
              <div className={styles.dot6} />
              <div className={styles.dot7} />
              <div className={styles.dot8} />

              <div className={styles.outputRow}>
                <span className={styles.outputLabel}>What you pay now</span>
                <span className={styles.outputValue}>
                  ${fmt(competitorMonthly)}
                  <span className={styles.outputPer}>/mo</span>
                </span>
              </div>

              <div className={styles.divider} />

              <div className={styles.outputRow}>
                <span className={styles.outputLabel}>Fonts &amp; Footers</span>
                <span className={styles.outputValue}>
                  $499
                  <span className={styles.outputPer}>/mo</span>
                </span>
              </div>

              <div className={styles.divider} />

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
