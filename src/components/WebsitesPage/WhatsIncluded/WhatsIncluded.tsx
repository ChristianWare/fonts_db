"use client";

import { useState } from "react";
import styles from "./WhatsIncluded.module.css";
import LayoutWrapper from "../../shared/LayoutWrapper";
import SectionIntro from "../../shared/SectionIntro/SectionIntro";
import Arrow from "@/components/shared/icons/Arrow/Arrow";
import { whatsInDashboardData } from "@/lib/data";

export default function WhatsIncluded() {
  // Only one card open at a time, all collapsed by default — same pattern as
  // PlacePageClient's AccordionSection group.
  const [openId, setOpenId] = useState<number | null>(null);

  function toggle(id: number) {
    setOpenId((prev) => (prev === id ? null : id));
  }

  return (
    <section className={styles.container}>
      <LayoutWrapper>
        <div className={styles.parent}>
          <div className={styles.dot1} />
          <div className={styles.dot2} />
          <div className={styles.dot3} />
          <div className={styles.dot4} />
          <div className={styles.content}>
            <div className={styles.top}>
              <div className={styles.topLeft}>
                <SectionIntro text="WHAT'S IN THE DASHBOARD" />
                <h2 className={`${styles.heading}`}>
                  Every lead has a full intelligence brief waiting.
                </h2>
              </div>
              <div className={styles.topRight}>
                <h3 className={`${styles.subheading} h6`}>
                  The email gets you started. The dashboard is where you
                  actually work the leads.
                </h3>
                <p className={styles.copy}>
                  <span className={styles.accent}>
                    Nine intelligence layers built into every lead — so you
                    spend your morning on outreach, not research.
                  </span>
                </p>
              </div>
            </div>
            <div className={styles.bottom}>
              <div className={styles.mapDataContainer}>
                {whatsInDashboardData.map((x) => {
                  const isOpen = openId === x.id;
                  return (
                    <div className={styles.card} key={x.id}>
                      <div
                        className={styles.cardHeader}
                        onClick={() => toggle(x.id)}
                        role='button'
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            toggle(x.id);
                          }
                        }}
                      >
                        <div className={styles.cardHeaderContent}>
                          <span className={styles.oneWordDesc}>
                            {x.oneWordDesc}
                          </span>
                          <h3 className={styles.cardHeading}>{x.title}</h3>
                          {/* desc moved out of here ↓ */}
                        </div>
                        <div className={styles.accordionArrow}>
                          <Arrow
                            className={isOpen ? styles.iconFlip : styles.icon}
                          />
                        </div>
                      </div>
                      <div
                        className={`${styles.accordionBody} ${
                          isOpen ? styles.accordionBodyOpen : ""
                        }`}
                      >
                        <div className={styles.accordionBodyInner}>
                          {/* desc lives here now ↓ */}
                          <p className={styles.desc}>{x.description}</p>
                          <ul className={styles.bulletList}>
                            {x.bullets.map((bullet, index) => (
                              <li
                                key={index}
                                className={`${styles.bulletTitle} h3`}
                              >
                                {bullet}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </LayoutWrapper>
    </section>
  );
}
