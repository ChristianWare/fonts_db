import LayoutWrapper from "@/components/shared/LayoutWrapper";
import styles from "./ContactPageHero.module.css";
import Nav from "@/components/shared/Nav/Nav";
import SectionIntro from "@/components/shared/SectionIntro/SectionIntro";
import Check from "@/components/shared/Check/Check";
import Link from "next/link";
import LinkedIn from "@/components/shared/icons/LinkedIn/LinkedIn";
import Instagram from "@/components/shared/icons/Instagram/Instagram";

const data = [
  {
    id: 1,
    text: "Look at your current website and booking setup together",
  },
  {
    id: 2,
    text: "Identify where you are losing bookings or work to competitors",
  },
  {
    id: 3,
    text: "Walk through whether the audit, leads tool, or custom build fits your situation",
  },
  {
    id: 4,
    text: "Talk through pricing, timeline, and what would actually happen next",
  },
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

export default function ContactPageHero() {
  return (
    <section className={styles.container}>
      <LayoutWrapper>
        <div className={styles.parent}>
          <div className={styles.dot1} />
          <div className={styles.dot2} />
          <div className={styles.dot3} />
          <div className={styles.dot4} />
          <div className={styles.content}>
            <div className={styles.top}>
              <Nav variant='black' />
            </div>
            <div className={styles.bottom}>
              <div className={styles.b1}>
                <SectionIntro text='Get in touch' />
                <h1 className={styles.heading}>
                  Tell us about <br />{" "}
                  <span className={styles.accent}>your operation.</span>
                </h1>
              </div>
            </div>
          </div>
        </div>
        <div className={styles.b2}>
          <div className={styles.b2Left}>
            <h3 className={styles.subHeadinigh}>General questions</h3>
            <p className={styles.copy}>
              Pricing questions, feature questions, &quot;is this right for my
              operation&quot; questions — drop us a line.{" "}
              <span className={styles.copyAccent}>
                Same inbox, same person, same response time.
              </span>
            </p>
            <div>
              <p className={styles.emailLinkHeading}>Email</p>
              <a
                className={styles.emailLink}
                href='mailto:chris@fontsandfooters.com'
              >
                hello@fontsandfooters.com
              </a>
            </div>
            <div>
              <p className={styles.emailLinkHeading}>Office Hours</p>
              <a className={styles.emailLink}>
                Monday — Friday
                <br />
                9:00 AM — 6:00 PM (MST)
              </a>
            </div>
            <div>
              <p className={styles.emailLinkHeading}>Socials</p>
              <a className={styles.emailLink}>
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
              </a>
            </div>
          </div>
          <div className={styles.b2Right}>
            <h3 className={styles.subHeadinigh}>Book a discovery call</h3>
            <p className={styles.copy}>
              30 minutes on Calendly. The fastest way to figure out if any of
              this fits your business —{" "}
              <span className={styles.copyAccent}>
                and if it doesn&apos;t, I&apos;ll say so.
              </span>
            </p>
            <div>
              <p className={styles.explain}>During this call, we will:</p>
              <div className={styles.mapDataContainer}>
                {data.map((item) => (
                  <div key={item.id} className={styles.mapDataItem}>
                    <Check className={styles.icon} />
                    <p className={styles.mapDataText}>{item.text}</p>
                  </div>
                ))}
              </div>
            </div>
            <p className={styles.copy}>
              <span className={styles.copyAccent}>
                No sales pitch. No pressure. If we&apos;re not a fit, we&apos;ll
                say so.
              </span>
            </p>
          </div>
        </div>
      </LayoutWrapper>
    </section>
  );
}
