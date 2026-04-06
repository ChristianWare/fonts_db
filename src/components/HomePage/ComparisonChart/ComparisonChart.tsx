/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import LayoutWrapper from "../../shared/LayoutWrapper";
import styles from "./ComparisonChart.module.css";
import Check from "../../shared/Check/Check";
import ROICalculator from "../ROICalculator/ROICalculator";
// import SectionIntro from "../../shared/SectionIntro/SectionIntro";

type CompetitorName =
  | "Fonts & Footers"
  | "Limo Anywhere"
  | "Ground Alliance"
  | "Generic Agency";

type Feature = {
  name: string;
  description: string;
  support: Record<CompetitorName, boolean | string>;
};

const competitors: { name: CompetitorName; note: string }[] = [
  { name: "Fonts & Footers", note: "$499 / mo" },
  { name: "Limo Anywhere", note: "Dispatch tool" },
  { name: "Ground Alliance", note: "Marketplace" },
  { name: "Generic Agency", note: "Template site" },
];

const features: Feature[] = [
  {
    name: "Custom-branded website",
    description:
      "A professionally designed site built entirely to your brand — not a template.",
    support: {
      "Fonts & Footers": true,
      "Limo Anywhere": false,
      "Ground Alliance": false,
      "Generic Agency": true,
    },
  },
  {
    name: "Built-in booking engine",
    description:
      "A fully integrated booking flow that lives on your own domain.",
    support: {
      "Fonts & Footers": true,
      "Limo Anywhere": true,
      "Ground Alliance": true,
      "Generic Agency": false,
    },
  },
  {
    name: "No per-booking fees",
    description: "Flat monthly rate — we never take a cut of your rides.",
    support: {
      "Fonts & Footers": true,
      "Limo Anywhere": false,
      "Ground Alliance": false,
      "Generic Agency": true,
    },
  },
  {
    name: "You own your customer data",
    description:
      "Your riders belong to you — not a platform that can change its terms tomorrow.",
    support: {
      "Fonts & Footers": true,
      "Limo Anywhere": false,
      "Ground Alliance": false,
      "Generic Agency": true,
    },
  },
  {
    name: "Flight tracking",
    description:
      "Live aviation data auto-populates bookings and adjusts pickup times on delays.",
    support: {
      "Fonts & Footers": true,
      "Limo Anywhere": true,
      "Ground Alliance": false,
      "Generic Agency": false,
    },
  },
  {
    name: "Driver portal with push notifications",
    description:
      "Drivers log in, see their schedule, update trip status, and track earnings.",
    support: {
      "Fonts & Footers": true,
      "Limo Anywhere": true,
      "Ground Alliance": false,
      "Generic Agency": false,
    },
  },
  {
    name: "Corporate accounts",
    description:
      "Businesses apply, get approved, and book under a company account with centralized billing.",
    support: {
      "Fonts & Footers": true,
      "Limo Anywhere": false,
      "Ground Alliance": false,
      "Generic Agency": false,
    },
  },
  {
    name: "Approve & price workflow",
    description:
      "Review pending bookings, set the final price, then confirm — all from the dashboard.",
    support: {
      "Fonts & Footers": true,
      "Limo Anywhere": false,
      "Ground Alliance": false,
      "Generic Agency": false,
    },
  },
  {
    name: "Customer portal",
    description:
      "Riders manage trips, download receipts, and save addresses — under your brand.",
    support: {
      "Fonts & Footers": true,
      "Limo Anywhere": false,
      "Ground Alliance": true,
      "Generic Agency": false,
    },
  },
  {
    name: "Programmatic SEO pages",
    description:
      "Hundreds of auto-generated location + service pages to capture local search traffic.",
    support: {
      "Fonts & Footers": true,
      "Limo Anywhere": false,
      "Ground Alliance": false,
      "Generic Agency": false,
    },
  },
];

export default function ComparisonChart() {
  const [isMobile, setIsMobile] = useState(false);
  const [selected, setSelected] = useState(0);

  useEffect(() => {
    const check = () =>
      setIsMobile(window.matchMedia("(max-width: 968px)").matches);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const competitorsToRender = isMobile ? [competitors[selected]] : competitors;

  return (
    <section className={styles.container}>
      <div className={styles.cornerContainer}>
        {/* <div className={styles.corner}>
          <SectionIntro text='Why Fonts & Footers' />
        </div> */}
      </div>
      <LayoutWrapper>
        <div className={styles.content}>
          <div className={styles.top}>
            <h2 className={styles.heading}>
              The only flat-rate platform <br /> built for black car.
            </h2>
            <p className={styles.copy}>
              Every alternative either takes a cut of your rides, owns your
              customers, or gives you a template. Here&apos;s how it actually
              compares.
            </p>
          </div>

          {/* Mobile tabs */}
          <div className={styles.mobileTabs}>
            {competitors.map((c, i) => (
              <button
                key={c.name}
                type='button'
                onClick={() => setSelected(i)}
                className={`${styles.tab} ${
                  i === selected ? styles.activeTab : ""
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>

          <div
            className={styles.grid}
            style={{
              ["--plan-count" as any]: competitorsToRender.length,
            }}
          >
            {/* Header row — names */}
            <div className={`${styles.row} ${styles.headerRow}`}>
              <div
                className={`${styles.cell} ${styles.headerCell} ${styles.featureColHead} ${styles.cornerCell}`}
              >
                Feature
              </div>
              {competitorsToRender.map((c, i) => {
                const isFonts = c.name === "Fonts & Footers";
                return (
                  <div
                    key={c.name}
                    className={`${styles.cell} ${styles.headerCell} ${
                      styles.planHead
                    } ${isFonts ? styles.featured : ""} ${
                      i === competitorsToRender.length - 1
                        ? styles.lastHeaderCell
                        : ""
                    }`}
                  >
                    <div className={styles.planHeadTop}>
                      <h3 className={styles.planName}>{c.name}</h3>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Price / note row */}
            <div className={`${styles.row} ${styles.headerRowii}`}>
              <div
                className={`${styles.cell} ${styles.headerCell} ${styles.featureColHead} ${styles.cornerCell}`}
              >
                <span className={styles.featureName}>Pricing model</span>
              </div>
              {competitorsToRender.map((c, i) => {
                const isFonts = c.name === "Fonts & Footers";
                return (
                  <div
                    key={c.name}
                    className={`${styles.cell} ${styles.headerCell} ${
                      styles.planHead
                    } ${isFonts ? styles.featured : ""} ${
                      i === competitorsToRender.length - 1
                        ? styles.lastHeaderCell
                        : ""
                    }`}
                  >
                    <div className={styles.planHeadTop}>
                      <h3 className={styles.planNameii}>{c.note}</h3>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Feature rows */}
            {features.map((feat) => (
              <div key={feat.name} className={styles.row}>
                <div className={`${styles.cell} ${styles.featureCol}`}>
                  <span className={styles.featureName}>{feat.name}</span>
                  <span className={styles.featureInfo}>{feat.description}</span>
                </div>
                {competitorsToRender.map((c) => {
                  const val = feat.support[c.name];
                  const isFonts = c.name === "Fonts & Footers";
                  return (
                    <div
                      key={`${feat.name}-${c.name}`}
                      className={`${styles.cell} ${styles.valueCell} ${
                        isFonts ? styles.featured : ""
                      }`}
                      aria-label={`${c.name} ${
                        val ? "includes" : "does not include"
                      } ${feat.name}`}
                    >
                      {val === true ? (
                        <span className={styles.valueYes}>
                          <Check className={styles.icon} />
                        </span>
                      ) : typeof val === "string" ? (
                        <span className={styles.valuePartial}>{val}</span>
                      ) : (
                        <span className={styles.valueNo}>—</span>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </LayoutWrapper>

      <ROICalculator />
    </section>
  );
}
