import styles from "./SectionIntro.module.css";

export default function SectionIntro({ text }: { text: string }) {
  return (
    <div className={styles.container}>
      <span className={styles.text}>{text}</span>
    </div>
  );
}
