import styles from "./LeadsVsList.module.css";
import LayoutWrapper from "@/components/shared/LayoutWrapper";
import XIcon from "@/components/shared/icons/XIcon/XIcon";
import SectionIntro from "@/components/shared/SectionIntro/SectionIntro";
import Check from "@/components/shared/Check/Check";
import Button from "@/components/shared/Button/Button";

const scrapedListItems = [
  {
    id: 1,
    title: "Business name",
    desc: "Just the name. No context, no reason this lead belongs on your radar today.",
  },
  {
    id: 2,
    title: "Address",
    desc: "Often outdated, sometimes wrong. Hope you weren't planning to mail anything important.",
  },
  {
    id: 3,
    title: "Phone number",
    desc: "Usually the front desk. They will not transfer you to the events coordinator.",
  },
  {
    id: 4,
    title: "Generic info@ email",
    desc: "Goes to a shared inbox nobody owns. Reply rate hovers around zero.",
  },
  {
    id: 5,
    title: "5,000 rows of noise",
    desc: "You'll spend 40 hours filtering. By then your competition has already booked the work.",
  },
];

const ourLeadsItems = [
  {
    id: 1,
    title: "AI-scored 0–100",
    desc: "Every lead scored and ranked with a one-sentence explanation for the score.",
  },
  {
    id: 2,
    title: "Decision-maker identified",
    desc: "The right person to call — title, why they matter, and a pre-built LinkedIn search link.",
  },
  {
    id: 3,
    title: "Outreach scripts ready",
    desc: "Personalized email, cold call, LinkedIn DM, and SMS — specific to each lead, not a template.",
  },
  {
    id: 4,
    title: "Competitive landscape check",
    desc: "We read their website and tell you if they already have a transportation partner.",
  },
  {
    id: 5,
    title: "Apollo-verified contacts",
    desc: "Verified email addresses pulled automatically the moment you save a lead to your pipeline.",
  },
];

export default function LeadsVsList() {
  return (
    <section className={styles.container}>
      <LayoutWrapper>
        <div className={styles.topContent}>
          <SectionIntro text='The difference' />
          <h2 className={`${styles.heading}`}>
            Typical scraped lists 
            <br />Vs Our Leads
          </h2>
          <p className={styles.intro}>
            Most lead services will sell you 5,000 names for $200. Here&apos;s
            what that actually buys you — and here&apos;s what we deliver
            instead.
          </p>
        </div>
        <div className={styles.content}>
          <div className={styles.left}>
            <div className={styles.leftList}>
              <div className={styles.top}>
                <SectionIntro
                  text='What $200 buys you'
                  background='bgBlack'
                  color='colorWhite'
                />
                <h2 className={`${styles.headingii} h5`}>
                  A typical scraped list
                </h2>
                <p className={styles.copy}>
                  Cheap, fast, and almost useless. The full inventory:
                </p>
              </div>
              <div className={styles.listWrapper}>
                {scrapedListItems.map((item) => (
                  <ul key={item.id} className={styles.listItems}>
                    <li className={`${styles.listItem} p`}>
                      <XIcon className={styles.icon} />
                      <div className={styles.listItemContent}>
                        <span className={styles.listItemTitle}>
                          {item.title}
                        </span>
                        <span className={styles.listItemDesc}>{item.desc}</span>
                      </div>
                    </li>
                  </ul>
                ))}
              </div>
              <p className={styles.recommendation}>
                <strong>The catch:</strong> contact info has never closed a deal
                on its own.
              </p>
            </div>
          </div>
          <div className={styles.middle}>
            <div className={styles.imgMiddleContainer}>
              <div className={styles.imgContainerMiddle} />
            </div>
            <span className={styles.middleText}>see the difference</span>
          </div>
          <div className={styles.right}>
            <div className={styles.rightList}>
              <div className={styles.top}>
                <SectionIntro text='What we deliver' />
                <h2 className={`${styles.headingii} h5`}>
                  Our leads, every morning
                </h2>
                <p className={styles.copy}>
                  Each lead arrives with everything you need to start the
                  conversation:
                </p>
              </div>
              <div className={styles.listWrapper}>
                {ourLeadsItems.map((item) => (
                  <ul key={item.id} className={styles.listItems}>
                    <li className={`${styles.listItem} p`}>
                      <Check className={styles.iconGood} />
                      <div className={styles.listItemContent}>
                        <span className={styles.listItemTitle}>
                          {item.title}
                        </span>
                        <span className={styles.listItemDesc}>{item.desc}</span>
                      </div>
                    </li>
                  </ul>
                ))}
              </div>
              <p className={styles.recommendation}>
                <strong>The result:</strong> opportunities, not addresses.
              </p>
            </div>
          </div>
        </div>
        <div className={styles.btnContainer}>
          <Button
            href='/dashboard'
            text='Start your trial'
            btnType='accent'
            arrow
          />
        </div>
      </LayoutWrapper>
    </section>
  );
}
