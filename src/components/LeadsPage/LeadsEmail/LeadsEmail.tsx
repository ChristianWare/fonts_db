import LayoutWrapper from "@/components/shared/LayoutWrapper";
import SectionIntro from "@/components/shared/SectionIntro/SectionIntro";
import styles from "./LeadsEmail.module.css";

const items = [
  {
    id: 1,
    feature: "Lead score",
    desc: "A 0–100 score on every lead, with a one-sentence explanation of why it earned that score.",
  },
  {
    id: 2,
    feature: "The opportunity",
    desc: "Event name or business name, with a direct link to the full intelligence brief waiting in your dashboard.",
  },
  {
    id: 3,
    feature: "The decision-maker",
    desc: "Who to contact — title, why they matter, and where to find them on LinkedIn.",
  },
  {
    id: 4,
    feature: "Why this one today",
    desc: "A strategic note specific to this prospect and category — so you know what makes this lead worth your morning.",
  },
];

export default function LeadsEmail() {
  return (
    <section className={styles.container}>
      <LayoutWrapper borderDark>
        <div className={styles.parent}>
          <div className={styles.dot1} />
          <div className={styles.dot2} />
          <div className={styles.dot3} />
          <div className={styles.dot4} />

          <div className={styles.content}>
            <SectionIntro
              text='Your morning digest'
              background='bgBlack'
              color='colorWhite'
            />
            <h2 className={styles.topHeading}>
              Open one email. Know exactly who to call today.
            </h2>

            <div className={styles.top}>
              <div className={styles.topLeft}>
                <h3 className={`${styles.heading} h6`}>
                  Every morning, your hot list and prospect digest land in your
                  inbox. Each lead shows the same four things — short enough to
                  scan in under a minute, complete enough to act on immediately.
                </h3>
              </div>
              <div className={styles.topRight} />
            </div>

            <div className={styles.bottom}>
              {items.map((x, i) => (
                <div key={x.id} className={`${styles.box} bgLines`}>
                  <span className={styles.index}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h4 className={styles.feature}>{x.feature}</h4>
                  <p className={styles.desc}>{x.desc}</p>
                </div>
              ))}
            </div>

            <div className={styles.outro}>
              <p className={styles.outroCopy}>
                The five that matter most are right there. Click any one to see
                the full brief, copy the outreach script, and start the
                conversation. No scrolling. No spreadsheets. No login required
                to see what your day looks like.
              </p>
            </div>
          </div>
        </div>
      </LayoutWrapper>
    </section>
  );
}
