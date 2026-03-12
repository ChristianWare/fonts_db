import LayoutWrapper from "@/components/shared/LayoutWrapper";
import styles from "./ContactSection.module.css";

export default function ContactSection() {
  return (
    <section className={styles.container}>
      <LayoutWrapper>
        <div className={styles.content}>
          <h2 className={styles.heading}>Contact Us</h2>
        </div>
      </LayoutWrapper>
    </section>
  );
}
