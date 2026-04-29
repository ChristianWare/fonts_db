"use client";

import styles from "./AuditHowItWorks.module.css";
import LayoutWrapper from "../../shared/LayoutWrapper";
import SectionIntro from "@/components/shared/SectionIntro/SectionIntro";
import Button from "@/components/shared/Button/Button";

const process = [
  {
    id: 1,
    title: "Google visibility",
    week: "01",
    desc: "Whether your site is structured to rank for local black car searches. Title tags, meta descriptions, structured data, local SEO signals, and Google Business Profile alignment. A site that doesn't show up in search isn't losing bookings — it's never getting the chance to.",
    category: "Search",
  },
  {
    id: 2,
    title: "Page speed",
    week: "02",
    desc: "How fast your site loads on desktop and mobile. A site that takes more than 3 seconds to load loses more than half its visitors before they see anything. Page speed also affects Google rankings directly.",
    category: "Technical",
  },
  {
    id: 3,
    title: "Mobile performance",
    week: "03",
    desc: "Whether your site actually works on the devices your clients are using. Navigation, booking flow, tap targets, responsive layout, mobile-specific issues. More than 60% of black car searches happen on phones — your site has to work there.",
    category: "Technical",
  },
  {
    id: 4,
    title: "Conversion elements",
    week: "04",
    desc: "Whether your site is built to turn visitors into bookings. Instant quote tool, clear booking CTA, accessible contact information, pricing visibility, friction in the booking flow. A beautiful site that doesn't convert is just a brochure.",
    category: "UX",
  },
  {
    id: 5,
    title: "Trust signals",
    week: "05",
    desc: "What a first-time visitor sees when they're deciding whether to trust you with a booking. Reviews, credentials, fleet photos, professional copy, contact accessibility, social proof. Corporate clients especially need these before they'll commit.",
    category: "Brand",
  },
  {
    id: 6,
    title: "Competitor comparison",
    week: "06",
    desc: "How your site stacks up against the top-ranking black car operators in your specific market across all five categories above. Knowing your score in isolation is useful. Knowing it relative to the operators winning in your city is what creates clarity about what to do next.",
    category: "Market",
  },
];

interface Props {
  onOpenModal: () => void;
}

export default function AuditHowItWorks({ onOpenModal }: Props) {
  return (
    <section className={styles.container}>
      <LayoutWrapper>
        <div className={styles.content}>
          <div className={styles.top}>
            <SectionIntro text='Six categories' />
            <h2 className={`${styles.heading} h3`}>WHAT THE AUDIT CHECKS</h2>
            <p className={styles.copy}>
              Every factor that determines whether your site gets booked.
            </p>
          </div>
          <div className={styles.bottom}>
            {process.map((x) => (
              <>
                {x.title && x.desc && (
                  <div key={x.id} className={styles.card}>
                    <div className={styles.cardTop}>
                      <span className={`${styles.id} h1`}>{x.id}</span>
                    </div>
                    <div className={styles.cardMiddle}>
                      <SectionIntro text={x.category} />
                      <h3 className={`${styles.title} h6`}>{x.title}</h3>
                    </div>
                    <p className={styles.desc}>{x.desc}</p>
                  </div>
                )}
              </>
            ))}
            <div className={styles.btnContainer}>
              <Button
                onClick={onOpenModal}
                text='Try it for free'
                btnType='accent'
                arrow
              />
            </div>
          </div>
        </div>
      </LayoutWrapper>
    </section>
  );
}

// AuditHowItWorks;
