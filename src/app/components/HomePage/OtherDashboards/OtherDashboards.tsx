import LayoutWrapper from "../../shared/LayoutWrapper";
import styles from "./OtherDashboards.module.css";

export default function OtherDashboards() {
  return (
    <section className={styles.container}>
      <LayoutWrapper>
        <div className={styles.content}>
          <h2 className={styles.heading}>Other Dashboards</h2>
        </div>
      </LayoutWrapper>
    </section>
  );
}
