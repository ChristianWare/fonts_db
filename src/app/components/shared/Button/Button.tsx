/* eslint-disable @typescript-eslint/no-explicit-any */
import { ReactNode } from "react";
import Link from "next/link";
import styles from "./Button.module.css";


interface Props {
  href?: string;
  text?: string;
  btnType: string;
  direction?: string;
  target?: "_blank" | "_self" | "_parent" | "_top";
  disabled?: boolean;
  children?: ReactNode;
  image?: boolean;
  onClick?: (
    e: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>,
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
  direction = "",
  type = "button",
}: Props) {
  const content = text || children;

  if (href) {
    return (
      <Link
        href={href}
        target={target}
        rel={target === "_blank" ? "noopener noreferrer" : undefined}
        onClick={onClick as any}
        className={`${styles.btn} ${styles[btnType]} ${styles[direction]}`}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      type={type}
      className={`${styles.btn} ${styles[btnType]}`}
      disabled={disabled}
      onClick={onClick}
    >
     
      {content}
    </button>
  );
}
