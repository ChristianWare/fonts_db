import Image, { StaticImageData } from "next/image";
import LayoutWrapper from "../../shared/LayoutWrapper";
import SectionIntro from "../../shared/SectionIntro/SectionIntro";
import styles from "./OtherDashboards.module.css";
// import LogoImg from "../../../../../public/logos/fnf_logo_black.png";
import DriverImg from "../../../../public/images/WhyWeExist.jpg";
import CustomerImg from "../../../../public/images/brandStoryii.jpg";
import CorporateImg from "../../../../public/images/whydb.jpg";
import Speedometer from "@/components/shared/icons/Speedometer/Speedometer";

type Card = {
  id: number;
  label: string;
  heading: string;
  body: string;
  highlights: string[];
  src: StaticImageData;
};

const cards: Card[] = [
  {
    id: 7,
    label: "For your drivers",
    heading: "Your drivers always know where to be.",
    body: "No more calls to relay trip details. Every driver gets their own portal — full schedule, passenger info, real-time updates, and earnings tracking, all from their phone.",
    highlights: [
      "Full trip schedule with pickup, drop-off, passenger, and flight info",
      "Real-time status updates — On the Way, Arrived, Onboard, Completed",
      "Earnings and tips tracking by period",
      "Push notifications for new assignments and cancellations",
      "PWA — works like a native app, no App Store download required",
    ],
    src: DriverImg,
  },
  {
    id: 8,
    label: "For your riders",
    heading: "The kind of experience that brings clients back.",
    body: "Every rider gets a branded customer portal under your name — past trips, receipts, saved addresses, and upcoming bookings. The experience that turns a one-time ride into a regular client.",
    highlights: [
      "View all upcoming and past trips with full details",
      "Download PDF receipts and invoices for any booking",
      "Save frequently used addresses for faster checkout",
      "Track upcoming trips and see real-time driver assignments",
      "Corporate clients can manage employee bookings and billing in one place",
    ],
    src: CustomerImg,
  },
  {
    id: 9,
    label: "Built for business clients",
    heading: "Land corporate contracts. Keep them.",
    body: "Corporate clients want centralized billing, employee controls, and a booking experience that feels built for business. Your platform gives them exactly that — from the first application to the hundredth ride.",
    highlights: [
      "Online application and one-click approval from your admin dashboard",
      "Centralized billing — track spend by employee or department",
      "Employee management — control who can book under the company account",
      "Dedicated booking page tailored for business travel",
      "Filter bookings and reports by corporate account as you scale",
    ],
    src: CorporateImg,
  },
];

export default function OtherDashboards() {
  return (
    <section className={styles.container}>
      <LayoutWrapper>
        <div className={styles.parent}>
          <div className={styles.content}>
            <div className={styles.top}>
              <div className={styles.topLeft}>
                <div className={styles.imagContainer}>
                  {/* <Image
                    src={LogoImg}
                    alt='Fonts & Footers Logo'
                    title='Fonts & Footers Logo'
                    className={styles.logo}
                  /> */}
                  <Speedometer className={styles.icon} />
                </div>
              </div>
              <div className={styles.topRight}>
                <SectionIntro text='Dashboards' />
                <h2 className={styles.heading}>
                  Built for every <br />
                  <span className={styles.accent}>role in the ride.</span>
                </h2>
                <p className={styles.copy}>
                  Your operators, drivers, riders, and corporate clients all
                  have different needs. Each gets their own dedicated space —
                  all under your brand, all connected to the same operation.
                </p>
              </div>
            </div>
            <div className={styles.bottom}>
              <div className={styles.mapDataContainer}>
                {cards.map((x) => (
                  <div className={styles.card} key={x.id}>
                    <div className={styles.cardTop}>
                      <span className={styles.label}>{x.label}</span>
                      <h3 className={styles.heading}>{x.heading}</h3>
                    </div>
                    <div className={styles.cardMiddle}>
                      <Image
                        src={x.src}
                        alt={x.heading}
                        fill
                        className={styles.img}
                      />{" "}
                    </div>
                    <div className={styles.cardBottom}>
                      <p className={styles.body}>{x.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </LayoutWrapper>
    </section>
  );
}
