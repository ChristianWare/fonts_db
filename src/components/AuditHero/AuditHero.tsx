import LayoutWrapper from "@/components/shared/LayoutWrapper";
import styles from "./AuditHero.module.css";
// import Image from "next/image";
import BgImage from "../../../public/images/benz.png";
import Nav from "@/components/shared/Nav/Nav";
import SectionIntro from "@/components/shared/SectionIntro/SectionIntro";
import Image from "next/image";
import Button from "../shared/Button/Button";
// import Button from "@/components/shared/Button/Button";

export default function AuditHero() {
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
              <Nav />
            </div>
            <div className={styles.bottom}>
              <div className={styles.b1}>
                <SectionIntro text='Free Audit' />
                <h1 className={`${styles.heading} h2`}>
                  Find out exactly what&apos;s costing you bookings —
                  <br /> <span className={styles.accent}>in 60 seconds. </span>
                </h1>
              </div>
              <div className={styles.b2}>
                <div className={styles.b2Left}>
                  <p className={styles.copy}>
                    The Fonts & Footers audit tool analyzes your website across
                    the factors that determine whether you get found, whether
                    visitors trust you, and whether your site actually converts.
                    Free, no email, no signup. Just enter your URL.
                  </p>
                  <div className={styles.btnContainer}>
                    <Button
                      href='/audit'
                      text='Try it for free'
                      btnType='accent'
                      arrow
                    />
                  </div>
                </div>
                <div className={styles.b2Right}>
                  <div className={styles.imgContainer}>
                    <Image
                      src={BgImage}
                      alt='About Us'
                      title='About Us'
                      fill
                      className={styles.img}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </LayoutWrapper>
    </section>
  );
}
