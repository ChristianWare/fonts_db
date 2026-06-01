import LayoutWrapper from "@/components/shared/LayoutWrapper";
import styles from "./ContactPageHero.module.css";
import Nav from "@/components/shared/Nav/Nav";
import SectionIntro from "@/components/shared/SectionIntro/SectionIntro";

export default function ContactPageHero() {
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
              <Nav variant='black' />
            </div>
            <div className={styles.bottom}>
              <div className={styles.b1}>
                <SectionIntro text='About Us' />
                <h1 className={styles.heading}>
                  Clarity starts with <br />{" "}
                  <span className={styles.accent}>a conversation</span>
                </h1>
              </div>
              <div className={styles.b2}>
                <div className={styles.b2Left}>
                  <h3 className={styles.subHeadinigh}>General Questions</h3>
                  <p className={styles.copy}>
                    If you’re exploring Strativ or need clarity about how it
                    works, feel free to reach out.
                    <span className={styles.copyAccent}>
                      We’re here to help you understand whether Strativ is the
                      right fit for your team.
                    </span>
                  </p>
                  <div>
                    <p className={styles.emailLinkHeading}>Email</p>
                    <a className={styles.emailLink}>
                      hello@fontsandfooters.com
                    </a>
                  </div>
                  <div>
                    <p className={styles.emailLinkHeading}>Office Hours</p>
                    <a className={styles.emailLink}>
                      Monday - Friday
                      <br />
                      9:00 AM - 6:00 PM (CET)
                    </a>
                  </div>
                  <div>
                    <p className={styles.emailLinkHeading}>Socials</p>
                    <a className={styles.emailLink}>Socials here</a>
                  </div>
                </div>
                <div className={styles.b2Right}></div>
              </div>
            </div>
          </div>
        </div>
      </LayoutWrapper>
    </section>
  );
}
