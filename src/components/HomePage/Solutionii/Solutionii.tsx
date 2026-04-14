"use client";

import { useEffect, useRef } from "react";
import LayoutWrapper from "@/components/shared/LayoutWrapper";
import styles from "./Solutionii.module.css";
import LightBulb from "@/components/shared/icons/LightBulb/LightBulb";
import SectionIntro from "@/components/shared/SectionIntro/SectionIntro";

type Card = {
  id: number;
  label: string;
  heading: string;
  body: string;
};

const cards: Card[] = [
  {
    id: 7,
    label: "Product 1",
    heading: "Free Website Audit",
    body: "Enter your URL and get a full breakdown of what's costing you bookings — your Google visibility, site speed, mobile performance, and conversion gaps. Free, no email required, under a minute.",
  },
  {
    id: 8,
    label: "Product 2",
    heading: "Lead Generation Tool",
    body: "Find the businesses in your market that generate consistent transportation demand. Every lead comes with a specific contact, verified email or phone, and an AI-written outreach script personalized to that business.",
  },
  {
    id: 9,
    label: "Product 3",
    heading: "Custom Booking Website",
    body: "A professionally built booking website designed specifically for black car operators. Direct booking, no per-booking fees, flight tracking, driver portal, and payment processing — all included at one flat monthly rate.",
  },
];

export default function Solutionii() {
  const sectionRef = useRef<HTMLElement>(null);
  const card1Ref = useRef<HTMLDivElement>(null);
  const card3Ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      // Disable parallax on mobile
      if (window.innerWidth <= 1268) {
        if (card1Ref.current) card1Ref.current.style.transform = "";
        if (card3Ref.current) card3Ref.current.style.transform = "";
        return;
      }

      const section = sectionRef.current;
      if (!section) return;

      const rect = section.getBoundingClientRect();
      // scrolledIntoView: 0 when section top hits bottom of viewport, grows as you scroll
      const scrolledIntoView = window.innerHeight - rect.top;

      const factor = 0.12;

      if (card1Ref.current) {
        // Card 1 drifts downward
        card1Ref.current.style.transform = `translateY(${scrolledIntoView * factor}px)`;
      }

      if (card3Ref.current) {
        // Card 3 drifts upward (opposite of card 1)
        card3Ref.current.style.transform = `translateY(${-scrolledIntoView * factor}px)`;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    // Run once on mount so initial position is set
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <section className={styles.container} ref={sectionRef}>
      <LayoutWrapper>
        <div className={styles.parent}>
          <div className={styles.content}>
            <div className={styles.top}>
              <div className={styles.topLeft}>
                <div className={styles.imagContainer}>
                  <LightBulb className={styles.icon} />
                </div>
              </div>
              <div className={styles.topRight}>
                <SectionIntro text='SOLUTION' />
                <h2 className={styles.heading}>
                  How we solve <br />
                  <span className={styles.accent}> those problems ↑</span>
                </h2>
                <h3 className={`${styles.subheading} h6`}>
                  Three products. One system. Built to grow your black car
                  business.
                </h3>
                {/*  fixes it */}
                <p className={styles.copy}>
                  We didn&apos;t build a generic tool and point it at the
                  transportation industry. Every product was built from the
                  ground up for black car operators specifically — the way you
                  work, the clients you chase, and the problems you actually
                  face. Each one works on its own, but they&apos;re designed to
                  work together.
                </p>
              </div>
            </div>
            <div className={styles.bottom}>
              <div className={styles.mapDataContainer}>
                {cards.map((x, index) => (
                  <div
                    className={styles.card}
                    key={x.id}
                    ref={index === 0 ? card1Ref : index === 2 ? card3Ref : null}
                  >
                    <div className={styles.cardTop}>
                      <span className={styles.label}>{x.label}</span>
                      <h3 className={styles.heading}>{x.heading}</h3>
                    </div>
                    <div className={styles.cardBottom}>
                      <p className={styles.body}>{x.body}</p>
                    </div>
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
