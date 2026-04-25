import styles from "./Logo.module.css";
import Image from "next/image";
import Link from "next/link";
import LogoImg from "../../../../public/logos/fnf_logo_black.png";

interface LogoProps {
  variant?: "white" | "black";
}

const Logo = ({ variant = "white" }: LogoProps) => {
  return (
    <Link href='/' className={styles.container}>
      <Image
        src={LogoImg}
        alt='Fonts & Footers Logo'
        title='Fonts & Footers Logo'
        className={`${styles.logo} ${
          variant === "black" ? styles.logoBlack : styles.logoWhite
        }`}
      />
      <span
        className={`${styles.text} ${
          variant === "black" ? styles.textBlack : styles.textWhite
        }`}
      >
        Fonts & Footers
      </span>
    </Link>
  );
};

export default Logo;
