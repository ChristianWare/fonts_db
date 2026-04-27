import LayoutWrapper from "../../shared/LayoutWrapper";
import styles from "./AboutPageProject.module.css";
import Image from "next/image";
import NierHomePage from "../../../../public/images/nierHomePage.png";
import Button from "../../shared/Button/Button";
import SectionIntro from "@/components/shared/SectionIntro/SectionIntro";

export default function AboutPageProject() {
  return (
    <section className={styles.container}>
      <LayoutWrapper>
        <div className={styles.parent}>
          <div className={styles.content}>
            <div className={styles.left}>
              <SectionIntro
                text='Proof'
                background='bgBlack'
                color='colorWhite'
              />
              <h2 className={styles.heading}>Proven with a real operator</h2>
              <div className={styles.imgContainerii}>
                <Image
                  src={NierHomePage}
                  alt='Nier Transportation Home Page'
                  title='Nier Transportation Home Page'
                  fill
                  className={styles.imgRight}
                />
              </div>
              <p>
                Nier Transportation was the first black car company to run on
                the Fonts & Footers platform. Barry La Nier runs professional
                black car and executive transportation service in the Phoenix
                metro. His platform handles direct bookings, corporate accounts,
                driver dispatch, and payment processing — without per-booking
                fees to any third-party platform.
                <br />
                <br />
                <span className={styles.accent}>
                  Every product Fonts & Footers builds is tested against his
                  operation before it ever ships to another client. That&lsquo;s
                  how we make sure what we&lsquo;re building actually works —
                  not in a demo, but in the field, every day, with real drivers
                  and real bookings.
                </span>
              </p>
              <div className={styles.statBox}>
                <div className={styles.statLeft}>
                  <span className={styles.detail}>Duplicate work</span>
                  <span className={`${styles.heading} h1`}>-27%</span>
                </div>
                <div className={styles.statRight}>
                  <span className={styles.detail}>On-time delivery</span>
                  <span className={`${styles.heading} h1`}>+42%</span>
                </div>
              </div>
              <div className={styles.btnContainer}>
                <Button
                  href='https://www.niertransportation.com/'
                  target='_blank'
                  text='see live site'
                  btnType='accent'
                  arrow
                />
              </div>
            </div>
            <div className={styles.right}>
              <div className={styles.imgContainer}>
                <Image
                  src={NierHomePage}
                  alt='Nier Transportation Home Page'
                  title='Nier Transportation Home Page'
                  fill
                  className={styles.imgRight}
                />
              </div>
            </div>
          </div>
        </div>
      </LayoutWrapper>
    </section>
  );
}
