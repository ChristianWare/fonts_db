"use client";

import { useEffect, useRef } from "react";
import LayoutWrapper from "@/components/shared/LayoutWrapper";
import styles from "./HomePricing.module.css";
import SectionIntro from "@/components/shared/SectionIntro/SectionIntro";
import Button from "@/components/shared/Button/Button";

type Plan = {
  id: number;
  label: string;
  name: string;
  price: string;
  priceSuffix: string;
  description: string;
  features: string[];
  cta: string;
  href: string;
  footnote: string;
  popular?: boolean;
};

const plans: Plan[] = [
  {
    id: 1,
    label: "Solution 1",
    name: "Free Website Audit",
    price: "$0.00",
    priceSuffix: "",
    description: "See exactly what your website is costing you in bookings.",
    features: [
      "Full scored audit across 6 categories",
      "Page speed and mobile performance",
      "SEO and booking-capability check",
      "Personalized PDF report emailed to you",
    ],
    cta: "Run free audit",
    href: "/audit",
    footnote: "No credit card. No commitment.",
  },
  {
    id: 2,
    label: "Solution 2",
    name: "Lead Generation Tool",
    price: "$125",
    priceSuffix: "/mo",
    description: "Find the work in your market before your competition does.",
    features: [
      "Hot, warm, and cold leads in your market",
      "AI-scored with strategic briefs",
      "Verified contacts and outreach scripts",
      "Pipeline tracking built in",
    ],
    cta: "Get started",
    href: "/leads",
    footnote: "Flat monthly rate. Cancel anytime.",
    popular: true,
  },
  {
    id: 3,
    label: "Solution 3",
    name: "Custom Booking Website",
    price: "$499",
    priceSuffix: "/mo",
    description: "Own your booking platform end to end.",
    features: [
      "Direct booking, zero per-booking fees",
      "Flight tracking and driver portal",
      "Payment processing included",
      "Built for black car operators specifically",
    ],
    cta: "Get started",
    href: "/websites",
    footnote: "First month free. We handle setup.",
  },
];

export default function HomePricing() {
  const sectionRef = useRef<HTMLElement>(null);
  const card1Ref = useRef<HTMLDivElement>(null);
  const card3Ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      // Disable parallax on mobile/tablet
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
      <LayoutWrapper borderDarkii>
        <div className={styles.content}>
          <div className={styles.top}>
            <SectionIntro text='Pricing' />
            <h2 className={styles.heading}>
              Three products. <br /> <span className={styles.accent}>Honest pricing.</span>
            </h2>
            <p className={styles.copy}>
              No per-booking cuts, no commissions, no platform tax on your own
              customers. One flat monthly rate per product — start free, scale
              into the rest when the timing&apos;s right for your business.
            </p>
          </div>

          <div className={styles.bottom}>
            <div className={styles.mapDataContainer}>
              {plans.map((plan, index) => (
                <div
                  className={styles.card}
                  key={plan.id}
                  ref={index === 0 ? card1Ref : index === 2 ? card3Ref : null}
                >
                  <div className={styles.cardTop}>
                    <div className={styles.labelRow}>
                      {/* <span className={styles.label}>{plan.label}</span> */}
                      {plan.popular && (
                        <span className={styles.popularBadge}>Popular</span>
                      )}
                    </div>
                    <h3 className={styles.cardName}>{plan.name}</h3>
                    <p className={styles.cardDesc}>{plan.description}</p>
                    <p className={`${styles.price} h2ii`}>
                      {plan.price}
                      {plan.priceSuffix && (
                        <span className={styles.priceSuffix}>
                          {plan.priceSuffix}
                        </span>
                      )}
                    </p>
                  </div>

                  <div className={styles.cardBottom}>
                    <ul className={styles.featureList}>
                      {plan.features.map((feature, i) => (
                        <li key={i} className={`${styles.feature} p`}>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className={styles.btnFootnoteContainer}>
                    <div className={styles.btnContainer}>
                      <Button
                        href={plan.href}
                        text={plan.cta}
                        // btnType='accent'
                        btnType={index % 2 === 0 ? "accent" : "white"}
                        arrow
                      />
                    </div>
                    <p className={styles.footnote}>{plan.footnote}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </LayoutWrapper>
    </section>
  );
}
