import styles from "./ContentPadding.module.css";

interface PaddingProps {
  children: React.ReactNode;
  paddingBottom?: string;
  borderDark?: boolean;
  borderDarkii?: boolean;
}

const ContentPadding = ({
  children,
  paddingBottom = "",
  borderDark = false,
  borderDarkii = false,
}: PaddingProps) => {
  return (
    <div
      className={`${styles.container} ${styles[paddingBottom]} ${borderDark ? styles.borderDark : ""} ${borderDarkii ? styles.borderDarkii : ""}`}
    >
      {children}
    </div>
  );
};
export default ContentPadding;
