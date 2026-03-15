import LayoutWrapper from "@/components/shared/LayoutWrapper";
import styles from "./ContactSection.module.css";
import SectionIntro from "@/components/shared/SectionIntro/SectionIntro";
import ContactForm from "../ContactForm/ContactForm";
import Image from "next/image";
import Img1 from "../../../../public/images/barry.png";

export default function ContactSection() {
  return (
    <section className={styles.container}>
      <LayoutWrapper>
        <div className={styles.content}>
          <div className={styles.dot1} />
          <div className={styles.dot2} />
          <div className={styles.dot3} />
          <div className={styles.dot4} />
          <div className={styles.left}>
            <div className={styles.leftTop}>
              <SectionIntro
                text='Book a discovery call'
                color='colorWhite'
                background='bgBlack'
              />
              <h2 className={styles.heading}>
                Ready To <br /> Get started?
              </h2>
            </div>
            <div className={styles.leftBottom}>
              <h6 className={styles.text}>
                &ldquo;Fonts &amp; Footers built us a direct booking platform
                that looks better than anything our competitors are running —
                and our clients actually use it. It paid for itself in the first
                month.&rdquo;
              </h6>
              <div className={styles.imgCaptionContainer}>
                <Image
                  src={Img1}
                  alt='Barry LaNier - Nier Transportation'
                  title='Barry LaNier - Nier Transportation'
                  className={styles.img}
                  width={56}
                  height={56}
                />
                <div className={styles.captionContainer}>
                  <p className={styles.captionName}>Barry LaNier</p>
                  <p className={styles.captionTitle}>
                    Owner of Nier Transportation
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className={styles.right}>
            <div className={styles.rightTop}>
              <p className={styles.copy}>
                Most black car operators are still taking bookings over the
                phone or through third-party platforms that take a cut of every
                ride.
                <br />
                <br />
                Tell us about your business and we&apos;ll show you exactly what
                a custom direct booking platform looks like for your operation —
                no generic demos, no sales pressure.
              </p>
            </div>
            <ContactForm />
          </div>
        </div>
      </LayoutWrapper>
    </section>
  );
}
