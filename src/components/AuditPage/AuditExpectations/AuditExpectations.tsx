import styles from "./AuditExpectations.module.css";
import LayoutWrapper from "@/components/shared/LayoutWrapper";
import XIcon from "@/components/shared/icons/XIcon/XIcon";
import SectionIntro from "@/components/shared/SectionIntro/SectionIntro";
import Check from "@/components/shared/Check/Check";

const situationOne = [
  {
    id: 1,
    title: "Slow load times",
    desc: "Pages taking 4+ seconds to load — costing you visitors before they ever see your services.",
  },
  {
    id: 2,
    title: "Broken on mobile",
    desc: "60% of searches happen on phones. If your site fails there, you're losing the majority of your traffic.",
  },
  {
    id: 3,
    title: "Missing conversion elements",
    desc: "No instant quote, no clear booking CTA, no easy way for a visitor to actually become a customer.",
  },
  {
    id: 4,
    title: "Weak trust signals",
    desc: "Few reviews, no fleet photos, no professional credentials. Corporate clients won't book without these.",
  },
  {
    id: 5,
    title: "Invisible on Google",
    desc: "Title tags, meta descriptions, and local SEO signals all missing. You're not even getting the chance to be found.",
  },
];

const situationTwo = [
  {
    id: 1,
    title: "Strong technical foundation",
    desc: "Your site loads fast, works on mobile, and has the SEO basics in place. The infrastructure isn't the problem.",
  },
  {
    id: 2,
    title: "Reasonable conversion setup",
    desc: "Visitors who land on your site can find what they need and book without major friction.",
  },
  {
    id: 3,
    title: "Trust signals in place",
    desc: "Reviews, credentials, and fleet imagery are doing their job. First-time visitors take you seriously.",
  },
  {
    id: 4,
    title: "The bottleneck is traffic",
    desc: "If your site converts well but your calendar isn't full, you don't have a website problem — you have a pipeline problem.",
  },
  {
    id: 5,
    title: "What you need next",
    desc: "Proactive outreach to the venues, hotels, and corporate accounts that should be sending you traffic. That's where the lead tool comes in.",
  },
];

export default function AuditExpectations() {
  return (
    <section className={styles.container}>
      <LayoutWrapper>
        <div className={styles.topContent}>
          <SectionIntro text='What happens next' />
          <h2 className={`${styles.heading}`}>
            THE TWO TYPES <br /> OF RESULTS
          </h2>
          <p className={styles.intro}>
            Most operators land in one of two situations after running the
            audit. Either way, the audit removes the guesswork — you stop
            wondering and start knowing.
          </p>
        </div>
        <div className={styles.content}>
          <div className={styles.left}>
            <div className={styles.leftList}>
              <div className={styles.top}>
                <SectionIntro
                  text='Situation 01'
                  background='bgBlack'
                  color='colorWhite'
                />
                <h2 className={`${styles.headingii} h5`}>
                  Your site has serious issues
                </h2>
                <p className={styles.copy}>
                  If the audit flags multiple critical problems, your site is
                  actively working against you. Every visitor lost to a
                  competitor reinforces why fixing it matters. Common findings:
                </p>
              </div>
              <div className={styles.listWrapper}>
                {situationOne.map((item) => (
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
                <strong>Recommended next step:</strong> The website product is
                built to address all of these at once.
              </p>
            </div>
          </div>
          <div className={styles.middle}>
            <div className={styles.imgMiddleContainer}>
              <div className={styles.imgContainerMiddle} />
            </div>
            <span className={styles.middleText}>we can help!</span>
          </div>
          <div className={styles.right}>
            <div className={styles.rightList}>
              <div className={styles.top}>
                <SectionIntro text='Situation 02' />
                <h2 className={`${styles.headingii} h5`}>
                  Your site is performing reasonably well
                </h2>
                <p className={styles.copy}>
                  If your site scores well, the bottleneck isn&apos;t the
                  website. It&apos;s that not enough people are reaching it.
                  Common findings:
                </p>
              </div>
              <div className={styles.listWrapper}>
                {situationTwo.map((item) => (
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
                <strong>Recommended next step:</strong> The lead tool finds the
                businesses that should be sending you traffic.
              </p>
            </div>
          </div>
        </div>
      </LayoutWrapper>
    </section>
  );
}
