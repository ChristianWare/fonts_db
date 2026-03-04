
/* eslint-disable @typescript-eslint/no-explicit-any */
import { ReactNode } from "react";
import Link from "next/link";
import styles from "./Button.module.css";
// import Arrow from "../icons/Arrow/Arrow";
import Image from "next/image";
import ChrisImg from "../../../../public/images/chris.jpg";

interface Props {
  href?: string;
  text?: string;
  btnType: string;
  direction?: string;
  target?: "_blank" | "_self" | "_parent" | "_top";
  disabled?: boolean;
  children?: ReactNode;
  // arrow?: boolean;
  image?: boolean;
  onClick?: (
    e: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>
  ) => void;
  type?: "button" | "submit" | "reset";
}

export default function Button({
  href,
  text,
  btnType,
  target,
  disabled,
  children,
  onClick,
  direction ="",
  // arrow,
  image,
  type = "button",
}: Props) {
  const content = text || children;

  // LINK VARIANT
  if (href) {
    return (
      <Link
        href={href}
        target={target}
        rel={target === "_blank" ? "noopener noreferrer" : undefined}
        onClick={onClick as any}
        className={`${styles.btn} ${styles[btnType]} ${styles[direction]}`}
      >
        {image && (
          <span className={styles.imgContainer} aria-hidden>
            <Image src={ChrisImg} alt='' fill className={styles.img} />
          </span>
        )}
        {content}
        {/* <Arrow className={styles.arrow} /> */}
      </Link>
    );
  }

  // BUTTON VARIANT
  return (
    <button
      type={type}
      className={`${styles.btn} ${styles[btnType]}`}
      disabled={disabled}
      onClick={onClick}
    >
      {image && (
        <span className={styles.imgContainer} aria-hidden>
          <Image src={ChrisImg} alt='' fill className={styles.img} />
        </span>
      )}
      {content}
      {/* <Arrow className={styles.arrow} /> */}
    </button>
  );
}
