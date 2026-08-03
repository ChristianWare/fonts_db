import LayoutWrapper from "@/components/shared/LayoutWrapper";
import styles from "./AuditPageIntro.module.css";
import Nav from "@/components/shared/Nav/Nav";
import Check from "@/components/shared/Check/Check";
import Link from "next/link";

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

                
              </div>
            </div>
          </div>
        </div>
      </LayoutWrapper>
    </section>
  );
}
