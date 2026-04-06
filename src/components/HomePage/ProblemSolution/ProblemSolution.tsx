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
  { id: 1, title: "Every booking costs you twice" },
  { id: 2, title: "Your clients can't tell you apart" },
  { id: 3, title: "You don't own the relationship" },
  { id: 4, title: "Nothing changes unless they say so" },
  { id: 5, title: "You're losing deals before hello" },
  { id: 6, title: "Your operation runs on workarounds" },
];

const SolutionData = [
  {
    id: 1,
    title: "Keep every dollar you earn",
    icon: <FeesIcon className={styles.iconGood} />,
  },
  {
    id: 2,
    title: "Clients remember your name, not your software's",
    icon: <Brand className={styles.iconGood} />,
  },
  {
    id: 3,
    title: "Your customer list is yours to keep",
    icon: <Cloud className={styles.iconGood} />,
  },
  {
    id: 4,
    title: "Nothing changes unless you change it",
    icon: <Rule className={styles.iconGood} />,
  },
  {
    id: 5,
    title: "Win corporate clients before they book",
    icon: <NoControlii className={styles.iconGood} />,
  },
  {
    id: 6,
    title: "One place to run everything",
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
                <h2 className={`${styles.subHeading} h2ii`}>
                  What&apos;s quietly costing you
                </h2>
                <p className={styles.copy}>
                  You&apos;re running a premium operation — but your clients are
                  booking through the same generic interface as every budget
                  sedan in town. That disconnect costs you corporate contracts,
                  repeat business, and a cut of every ride.
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
                <h2 className={`${styles.subHeading} h2ii`}>
                  Here&apos;s what changes
                </h2>
                <p className={styles.copy}>
                  A fully custom platform built for your business — your brand,
                  your rules, your customers. We build it, you own it. Clients
                  never see our name.
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
