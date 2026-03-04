import Button from "../../shared/Button/Button";
import LayoutWrapper from "../../shared/LayoutWrapper";
import SectionIntro from "../../shared/SectionIntro/SectionIntro";
import styles from "./Solution.module.css";
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
                <SectionIntro text='Solution' />
                <h2 className={styles.heading}>
                  We Build You the Platform, You Run
                  Your Business.
                </h2>
              </div>
              <div className={styles.topRight}>
                <p className={styles.copy}>
                  Fonts & Footers builds fully custom, white-label booking
                  platforms for black car services from the ground up. Your
                  platform is branded entirely to your company{" "}
                  <span className={styles.accent}>
                    — your colors, your name, your domain. Customers never see
                    our name.
                  </span>
                </p>
                <div className={styles.btnContainer}>
                  <Button
                    href='/'
                    text='Take the tour'
                    btnType='accent'
                    arrow
                  />
                </div>
              </div>
            </div>
            <div className={styles.bottom}>
              {SolutionData.map((x) => (
                <div className={styles.card} key={x.id}>
                  <div className={styles.cardLeft}>
                    <div className={styles.cardLeftTop}>
                      <span className={styles.oneWordDesc}>
                        0{x.id} {x.oneWordDesc}
                      </span>
                        <h3 className={styles.cardHeading}>{x.title}</h3>
                    </div>
                    <div className={styles.cardLeftBottom}>
                      <ul className={styles.bulletList}>
                        {x.bullets.map((bullet, index) => (
                          <li key={index} className={`${styles.bulletTitle} h3`}>{bullet}</li>
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
                      <p className={styles.imgDescription}>{x.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </LayoutWrapper>
    </section>
  );
}
