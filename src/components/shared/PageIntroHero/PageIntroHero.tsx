"use client";

import LayoutWrapper from "@/components/shared/LayoutWrapper";
import styles from "./PageIntroHero.module.css";
import Nav from "@/components/shared/Nav/Nav";
import SectionIntro from "@/components/shared/SectionIntro/SectionIntro";
import { ReactNode } from "react";

interface PageIntroHeroProps {
  icon: ReactNode;
  sectionIntroText: string;
  heading: string;
  headingAccent: string;
  subheading: string;
  copy: string;
}

export default function PageIntroHero({
  icon,
  sectionIntroText,
  heading,
  headingAccent,
  subheading,
  copy,
}: PageIntroHeroProps) {
  return (
    <section className={styles.container}>
      <LayoutWrapper borderDark>
        <div className={styles.parent}>
          <div className={styles.dot1} />
          <div className={styles.dot2} />
          <div className={styles.dot3} />
          <div className={styles.dot4} />
          <div className={styles.content}>
            <div className={styles.topParent}>
              <Nav variant='black' hamburgerColor='hamburgerBlack' />{" "}
            </div>
            <div className={styles.top}>
              <div className={styles.topLeft}>
                <div className={styles.imagContainer}>
                  <div className={styles.iconWrapper}>{icon}</div>
                </div>
              </div>
              <div className={styles.topRight}>
                <SectionIntro
                  text={sectionIntroText}
                  background='bgBlack'
                  color='colorWhite'
                />
                <h1 className={`${styles.heading} h2`}>
                  {heading}{" "}
                  <span className={styles.accent}> {headingAccent}</span>
                </h1>

                <h3 className={`${styles.subheading} h6`}>{subheading}</h3>

                <p className={styles.copy}>{copy}</p>
              </div>
            </div>
          </div>
        </div>
      </LayoutWrapper>
    </section>
  );
}
