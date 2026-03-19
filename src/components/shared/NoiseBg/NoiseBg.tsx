import styles from "./NoiseBg.module.css";

const NoiseBg = ({ children }: { children: React.ReactNode }) => {
  return <div className={styles.background}>{children}</div>;
};
export default NoiseBg;
