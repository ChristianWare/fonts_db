import LayoutWrapper from "../../shared/LayoutWrapper";
import styles from "./Outgrow.module.css";

export default function Outgrow() {
  return (
    <section className={styles.container}>
      <LayoutWrapper>
        <div className={styles.parent}>
          <div className={styles.content}>
            <div className={styles.dot1} />
            <div className={styles.dot2} />
            <div className={styles.dot3} />
            <div className={styles.dot4} />
            <h2 className={styles.heading}>Outgrow</h2>
          </div>
        </div>
      </LayoutWrapper>
    </section>
  );
}
