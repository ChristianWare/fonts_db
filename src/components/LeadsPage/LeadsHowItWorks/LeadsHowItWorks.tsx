import styles from "./LeadsHowItWorks.module.css";
import SectionIntro from "@/components/shared/SectionIntro/SectionIntro";
import LayoutWrapper from "@/components/shared/LayoutWrapper";

const data = [
  {
    id: 1,
    label: "Type 01 · Hot leads",
    title: "Events happening this week — first responder usually wins",
    desc: "From Eventbrite. Events in the next 14 days where the organizer is still finalizing logistics. Each one comes with the venue's verified contact, an AI-generated strategic brief, and a personalized outreach script ready to send.",
    icon: "🔥",
  },
  {
    id: 2,
    label: "Type 02 · Warm leads",
    title: "Events 2–13 weeks out — build, don't chase",
    desc: "From Eventbrite. Transportation hasn't been finalized and the organizer is still open to conversations. You have time to build the relationship, not just chase the booking. Pitched right, these become repeat business — not just single jobs.",
    icon: "🌡️",
  },
  {
    id: 3,
    label: "Type 03 · Cold leads",
    title: "Businesses that belong in your pipeline year-round",
    desc: "From Google Places. Wedding venues, hotels, law firms, country clubs, funeral homes, resort spas, event venues, casinos, and 55+ communities. Reach out to one a week, follow up quarterly, and watch what compounds over a year of consistent effort.",
    icon: "🧊",
  },
];

export default function LeadsHowItWorks() {
  return (
    <section className={styles.parent}>
      <LayoutWrapper>
        <div className={styles.content}>
          <div className={styles.top}>
            <SectionIntro text='How it works' />
            <h2 className={styles.heading}>
              Three lead temperatures. <br /> One workflow.
            </h2>
            <p className={styles.copy}>
              Most lead tools dump 200 generic contacts on you and call it a
              day.{" "}
              <span className={styles.accent}>
                Ours organizes leads by how fast you need to move — so you spend
                your morning on the ones that need a call today, not scrolling
                past 180 you&apos;ll never get to.
              </span>
            </p>
          </div>
          <div className={styles.bottom}>
            <div className={styles.mapDataContainer}>
              {data.map((item) => (
                <div key={item.id} className={styles.cardParent}>
                  <div className={styles.card}>
                    <div className={styles.cardTop}>
                      <span className={styles.step}>{item.label}</span>
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
