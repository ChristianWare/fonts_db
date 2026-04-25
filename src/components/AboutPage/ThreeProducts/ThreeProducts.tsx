"use client";

import { useEffect, useRef } from "react";
import LayoutWrapper from "@/components/shared/LayoutWrapper";
import styles from "./ThreeProducts.module.css";
import SectionIntro from "@/components/shared/SectionIntro/SectionIntro";
import Button from "@/components/shared/Button/Button";

type Card = {
  id: number;
  label: string;
  heading: string;
  body: string;
};

const cards: Card[] = [
  {
    id: 7,
    label: "Solution 1",
    heading: "Free Website Audit",
    body: "Enter your URL and get a full breakdown of what's costing you bookings — your Google visibility, site speed, mobile performance, and conversion gaps. Free, no email required, under a minute.",
  },
  {
    id: 8,
    label: "Solution 2",
    heading: "Lead Generation Tool",
    body: "Find the businesses in your market that generate consistent transportation demand. Every lead comes with a specific contact, verified email or phone, and an AI-written outreach script personalized to that business.",
  },
  {
    id: 9,
    label: "Solution 3",
    heading: "Custom Booking Website",
    body: "A professionally built booking website designed specifically for black car operators. Direct booking, no per-booking fees, flight tracking, driver portal, and payment processing — all included at one flat monthly rate.",
  },
];

export default function ThreeProducts() {
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
      <LayoutWrapper borderDark>
        <div className={styles.parent}>
          <div className={styles.content}>
            <div className={styles.top}>
              <div className={styles.topRight}>
                <SectionIntro
                  text='What we offer'
                  background='bgBlack'
                  color='colorWhite'
                />
                <h2 className={styles.headingMain}>
                  Three products.
                  <br />
                  <span className={styles.accent}>One system.</span>
                </h2>
                <h3 className={`${styles.subheading} h6`}>
                  Three solutions. One system. Built to grow your black car
                  business.
                </h3>
                {/*  fixes it */}
                <p className={styles.copy}>
                  Each product solves a different problem at a different stage
                  of your business. They work independently, but together they
                  form a complete system designed specifically for how black car
                  operators grow.
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
                      <div className={styles.btnContainer}>
                        <Button
                          href='/'
                          text='Learn more'
                          btnType='black'
                          arrow
                        />
                      </div>
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
