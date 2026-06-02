import LayoutWrapper from "@/components/shared/LayoutWrapper";
import styles from "./ContactSection.module.css";
import SectionIntro from "@/components/shared/SectionIntro/SectionIntro";
import ContactForm from "../ContactForm/ContactForm";
import Image from "next/image";
import Img1 from "../../../../public/images/barry.png";

export default function ContactSection() {
  return (
    <section className={styles.container}>
      <LayoutWrapper borderDark>
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
                  alt='Barry La Nier - Nier Transportation'
                  title='Barry La Nier - Nier Transportation'
                  className={styles.img}
                  width={56}
                  height={56}
                />
                <div className={styles.captionContainer}>
                  <p className={styles.captionName}>Barry La Nier</p>
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
                Wherever your operation is — chasing more corporate work, losing
                bookings to a slow site, or paying third-party platforms for
                every ride — start here.
                <br />
                <br />
                Tell us what you&apos;re working with and we&apos;ll show you the
                fastest path forward. If none of the three products fit,
                we&apos;ll say so.
              </p>
            </div>
            <ContactForm />
          </div>
        </div>
      </LayoutWrapper>
    </section>
  );
}
