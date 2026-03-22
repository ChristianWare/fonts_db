"use client";

import styles from "./HowItWorks.module.css";
import LayoutWrapper from "../../shared/LayoutWrapper";
import SectionIntro from "@/components/shared/SectionIntro/SectionIntro";

const process = [
  {
    id: 1,
    title: "Discovery Call",
    week: "Week 1",
    desc: "We learn your operation — services, fleet, pricing, and dispatch. Everything we need to build your platform the way your business actually runs.",
  },
  {
    id: 2,
    title: "Build & Configure",
    week: "Weeks 1–2",
    desc: "We build your site and configure the full platform — services, vehicles, pricing, service areas, email templates, and branding. All tailored to your company.",
  },
  {
    id: 3,
    title: "Review & Refine",
    week: "Weeks 2–3",
    desc: "We walk you through the live platform before launch. You test every flow, share feedback, and we refine until it's exactly right.",
  },
  {
    id: 4,
    title: "Launch",
    week: "Week 4",
    desc: "We connect your domain, complete final integrations, and go live. From here, we're available for support, updates, and ongoing improvements.",
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
              From first call to <br /> first booking in 2–4 weeks.
            </h2>
            <p className={styles.copy}>
              A straightforward, guided process — from discovery call to live
              platform. No lengthy timelines, no back-and-forth guesswork.
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
