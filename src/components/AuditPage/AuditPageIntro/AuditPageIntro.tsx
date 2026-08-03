import LayoutWrapper from "@/components/shared/LayoutWrapper";
import styles from "./AuditPageIntro.module.css";
import Nav from "@/components/shared/Nav/Nav";
import Image from "next/image";
import Img1 from "../../../../public/images/audit.jpg";
import Button from "@/components/shared/Button/Button";

export default function AuditPageIntro() {
  return (
    <section className={styles.container}>
      <LayoutWrapper lightGrayBorder>
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
                <h1 className={styles.heading}>
                  Find out what your{" "}
                  <span className={styles.accent}>website is costing you</span>
                </h1>
              </div>
              <div className={styles.b2}>
                <div className={styles.imgContainer}>
                  <Image
                    src={Img1}
                    alt=''
                    title=''
                    fill
                    className={styles.img}
                  />
                </div>
                <div className={styles.copyBtnContainer}>
                  <p className={styles.copy}>
                    Built specifically for black car and limo operators. The
                    audit scores your site across six categories: speed, booking
                    flow, SEO, trust signals, tech stack, and brand. Then it
                    estimates the bookings you&apos;re losing every month
                    because of them.{" "}
                    <span className={styles.span}>
                      No credit card. No account to create. Just your URL and
                      where to send the report.
                    </span>
                  </p>
                  <div className={styles.btnContainer}>
                    <Button
                      href='/audit'
                      text='Run your free audit'
                      btnType='accent'
                      arrow
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
