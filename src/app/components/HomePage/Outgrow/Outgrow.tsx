import LayoutWrapper from "../../shared/LayoutWrapper";
import styles from "./Outgrow.module.css";
import Image from "next/image";
import Img1 from "../../../../../public/images/stressed.jpg";

const data = [
  {
    id: 1,
    title: "Fees on every ride",
    desc: "Third-party platforms take a cut of every booking. When they raise their fees, you absorb the hit — with no way out.",
  },
  {
    id: 2,
    title: "Not your brand",
    desc: "Your booking experience looks like everyone else's. Clients see a generic platform, not the premium service you've built.",
  },
  {
    id: 3,
    title: "Zero data ownership",
    desc: "The platform owns your customer relationships. You can't market to them, build loyalty, or reach them if something changes.",
  },
  {
    id: 4,
    title: "No real control",
    desc: "Pricing, policies, and algorithms can change overnight. You're building your business on a foundation someone else controls.",
  },
  {
    id: 5,
    title: "Generic first impressions",
    desc: "Executives and corporate travelers judge you before they book. A cookie-cutter website signals a cookie-cutter service.",
  },
  {
    id: 6,
    title: "Scattered operations",
    desc: "Bookings in one app, drivers in another, payments somewhere else. Nothing talks to each other and things fall through the cracks.",
  },
];

export default function Outgrow() {
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
              <h2 className={styles.heading}>
                Have you outgrown <br /> the{" "}
                <span className={styles.accent}>
                  platform you <br /> started with?
                </span>
              </h2>
              <p className={styles.copy}>
                Most black car operators start out using generic booking
                software or a template site — and it works, for a while. But at
                some point you realize you&apos;re paying transaction fees on
                every ride, your branding looks like everyone else&apos;s, and
                you have zero control over your customer experience. Your
                clients are booking through a platform that could change its
                pricing, policies, or algorithm tomorrow. None of that data is
                yours.
              </p>
            </div>
            <div className={styles.bottom}>
              <div className={styles.left}>
                <div className={styles.mapDataContainer}>
                  {data.map((item) => (
                    <div key={item.id} className={styles.card}>
                      <h3 className={styles.mapHeading}>{item.title}</h3>
                      <p className={styles.mapCopy}>{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className={styles.right}>
                <div className={styles.imgContainer}>
                  <Image
                    src={Img1}
                    alt='Stressed out driver'
                    title='Stressed out driver'
                    fill
                    className={styles.img}
                  />
                </div>
                <div className={styles.imgCaptionTitle}>Is this you?</div>
                <div className={styles.imgCaptionDesc}>
                  A black car operator at a desk — slightly
                  overwhelmed, frustrated with his existing platform.
                </div>
              </div>
            </div>
          </div>
        </div>
      </LayoutWrapper>
    </section>
  );
}
