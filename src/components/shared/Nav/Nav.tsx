"use client";

import styles from "./Nav.module.css";
import Link from "next/link";
import Logo from "../Logo/Logo";
import Button from "../Button/Button";
import { useEffect, useState, MouseEvent } from "react";
// import Image from "next/image";
// import Img1 from "../../../../../public/images/whydb.jpg";

export default function Nav({
  hamburgerColor = "",
}: {
  color?: string;
  hamburgerColor?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const body = document.body;
    body.style.overflow =
      window.innerWidth <= 1068 && isOpen ? "hidden" : "auto";
    const handleResize = () => setIsOpen(false);
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      body.style.overflow = "auto";
    };
  }, [isOpen]);

  const toggleMenu = () => setIsOpen((s) => !s);
  const closeMenu = () => setIsOpen(false);

  const handleNavClick = (e: MouseEvent<HTMLAnchorElement>, href: string) => {
    closeMenu();
    if (href.startsWith("/#")) {
      e.preventDefault();
      const id = href.replace("/#", "");
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }
  };
  const handleHamburgerClick = (e: MouseEvent<HTMLSpanElement>) => {
    e.stopPropagation();
    toggleMenu();
  };

  const items = [
    { text: "Features", href: "/#features" },
    { text: "Work", href: "/#work" },
    { text: "Pricing", href: "/#pricing" },
    { text: "About", href: "/#about" },
    { text: "Contact", href: "/#contact" },
    { text: "Audit", href: "/audit" },
    { text: "My Account", href: "/dashboard" },
  ];

  return (
    <header className={styles.header}>
      <nav className={styles.navbar}>
        <div className={styles.navLeft}>
          <div className={styles.logoContainer}>
            <Logo />
          </div>
          <div
            className={
              isOpen ? `${styles.navItems} ${styles.active}` : styles.navItems
            }
          >
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={styles.navItem}
                onClick={(e) => handleNavClick(e, item.href)}
              >
                {item.text}
              </Link>
            ))}
            {/* <div className={styles.menuImage}>
              <Image src={Img1} alt='Menu image' fill className={styles.img} />
            </div> */}
            <div className={styles.btnContainerii}>
              <Button
                href='https://calendly.com/chris-ware-dev/discovery-call'
                target='_blank'
                text='Book your discovery call'
                btnType='navWhite'
                onClick={closeMenu}
                arrow
              />
            </div>
          </div>
        </div>

        <div className={styles.navRight}>
          <div className={styles.btnContainer}>
            <Button
              href='https://calendly.com/chris-ware-dev/discovery-call'
              target='_blank'
              text='Book discovery call'
              btnType='navWhite'
            />
          </div>
          <div
            className={`${styles.hamburgerContainer} ${isOpen ? styles.hamburgerContainerOpen : ""}`}
          >
            <div
              className={`${styles.menuText} ${isOpen ? styles.menuTextOpen : ""}`}
            >
              MENU
            </div>
            <span
              className={`${styles.hamburger} ${isOpen ? styles.active : ""}`}
              onClick={handleHamburgerClick}
              aria-expanded={isOpen}
              role='button'
            >
              <span
                className={`${styles.whiteBar} ${isOpen ? styles.barOpen : ""} ${styles[hamburgerColor]}`}
              ></span>
              <span
                className={`${styles.whiteBar} ${isOpen ? styles.barOpen : ""} ${styles[hamburgerColor]}`}
              ></span>
              <span
                className={`${styles.whiteBar} ${isOpen ? styles.barOpen : ""} ${styles[hamburgerColor]}`}
              ></span>
            </span>
          </div>
        </div>
      </nav>
    </header>
  );
}
