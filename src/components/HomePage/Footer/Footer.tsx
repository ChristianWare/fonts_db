import LayoutWrapper from "@/components/shared/LayoutWrapper";
import styles from "./Footer.module.css";
import Link from "next/link";
import Button from "@/components/shared/Button/Button";
import LinkedIn from "@/components/shared/icons/LinkedIn/LinkedIn";
import Instagram from "@/components/shared/icons/Instagram/Instagram";
import Facebook from "@/components/shared/icons/Facebook/Facebook";

const items = [
  { text: "Features", href: "/#features" },
  { text: "Work", href: "/#work" },
  { text: "Pricing", href: "/#pricing" },
  { text: "About", href: "/#about" },
  { text: "Contact", href: "/#contact" },
  { text: "My Account", href: "/account" },
];

const data3 = [
  {
    id: 8,
    href: "https://www.linkedin.com/feed/",
    icon: <LinkedIn className={styles.socialIcon} />,
  },
  {
    id: 9,
    href: "https://www.instagram.com/fontsandfooters/",
    icon: <Instagram className={styles.socialIcon} />,
  },
  {
    id: 10,
    href: "https://www.facebook.com/fontsandfooters",
    icon: <Facebook className={styles.socialIcon} />,
  },
];

export default function Footer() {
  return (
    <footer className={styles.container}>
      <LayoutWrapper>
        <div className={styles.content}>
          <div className={styles.top}>
            <h2 className={`${styles.heading} h1`}>
              Bring clarity to <br />
              <span className={styles.accent}>your next strategy.</span>
            </h2>
          </div>
          <div className={styles.bottom}>
            <div className={styles.bottomLeft}>
              <div className={styles.navItems}>
                {items.map((item) => {
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={styles.navItem}
                    >
                      {item.text}
                    </Link>
                  );
                })}
              </div>
            </div>
            <div className={styles.bottomRight}>
              <div className={styles.btnContainer}>
                <Button
                  href='/'
                  text='Book your discovery call'
                  btnType='white'
                  arrow
                />
              </div>
            </div>
          </div>
        </div>
        <div className={styles.bottomii}>
          <div className={styles.footerSocials}>
            {data3.map((x) => (
              <Link
                key={x.id}
                href={x.href}
                target='_blank'
                className={styles.socialIconContainer}
              >
                {x.icon}
              </Link>
            ))}
          </div>
          <div className={styles.footerBottom}>
            <div className={styles.footerBottomLeft}>
              <small className={styles.small}>© 2025 Fonts & Footers</small>
            </div>
            <div className={styles.footerBottomRight}>
              <small className={styles.small}>
                This site was designed and developed by Fonts & Footers
              </small>
            </div>
          </div>
        </div>
      </LayoutWrapper>
    </footer>
  );
}
