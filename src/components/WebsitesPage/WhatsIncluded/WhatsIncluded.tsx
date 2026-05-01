import styles from "./WhatsIncluded.module.css";
import LayoutWrapper from "../../shared/LayoutWrapper";
import SectionIntro from "../../shared/SectionIntro/SectionIntro";
import Image from "next/image";
import { whatsIncludedData } from "@/lib/data";

export default function WhatsIncluded() {
  return (
    <section className={styles.container}>
      <LayoutWrapper>
        <div className={styles.parent}>
          <div className={styles.dot1} />
          <div className={styles.dot2} />
          <div className={styles.dot3} />
          <div className={styles.dot4} />
          <div className={styles.content}>
            <div className={styles.top}>
              <div className={styles.topLeft}>
                <SectionIntro text="WHAT'S INCLUDED" />
                <h2 className={`${styles.heading}`}>
                  Everything in one number
                </h2>
              </div>
              <div className={styles.topRight}>
                <h3 className={`${styles.subheading} h6`}>
                  $499/month covers everything.{" "}
                </h3>
                <p className={styles.copy}>
                  <span className={styles.accent}>
                    No setup fee. No per-booking fees. No per-driver fees. No
                    upgrade fees as we ship new features. One number, every
                    month, everything covered.
                  </span>
                </p>
              </div>
            </div>
            <div className={styles.bottom}>
              <div className={styles.mapDataContainer}>
                {whatsIncludedData.map((x) => (
                  <div className={styles.card} key={x.id}>
                    <div className={styles.cardLeft}>
                      <div className={styles.cardLeftTop}>
                        <span className={styles.oneWordDesc}>
                          {x.oneWordDesc}
                        </span>
                        <h3 className={styles.cardHeading}>{x.title}</h3>
                        <p className={styles.desc}>{x.description}</p>
                      </div>
                      <div className={styles.cardLeftBottom}>
                        <ul className={styles.bulletList}>
                          {x.bullets.map((bullet, index) => (
                            <li
                              key={index}
                              className={`${styles.bulletTitle} h3`}
                            >
                              {bullet}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    <div className={styles.cardRight}>
                      <div className={styles.imgContainer}>
                        <Image
                          src={x.src}
                          alt={x.title}
                          title={x.title}
                          fill
                          className={styles.img}
                        />
                        <div className={styles.imgOverlay} />
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
