import styles from "./Outgrow.module.css";
import LayoutWrapper from "../../shared/LayoutWrapper";
import Image from "next/image";
import Img1 from "../../../../public/images/stressed.jpg";
import SectionIntro from "../../shared/SectionIntro/SectionIntro";
// import Arrow from "@/components/shared/icons/Arrow/Arrow";
// import Money from "@/components/shared/icons/Money/Money";
import FeesIcon from "@/components/shared/icons/FeesIcon/FeesIcon";
import NotBrand from "@/components/shared/icons/NotBrand/NotBrand";
import NoData from "@/components/shared/icons/NoData/NoData";
import ScatteredIcon from "@/components/shared/icons/ScatteredIcon/ScatteredIcon";
import NoControl from "@/components/shared/icons/NoControl/NoControl";
import NoControlii from "@/components/shared/icons/NoControlii/NoControlii";

const data = [
  {
    id: 1,
    title: "Fees on every ride",
    desc: "Third-party platforms take a cut of every booking. When they raise their fees, you absorb the hit — with no way out.",
    icon: <FeesIcon className={styles.icon} />,
  },
  {
    id: 2,
    title: "Not your brand",
    desc: "Your booking experience looks like everyone else's. Clients see a generic platform, not the premium service you've built.",
    icon: <NotBrand className={styles.icon} />,
  },
  {
    id: 3,
    title: "Zero data ownership",
    desc: "The platform owns your customer relationships. You can't market to them, build loyalty, or reach them if something changes.",
    icon: <NoData className={styles.icon} />,
  },
  {
    id: 3.1,
    title: "",
    desc: "",
    icon: "",
  },
  {
    id: 4,
    title: "No real control",
    desc: "Pricing, policies, and algorithms can change overnight. You're building your business on a foundation someone else controls.",
    icon: <NoControlii className={styles.icon} />,
  },
  {
    id: 5,
    title: "Generic first impressions",
    desc: "Executives and corporate travelers judge you before they book. A cookie-cutter website signals a cookie-cutter service.",
    icon: <NoControl className={styles.icon} />,
  },
  {
    id: 6,
    title: "Scattered operations",
    desc: "Bookings in one app, drivers in another, payments somewhere else. Nothing talks to each other and things fall through the cracks.",
    icon: <ScatteredIcon className={styles.icon} />,
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
              <div className={styles.topLeft}>
                <SectionIntro text='Problem' />
                <h2 className={styles.heading}>
                  Have you outgrown <br /> the{" "}
                  <span className={styles.accent}>
                    platform you <br /> started with?
                  </span>
                </h2>
                <p className={styles.copy}>
                  Most operators start with generic booking software, but
                  quickly hit limits: transaction fees on every ride, generic
                  branding, and zero control over your customer experience or
                  data.
                </p>
              </div>
              <div className={styles.topRight}>
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
                  A black car operator at a desk — slightly overwhelmed,
                  frustrated with his existing platform.
                </div>
              </div>
            </div>
            <div className={styles.bottom}>
              {data.map((item) => (
                <div className={styles.card} key={item.id}>
                  {/* <div className={styles.dot1} />
                  <div className={styles.dot4} /> */}
                  {/* {item.icon && (
                    <div className={styles.iconContainer}>{item.icon}</div>
                  )} */}
                  <h3 className={`${styles.title} h6`}>
                    {item.icon && (
                      <span className={styles.iconContainer}>{item.icon}</span>
                    )}
                    {item.title}
                  </h3>
                  <p className={styles.desc}>{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </LayoutWrapper>
    </section>
  );
}
