import styles from "./ProblemSolution.module.css";
import LayoutWrapper from "@/components/shared/LayoutWrapper";
import Img1 from "../../../../public/images/stressed.jpg";
import Img2 from "../../../../public/images/reliefii.jpg";
import Image from "next/image";
import XIcon from "@/components/shared/icons/XIcon/XIcon";
import FeesIcon from "@/components/shared/icons/FeesIcon/FeesIcon";
import Brand from "@/components/shared/icons/Brand/Brand";
import Cloud from "@/components/shared/icons/Cloud/Cloud";
import Rule from "@/components/shared/icons/Rule/Rule";
import NoControlii from "@/components/shared/icons/NoControlii/NoControlii";
import Platform from "@/components/shared/icons/Platform/Platform";

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

const SolutionData = [
  {
    id: 1,
    title: "One flat rate. No cuts, ever.",
    icon: <FeesIcon className={styles.iconGood} />,
  },
  {
    id: 2,
    title: "Your name on everything",
    icon: <Brand className={styles.iconGood} />,
  },
  {
    id: 3,
    title: "Your customers. Your data.",
    icon: <Cloud className={styles.iconGood} />,
  },
  {
    id: 4,
    title: "You set the rules",
    icon: <Rule className={styles.iconGood} />,
  },
  {
    id: 5,
    title: "A first impression that closes deals",
    icon: <NoControlii className={styles.iconGood} />,
  },
  {
    id: 6,
    title: "One platform. Every role.",
    icon: <Platform className={styles.iconGood} />,
  },
];

export default function ProblemSolution() {
  return (
    <section className={styles.container}>
      <LayoutWrapper>
        <div className={styles.content}>
          <div className={styles.left}>
            <div className={styles.imgContainer}>
              <Image
                src={Img1}
                alt='Stressed person'
                title='Stressed person'
                fill
                className={styles.img}
              />
            </div>
            <div className={styles.leftList}>
              <div className={styles.top}>
                <h2 className={`${styles.subHeading} h2`}>
                  The issues businesses face
                </h2>
                <p className={styles.copy}>
                  Most operators start with generic booking software, but
                  quickly hit limits: transaction fees on every ride, generic
                  branding, and zero control over your customer experience or
                  data.
                </p>
              </div>
              <div className={styles.listWrapper}>
                {data.map((item) => (
                  <ul key={item.id} className={styles.listItems}>
                    <li className={`${styles.listItem} p`}>
                      <XIcon className={styles.icon} />
                      {item.title}
                    </li>
                  </ul>
                ))}
              </div>
            </div>
            <div className={styles.imgContainerMobile}>
              <Image
                src={Img1}
                alt='Stressed person'
                title='Stressed person'
                fill
                className={styles.imgMobile}
              />
            </div>
          </div>
          <div className={styles.middle}>
            <div className={styles.imgMiddleContainer}>
              <div className={styles.imgContainerMiddle} />
            </div>
            <span className={styles.middleText}>
              Fonts <br /> & Footers
            </span>
          </div>
          <div className={styles.right}>
            <div className={styles.imgContainer}>
              <Image
                src={Img2}
                alt='Relieved person'
                title='Relieved person'
                fill
                className={styles.img}
              />
            </div>
            <div className={styles.rightList}>
              <div className={styles.top}>
                <h2 className={`${styles.subHeading} h2`}>
                  How we solve them for you
                </h2>
                <p className={styles.copy}>
                  We build fully custom, white-label booking
                  platforms for black car services from the ground up. Your
                  platform is branded entirely to your company. Customers never see our name.
                </p>
              </div>
              <div className={styles.listWrapper}>
                {SolutionData.map((item) => (
                  <ul key={item.id} className={styles.listItems}>
                    <li className={`${styles.listItem} p`}>
                      {item.icon}
                      {item.title}
                    </li>
                  </ul>
                ))}
              </div>
            </div>
          </div>
        </div>
      </LayoutWrapper>
    </section>
  );
}
