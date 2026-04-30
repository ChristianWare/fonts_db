import LayoutWrapper from "@/components/shared/LayoutWrapper";
import styles from "./WebsiteOutcomes.module.css";
import SectionIntro from "@/components/shared/SectionIntro/SectionIntro";
import Multiple from "@/components/shared/icons/Multiple/Multiple";

const data = [
  {
    id: 1,
    title: "Stop paying fees on every booking",
    desc: "At 100 rides a month, you keep an extra $400–600. At 300 rides, over $1,800. Flat $499 — keep 100% of every booking, forever.",
    icon: <Multiple className={styles.icon} />,
  },
  {
    id: 2,
    title: "Look like the premium service you are",
    desc: "A custom-branded platform with a real booking engine signals a real operation. Executives, EAs, and event planners book with operators they trust.",
    icon: <Multiple className={styles.icon} />,
  },
  {
    id: 3,
    title: "Drivers know where to be, every time",
    desc: "No more phone calls about pickup times. Push notifications with full trip details. Real-time status updates visible from your dashboard.",
    icon: <Multiple className={styles.icon} />,
  },
  {
    id: 4,
    title: "Flight tracking handles itself",
    desc: "Customers enter the flight number. The platform pulls live aviation data and adjusts automatically for delays. Your driver arrives when the passenger does.",
    icon: <Multiple className={styles.icon} />,
  },
  {
    id: 5,
    title: "Corporate accounts that compound",
    desc: "One-click approval, centralized billing, employee-level invoices. The friction that kills corporate relationships disappears.",
    icon: <Multiple className={styles.icon} />,
  },
  {
    id: 6,
    title: "Your customer list is yours forever",
    desc: "Every booking, client, and payment lives in your dashboard. If you ever leave, you take it all with you — full data export, no friction.",
    icon: <Multiple className={styles.icon} />,
  },
];

export default function WebsiteOutcomes() {
  return (
    <section className={styles.parent}>
      <LayoutWrapper>
        <div className={styles.content}>
          <div className={styles.top}>
            <SectionIntro text='Outcomes' />
            <h2 className={styles.heading}>
              Six things that change the day you launch
            </h2>
            <p className={styles.copy}>
              We built our platform to solve the real problems operators face.{" "}
              <span className={styles.accent}>
                If that sounds good, you&apos;re in the right place.
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
                        Step #{index + 1} - Category
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
