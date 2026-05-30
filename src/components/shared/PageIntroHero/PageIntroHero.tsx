"use client";

import LayoutWrapper from "@/components/shared/LayoutWrapper";
import styles from "./PageIntroHero.module.css";
import Nav from "@/components/shared/Nav/Nav";
import SectionIntro from "@/components/shared/SectionIntro/SectionIntro";
import Image, { StaticImageData } from "next/image";

interface PageIntroHeroProps {
  src: StaticImageData;
  sectionIntroText: string;
  heading: string;
  headingAccent: string;
  subheading: string;
  copy: string;
}

export default function PageIntroHero({
  src,
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
              <div className={styles.imgContainer}>
                <Image src={src} alt='Audit Hero' fill className={styles.img} />
              </div>
              <div className={styles.topRight}>
                <div className={styles.topRightA}>
                  <SectionIntro
                    text={sectionIntroText}
                    background='bgBlack'
                    color='colorWhite'
                  />
                  <h1 className={`${styles.heading} h2ii`}>
                    {heading}{" "}
                    <span className={`${styles.accent} h2ii`}>
                      {" "}
                      {headingAccent}
                    </span>
                  </h1>
                  <h3 className={`${styles.subheading} h6`}>{subheading}</h3>
                </div>

                <p className={styles.copy}>{copy}</p>
              </div>
            </div>
          </div>
        </div>
      </LayoutWrapper>
    </section>
  );
}
