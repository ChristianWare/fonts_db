import LayoutWrapper from "@/components/shared/LayoutWrapper";
import styles from "./Footer.module.css";
import Link from "next/link";
import Button from "@/components/shared/Button/Button";
import LinkedIn from "@/components/shared/icons/LinkedIn/LinkedIn";
import Instagram from "@/components/shared/icons/Instagram/Instagram";
// import Facebook from "@/components/shared/icons/Facebook/Facebook";

const items = [
  { text: "Home", href: "/" },
  { text: "Features", href: "/#features" },
  { text: "Work", href: "/#work" },
  { text: "Pricing", href: "/#pricing" },
  { text: "About", href: "/#about" },
  { text: "Contact", href: "/#contact" },
  { text: "My Account", href: "/dashboard" },
];

const data3 = [
  {
    id: 8,
    href: "https://www.linkedin.com/in/christian-ware/",
    icon: <LinkedIn className={styles.socialIcon} />,
  },
  {
    id: 9,
    href: "https://www.instagram.com/fontsandfooters/",
    icon: <Instagram className={styles.socialIcon} />,
  },
  // {
  //   id: 10,
  //   href: "https://www.facebook.com/fontsandfooters",
  //   icon: <Facebook className={styles.socialIcon} />,
  // },
];

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={styles.container}>
      <LayoutWrapper>
        <div className={styles.content}>
          <div className={styles.top}>
            <h2 className={`${styles.heading} h1`}>
              Custom Direct <br />
              <span className={styles.accent}>booking websites.</span>
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
                  href='https://calendly.com/chris-fontsandfooters/30min'
                  target='_blank'
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
              <small className={styles.small}>
                © {currentYear} Fonts & Footers
              </small>
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
