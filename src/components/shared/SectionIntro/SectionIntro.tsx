import styles from "./SectionIntro.module.css";

export default function SectionIntro({ text, color, background }: { text: string, color?: string, background?: string }) {
  return (
    <div className={`${styles.container} ${styles[background || "default"]}`}>
      <span className={`${styles.text} ${styles[color || "default"]}`}>{text}</span>
    </div>
  );
}
