import styles from "./Features.module.css";
import Clock from "../../shared/Clock/Clock";
import Hosting from "../../shared/Hosting/Hosting";
import Analytics from "../../shared/icons/Analytics/Analytics";
import Design from "../../shared/icons/Design/Design";
import Edit from "../../shared/icons/Edit/Edit";
import Integration from "../../shared/icons/Integration/Integration";
import Money from "../../shared/icons/Money/Money";
import Multiple from "../../shared/icons/Multiple/Multiple";
import Payment from "../../shared/icons/Payment/Payment";
import Stariii from "../../shared/icons/Stariii/Stariii";
import LayoutWrapper from "../../shared/LayoutWrapper";
import SectionIntro from "../../shared/SectionIntro/SectionIntro";

type Feature = {
  icon: React.ReactNode;
  title: string;
};

const featureData: Feature[] = [
  {
    icon: <Design className={styles.icon} />,
    title: "Live Google Maps route & distance",
  },
  {
    icon: <Payment className={styles.icon} />,
    title: "Stripe payment processing payments",
  },
  {
    icon: <Clock className={styles.icon} />,
    title: "Flight tracking — auto-detects delays",
  },
  {
    icon: <Integration className={styles.icon} />,
    title: "Guest checkout — no account required",
  },
  {
    icon: <Multiple className={styles.icon} />,
    title: "Checkout Coupon & promo code support ",
  },
  {
    icon: <Hosting className={styles.icon} />,
    title: "Gratuidy selection options at checkout",
  },
  {
    icon: <Money className={styles.icon} />,
    title: "Deposit + balance payment links for clients",
  },
  {
    icon: <Stariii className={styles.icon} />,
    title: "Post-booking confirmation email",
  },
  {
    icon: <Analytics className={styles.icon} />,
    title: "Customer portal — manage upcoming trips",
  },
  {
    icon: <Edit className={styles.icon} />,
    title: "Fully mobile-optimized — under 3 minutes",
  },
];

export default function Features() {
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
              <SectionIntro text='Features' />
              <h2 className={styles.heading}>
              
                A reservation experience <br /> your riders will <span className={styles.accent}>actually trust</span>
              </h2>
              <p className={styles.copy}>
                The booking tool is where your business lives. We don&apos;t use
                an embedded third-party widget
                <span className={styles.accentii}>
                  — we build a fully custom, multi-step booking flow that&apos;s
                  integrated directly into your website and branded entirely to
                  your company. It looks and feels like yours, because it is.
                </span>
               
              </p>
            </div>
            <div className={styles.bottom}>
              <div className={styles.bottomLeft}></div>
              <div className={styles.bottomRight}></div>
              {/* <div className={styles.mapDataContainer}>
                {featureData.map((x) => (
                  <div className={styles.card} key={x.title}>
                    {x.icon}
                    <h3 className={styles.cardTitle}>{x.title}</h3>
                  </div>
                ))}
              </div> */}
            </div>
          </div>
        </div>
      </LayoutWrapper>
    </section>
  );
}
