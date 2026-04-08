import styles from "./ContentPadding.module.css";

interface PaddingProps {
  children: React.ReactNode;
  paddingBottom?: string;
  borderDark?: boolean;
}

const ContentPadding = ({
  children,
  paddingBottom = "",
  borderDark = false,
}: PaddingProps) => {
  return (
    <div
      className={`${styles.container} ${styles[paddingBottom]} ${borderDark ? styles.borderDark : ""}`}
    >
      {children}
    </div>
  );
};
export default ContentPadding;
