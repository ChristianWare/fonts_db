"use client";

import styles from "./HowItWorks.module.css";
import LayoutWrapper from "../../shared/LayoutWrapper";
import SectionIntro from "@/components/shared/SectionIntro/SectionIntro";

const process = [
  {
    id: 1,
    title: "Discovery Call",
    week: "Week 1",
    desc: "We learn your operation — services, fleet, pricing, and how you dispatch. Everything we need to build the platform around how your business actually runs.",
  },
  {
    id: 2,
    title: "Build & Configure",
    week: "Weeks 1–2",
    desc: "We build your site and configure the full platform — vehicles, pricing, service areas, email templates, and branding. You don't touch a settings panel until it's ready to review.",
  },
  {
    id: 3,
    title: "Review & Refine",
    week: "Weeks 2–3",
    desc: "We walk you through the live platform before anything goes public. You test every flow, tell us what to change, and we refine until it's exactly right.",
  },
  {
    id: 4,
    title: "Launch",
    week: "Week 4",
    desc: "We connect your domain, complete final integrations, and go live together. After launch we're available for support, updates, and anything that comes up.",
  },
];

export default function HowItWorks() {
  return (
    <section className={styles.container}>
      <LayoutWrapper>
        <div className={styles.content}>
          <div className={styles.top}>
            <SectionIntro text='Process for working with us' />
            <h2 className={`${styles.heading} h3`}>
              Live and taking bookings <br /> in 2–4 weeks.
            </h2>
            <p className={styles.copy}>
              No lengthy back-and-forth, no guesswork on your end. We handle the
              build — you show up for the walkthrough and launch.
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
                      <h3 className={`${styles.title} h6`}>{x.title}</h3>
                      <SectionIntro text={x.week} />
                    </div>
                    <p className={styles.desc}>{x.desc}</p>
                  </div>
                )}
              </>
            ))}
          </div>
        </div>
      </LayoutWrapper>
    </section>
  );
}
