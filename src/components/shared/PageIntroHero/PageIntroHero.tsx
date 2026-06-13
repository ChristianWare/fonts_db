"use client";

import LayoutWrapper from "@/components/shared/LayoutWrapper";
import styles from "./PageIntroHero.module.css";
import Nav from "@/components/shared/Nav/Nav";
import SectionIntro from "@/components/shared/SectionIntro/SectionIntro";
import Image, { StaticImageData } from "next/image";
import Button from "../Button/Button";

interface HeroBoxItem {
  id: number;
  feature: string;
  desc: string;
}

interface PageIntroHeroProps {
  sectionIntroText: string;
  heading: string;
  subheading: string;
  items?: HeroBoxItem[];
  copy: string;
  src: StaticImageData;
  btnText: string;
  href: string;
}

export default function PageIntroHero({
  sectionIntroText,
  heading,
  subheading,
  items,
  copy,
  src,
  btnText,
  href,
}: PageIntroHeroProps) {
  const hasItems = items && items.length > 0;

  return (
    <section className={styles.container}>
      <LayoutWrapper>
        <div className={styles.parent}>
          <div className={styles.dot1} />
          <div className={styles.dot2} />
          <div className={styles.dot3} />
          <div className={styles.dot4} />

          <div className={styles.content}>
            <div className={styles.topParent}>
              <Nav variant='black' hamburgerColor='hamburgerBlack' />
            </div>
            <div className={styles.headingImageContainer}>
              <div className={styles.hICA}>
                <SectionIntro
                  text={sectionIntroText}
                  background='bgBlack'
                  color='colorYellow'
                />
                <h2 className={`${styles.topHeading} h2ii`}>{heading}</h2>
                <h3 className={`${styles.heading} h6`}>{subheading}</h3>
                <div className={styles.outro}>
                  <p className={styles.outroCopy}>{copy}</p>
                </div>
                <div className={styles.btnContainer}>
                  <Button href={href} text={btnText} btnType='accent' arrow />
                </div>
              </div>
              <div className={styles.hICB}>
                <div className={styles.imgContainer}>
                  <Image
                    src={src}
                    alt=''
                    title=''
                    fill
                    className={styles.img}
                  />
                </div>
              </div>
            </div>
            <div
              className={`${styles.top} ${!hasItems ? styles.topNoBorder : ""}`}
            ></div>

            {hasItems && (
              <div className={styles.bottom}>
                {items.map((x, i) => (
                  <div key={x.id} className={styles.box}>
                    <span className={styles.index}>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <h4 className={styles.feature}>{x.feature}</h4>
                    <p className={styles.desc}>{x.desc}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </LayoutWrapper>
    </section>
  );
}
