"use client";

import styles from "./AuditParallaxResults.module.css";
import LayoutWrapper from "../../shared/LayoutWrapper";
import Img1 from "../../../../public/images/range.jpg";
import ParallaxImageLarge from "@/components/HomePage/ParallaxImageLarge/ParallaxImageLarge";
import SectionIntro from "../../shared/SectionIntro/SectionIntro";
import Button from "@/components/shared/Button/Button";

const data = [
  {
    id: 1,
    title: "An overall score out of 100",
  },
  {
    id: 2,
    title: "YCategory scores across all six areas",
  },
  {
    id: 3,
    title: "A prioritized list of specific issues with severity flagged",
  },
  {
    id: 4,
    title:
      "A side-by-side comparison against the top 3 black car operators in your market",
  },
  {
    id: 5,
    title: "A recommended next step based on what the audit finds",
  },
];

export default function AuditParallaxResults() {
  return (
    <section className={styles.container}>
      <ParallaxImageLarge src={Img1} alt='Parallax background' />
      <div className={styles.imgOverlay} />
      <LayoutWrapper>
        <div className={styles.content}>
          <div className={styles.contentChildren}>
            <h2 className={styles.heading}>
              A score. <br /> a breakdown.
              <br />a clear list of what to fix.
            </h2>
            <div className={styles.bottom}>
              <div className={styles.left}>
                <p className={styles.copy}>
                  The audit returns a score out of 100 with a full breakdown by
                  category. Each issue is flagged specifically — not &ldquo;your
                  SEO needs work&rdquo; but &ldquo;your page title tag is
                  missing the city name, which is costing you local search
                  visibility for your market.&rdquo;
                </p>
              </div>
              <div className={styles.right}>
                <div className={styles.sectionIntroContainer}>
                  <SectionIntro text='You get' />
                </div>
                <ul className={styles.dataBox}>
                  {data.map((x) => (
                    <li key={x.id} className={styles.title}>
                      <span className={styles.index}>{x.id}</span> {x.title}
                    </li>
                  ))}
                </ul>
                <div className={styles.btnContainer}>
                  <Button text='Try it for free' btnType='accent' arrow />
                </div>
              </div>
            </div>
          </div>
        </div>
      </LayoutWrapper>
    </section>
  );
}
