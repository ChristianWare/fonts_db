import ContentPadding from "../ContentPadding/ContentPadding";
import styles from "./LayoutWrapper.module.css";

interface Props {
  children: React.ReactNode;
  borderDark?: boolean;
}

const LayoutWrapper = ({ children, borderDark = false }: Props) => {
  return (
    <div className={styles.layout}>
      <ContentPadding borderDark={borderDark}>{children}</ContentPadding>
    </div>
  );
};
export default LayoutWrapper;
