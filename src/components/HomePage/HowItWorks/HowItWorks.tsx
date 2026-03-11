"use client";

import styles from "./HowItWorks.module.css";
import LayoutWrapper from "../../shared/LayoutWrapper";
import SectionIntro from "../../shared/SectionIntro/SectionIntro";
import IndustriesIllustration from "../../../../public/logos/fnf_logo_black.png";
import Image from "next/image";

const process = [
  {
    id: 1,
    title: "Step 1 — Discovery Call (Week 1)",
    desc: "We get on a call to learn your operation: your services, your fleet, your service area, how you price, how you dispatch, and what you want your platform to do. We take detailed notes on everything so the build reflects exactly how your business works — not a generic version of it.",
  },
  {
    id: 2,
    title: "Step 2 — Build & Configure (Weeks 1–2)",
    desc: "We build your custom website and configure the full platform. This includes setting up your services, vehicles, pricing structure, service area cities, email templates, notification preferences, and branding — everything tailored to your company.",
  },
  {
    id: 3,
    title: "Step 3 — Review & Refine (Week 2–3)",
    desc: "We walk you through the live platform before launch. You test every flow — booking a ride, assigning a driver, processing a payment, reviewing the admin dashboard. We address any feedback and make adjustments until it's exactly right.",
  },
  {
    id: 4,
    title: "Step 4 — Launch",
    desc: "We connect your domain, complete any final integrations, and flip the switch. You're live. From that point forward, we're available for support, updates, and ongoing improvements.",
  },
];

export default function HowItWorks() {
  return (
    <div className={styles.container}>
      <LayoutWrapper>
        <div className={styles.content}>
          <div className={styles.left}>
            <div className={styles.leftContent}>
              <div className={styles.SectionIntroContainer}>
                <SectionIntro text='The process' />
              </div>
              <h2 className={`${styles.heading} h5`}>
                From first call to first booking in 2–3 weeks.
              </h2>
              <p className={styles.copy}>
                A straightforward, guided process — from discovery call to live
                platform. No lengthy timelines, no back-and-forth guesswork.
              </p>
              <div className={styles.imgContainer}>
                <Image
                  src={IndustriesIllustration}
                  alt='Service Illustration'
                  fill
                  className={styles.img}
                  priority
                />
              </div>
            </div>
          </div>
          <div className={styles.right}>
            <div className={styles.mapDataBox}>
              {process.map((item) => (
                <div key={item.id} className={styles.card}>
                  <strong className={styles.title}>{item.title}</strong>
                  <p className={styles.desc}>{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </LayoutWrapper>
    </div>
  );
}
