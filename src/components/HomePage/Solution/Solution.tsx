import styles from "./Solution.module.css";
import Button from "../../shared/Button/Button";
import LayoutWrapper from "../../shared/LayoutWrapper";
import SectionIntro from "../../shared/SectionIntro/SectionIntro";
import Image from "next/image";
import { SolutionData } from "@/lib/data";

export default function Solution() {
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
                <SectionIntro text='The system' />
                <h2 className={`${styles.heading} h2ii`}>
                  Each product makes the next one more powerful.
                </h2>
              </div>
              <div className={styles.topRight}>
                <p className={styles.copy}>
                  The audit shows you what&apos;s broken. The lead tool sends
                  people to your website before it&apos;s fixed. The website
                  converts the leads the lead tool finds.
                  <span className={styles.accent}>
                    This is the sequence every operator who works with us
                    follows — and it&apos;s why the products are priced and
                    designed the way they are.
                  </span>
                </p>
                <div className={styles.btnContainer}>
                  <Button
                    href='/#features'
                    text='Take the tour'
                    btnType='accent'
                    arrow
                  />
                </div>
              </div>
            </div>
            <div className={styles.bottom}>
              <div className={styles.mapDataContainer}>
                {SolutionData.map((x) => (
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
                        {/* <p className={styles.imgDescription}>{x.description}</p> */}
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
