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
             
            </div>
          </div>
        </div>
      </LayoutWrapper>
    </section>
  );
}
