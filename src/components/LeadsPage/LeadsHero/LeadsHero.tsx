import styles from "./LeadsHero.module.css";
import SectionIntro from "@/components/shared/SectionIntro/SectionIntro";
import Nav from "@/components/shared/Nav/Nav";
import LayoutWrapper from "@/components/shared/LayoutWrapper";

export default function LeadsHero() {
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
              <Nav variant='black' hamburgerColor='hamburgerBlack' />
            </div>
            <div className={styles.bottom}>
              <div className={styles.b1}>
                <SectionIntro text='Product 02 of 03' />
                <h1 className={styles.heading}>
                  Find your next corporate account
                  <br />{" "}
                  <span className={styles.accent}>
                    before your competitor does
                  </span>
                </h1>
                <p className={styles.copy}>
                  A lead generation tool built exclusively for black car
                  operators.
                  <span className={styles.span}>
                    {" "}
                    Hot leads from people actively requesting transportation.
                    Warm leads from businesses signaling upcoming demand. Cold
                    leads from the B2B accounts that will fill your calendar for
                    years.
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </LayoutWrapper>
    </section>
  );
}
