import styles from "./LeadsProblem.module.css";
import LayoutWrapper from "@/components/shared/LayoutWrapper";
import Image from "next/image";
import Img1 from "../../../../public/images/WhyWeExist.jpg";
import SectionIntro from "@/components/shared/SectionIntro/SectionIntro";

export default function LeadsProblem() {
  return (
    <section className={styles.container}>
        <div className={styles.content}>
      <LayoutWrapper >
          <div className={styles.imgOverlay}></div>
          <div className={styles.contentChildren}>
            <div className={styles.left}>
              <div className={styles.headingGroup}>
                <SectionIntro text="The reactive operator's problem" />
                <h2 className={`${styles.heading} h3`} lang='en'>
                  Right now, in your market, somebody is planning the corporate
                  event you should be transporting.
                </h2>
              </div>
              <p className={styles.body}>
                A regional law firm is organizing a partner retreat next month.
                A fundraiser is being planned for a gala in six weeks. A wedding
                venue you&apos;ve never met is booking ten weddings between now
                and October — and not one of those couples knows you exist.
              </p>
              <p className={styles.copy}>
                The work is always there. <br />
                The problem is that nobody is <br />
                watching for it on your behalf.
              </p>
            </div>

            <div className={styles.right}>
              <div className={styles.card}>
                <div className={styles.cardTop}>
                  <h3 className={`${styles.cardTitle} h5 `} lang='en'>
                    Corporate Partner Retreat
                  </h3>
                  <span className={styles.cardLabel}>Hot lead</span>
                </div>
                <div className={styles.cardBottom}>
                  <div className={styles.cardImgContainer}>
                    <Image
                      src={Img1}
                      alt=''
                      title=''
                      priority={true}
                      fill
                      className={styles.cardImg}
                    />
                  </div>
                  <div className={styles.cardDetails}>
                    <div className={styles.cardDetailsLeft}>
                      <span className={styles.cardMissed}>Score</span>
                      <span className={styles.cardScore}>92 / 100</span>
                    </div>
                    <div className={styles.cardDetailsRight}>
                      <div className={styles.cardTag}>11 days</div>
                      <div className={styles.cardTagHot}>Hot</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
      </LayoutWrapper>
        </div>
    </section>
  );
}
