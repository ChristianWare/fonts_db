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
                text='Your command center'
                color='colorWhite'
                background='bgBlack'
              />
              <h2 className={styles.heading}>
                SEE HOW STRATIV <br /> FITS INTO YOUR <br /> WORKFLOW.
              </h2>
            </div>
            <div className={styles.leftBottom}>
              <h6 className={styles.text}>
                &ldquo;Strativ helped us uncover gaps in our decision-making
                that we didn’t even realize were slowing us down. The clarity we
                gained in a single session changed the way our team
                operates.&rdquo;
              </h6>
              <div className={styles.imgCaptionContainer}>
                <Image
                  src={Img1}
                  alt='Testimonial Image'
                  title='Testimonial Image'
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
                Teams often know their goals — the challenge is connecting
                decisions, planning, and execution in a way that stays coherent.
                <br />
                <br />
                Tell us how your team currently operates, and we’ll prepare a
                walkthrough that reflects your reality, not a generic demo.
              </p>
            </div>
            <ContactForm />
          </div>
        </div>
      </LayoutWrapper>
    </section>
  );
}
