/* eslint-disable @typescript-eslint/no-unused-vars */
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

// const data = [
//   { id: 1, title: "Every booking costs you twice" },
//   { id: 2, title: "Your clients can't tell you apart" },
//   { id: 3, title: "You don't own the relationship" },
//   { id: 4, title: "Nothing changes unless they say so" },
//   { id: 5, title: "You're losing deals before hello" },
//   { id: 6, title: "Your operation runs on workarounds" },
// ];

const data = [
  {
    id: 1,
    title: "You're invisible when it matters most",
    desc: "When someone searches for black car service in your city, your competitors show up. You don't. The operators getting those calls aren't better than you — they're just more visible.",
    icon: <XIcon className={styles.icon} />,
  },
  {
    id: 2,
    title: "Your website isn't closing anyone",
    desc: "Even when people find you, your site isn't built to convert them. No instant quote, slow load time, doesn't work on mobile. They move on before they book.",
    icon: <XIcon className={styles.icon} />,
  },
  {
    id: 3,
    title: "You don't own your client relationships",
    desc: "Your booking history, customer data, and client list live on someone else's platform. If they change their terms, raise fees, or shut down — you start over with nothing.",
    icon: <XIcon className={styles.icon} />,
  },

  {
    id: 4,
    title: "No system for finding new accounts",
    desc: "There's no proactive process for reaching the hotels, venues, and corporate clients that should be sending you rides every month. Every new booking still feels like luck.",
    icon: <XIcon className={styles.icon} />,
  },
  {
    id: 5,
    title: "Every booking costs you twice",
    desc: "Once to run the ride, once to pay the platform. At $4–6 per booking you're writing a check to someone else every single day — with no ceiling on it.",
    icon: <XIcon className={styles.icon} />,
  },
  {
    id: 6,
    title: "Your operation runs on workarounds",
    desc: "Bookings in one app, drivers in another, payments somewhere else. Nothing talks to each other and things fall through during your busiest moments.",
    icon: <XIcon className={styles.icon} />,
  },
];

// const SolutionData = [
//   {
//     id: 1,
//     title: "Keep every dollar you earn",
//     icon: <FeesIcon className={styles.iconGood} />,
//   },
//   {
//     id: 2,
//     title: "Clients remember your name, not your software's",
//     icon: <Brand className={styles.iconGood} />,
//   },
//   {
//     id: 3,
//     title: "Your customer list is yours to keep",
//     icon: <Cloud className={styles.iconGood} />,
//   },
//   {
//     id: 4,
//     title: "Nothing changes unless you change it",
//     icon: <Rule className={styles.iconGood} />,
//   },
//   {
//     id: 5,
//     title: "Win corporate clients before they book",
//     icon: <NoControlii className={styles.iconGood} />,
//   },
//   {
//     id: 6,
//     title: "One place to run everything",
//     icon: <Platform className={styles.iconGood} />,
//   },
// ];

export default function ProblemSolution() {
  return (
    <section className={styles.container}>
      {/* <LayoutWrapper> */}
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
              {/* <h2 className={`${styles.subHeading} h2ii`}>
                  What&apos;s quietly costing you
                </h2> */}
              <h2 className={`${styles.headingii} h5`}>
                The six problems we see on almost every black car
                operator&apos;s business:
              </h2>
              <p className={styles.copy}>
                {/* You&apos;re running a premium operation — but your clients are
                  booking through the same generic interface as every budget
                  sedan in town. That disconnect costs you corporate contracts,
                  repeat business, and a cut of every ride. */}
                You&apos;re running a premium service, but you&apos;re still
                chasing bookings one at a time. You&apos;re not showing up when
                people search, your website isn&apos;t closing the ones who find
                you, and there&apos;s no real system for finding the corporate
                accounts that should be filling your calendar every month.
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
            we can help!
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
            <div className={styles.imgContainerRight}>
              <Image
                src={Img1}
                alt='Relieved person'
                title='Relieved person'
                fill
                className={styles.imgRight}
              />
            </div>
          </div>
        </div>
      </div>
      {/* </LayoutWrapper> */}
    </section>
  );
}
