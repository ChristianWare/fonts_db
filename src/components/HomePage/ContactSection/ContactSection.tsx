import LayoutWrapper from "@/components/shared/LayoutWrapper";
import styles from "./ContactSection.module.css";
import SectionIntro from "@/components/shared/SectionIntro/SectionIntro";

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
                &ldquo;Strativ helped us uncover gaps in our decision-making that we
                didn’t even realize were slowing us down. The clarity we gained
                in a single session changed the way our team operates.&rdquo;
              </h6>
            </div>
          </div>
          <div className={styles.right}></div>
        </div>
      </LayoutWrapper>
    </section>
  );
}
