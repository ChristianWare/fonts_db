// import SectionIntroii from "../SectionIntroii/SectionIntroii";
import styles from "./Logo.module.css";
import Link from "next/link";

const Logo = () => {
  return (
    <Link href='/' className={styles.container}>
      {/* Fonts & Footers */}
      Logo
      {/* <SectionIntroii title='Fonts & Footers' dot={false}  /> */}
    </Link>
  );
};

export default Logo;
