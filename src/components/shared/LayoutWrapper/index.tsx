import ContentPadding from "../ContentPadding/ContentPadding";
import styles from "./LayoutWrapper.module.css";

interface Props {
  children: React.ReactNode;
  borderDark?: boolean;
  borderDarkii?: boolean;
}

const LayoutWrapper = ({
  children,
  borderDark = false,
  borderDarkii = false,
}: Props) => {
  return (
    <div className={styles.layout}>
      <ContentPadding borderDark={borderDark} borderDarkii={borderDarkii}>
        {children}
      </ContentPadding>
    </div>
  );
};
export default LayoutWrapper;
