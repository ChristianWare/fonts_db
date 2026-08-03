import LayoutWrapper from "@/components/shared/LayoutWrapper";
import styles from "./AuditCards.module.css";
import SectionIntro from "@/components/shared/SectionIntro/SectionIntro";
import Multiple from "@/components/shared/icons/Multiple/Multiple";

const data = [
  {
    id: 1,
    title: "Lost bookings",
    desc: "Your estimated monthly bookings lost to slow load times, broken booking flows, and missing trust signals, turned into a real dollar figure.",
    icon: <Multiple className={styles.icon} />,
  },
  {
    id: 2,
    title: "Page performance",
    desc: "Core Web Vitals and mobile load times, scored against the operators you're actually competing with, plus the fixes that move revenue.",
    icon: <Multiple className={styles.icon} />,
  },
  {
    id: 3,
    title: "Booking friction",
    desc: "Where prospects drop off: quote, payment, mobile usability, and the account-required walls stopping them from finishing a booking.",
    icon: <Multiple className={styles.icon} />,
  },
  {
    id: 4,
    title: "Visibility & traffic",
    desc: "Your monthly traffic estimate, the keywords you already rank for, and the searches your competitors are capturing instead.",
    icon: <Multiple className={styles.icon} />,
  },
];

export default function AuditCards() {
  return (
    <section className={styles.parent}>
      <LayoutWrapper>
        <div className={styles.content}>
          <div className={styles.top}>
            <SectionIntro text='The report' />
            <h2 className={styles.heading}>
              What the audit actually tells you
            </h2>
            <p className={styles.copy}>
              Four things most operators are guessing about right now.{" "}
              <span className={styles.accent}>
                Sixty seconds and you stop guessing.
              </span>
            </p>
          </div>
          <div className={styles.bottom}>
            <div className={styles.mapDataContainer}>
              {data.map((item, index) => (
                <div key={item.id} className={styles.cardParent}>
                  <div className={styles.card}>
                    <div className={styles.cardTop}>
                      <span className={styles.step}>
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <div className={styles.iconContainer}>{item.icon}</div>
                    </div>
                    <div className={styles.cardBottom}>
                      <h3 className={`${styles.dataTitle} h6`}>{item.title}</h3>
                      <p className={styles.dataDesc}>{item.desc}</p>
                    </div>
                  </div>
                  <div className={styles.cardSpace} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </LayoutWrapper>
    </section>
  );
}
