import LayoutWrapper from "@/components/shared/LayoutWrapper";
import styles from "./ProblemSolution.module.css";
import Img1 from "../../../../public/images/stressed.jpg";
import Img2 from "../../../../public/images/reliefii.jpg";
import FNFLogo from "../../../../public/logos/fnf_logo_black.png";
import { SolutionData } from "@/lib/data";
import Image from "next/image";

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
                <h2 className={`${styles.subHeading} h6`}>
                  The problems businesses face
                </h2>
              </div>
              <div className={styles.bottom}>
                {data.map((item) => (
                  <div key={item.id} className={styles.listItem}>
                    <p className={styles.desc}>{item.title}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className={styles.middle}></div>
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
                <h2 className={`${styles.subHeading} h6`}>
                  How do we solve them
                </h2>
              </div>
              <div className={styles.bottom}></div>
            </div>
          </div>
        </div>
      </LayoutWrapper>
    </section>
  );
}
