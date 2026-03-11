import styles from "./PricingPreview.module.css";
import LayoutWrapper from "../../shared/LayoutWrapper";
import SectionIntro from "../../shared/SectionIntro/SectionIntro";
import Button from "../../shared/Button/Button";
const included = [
  "Custom website designed and built for your brand",
  "Full booking engine — multi-step, branded, mobile-optimized",
  "Admin dashboard with bookings, payments, drivers, and reporting",
  "Driver portal with push notifications and PWA access",
  "Customer portal with trip history, receipts, and saved addresses",
  "Corporate accounts with employee management and centralized billing",
  "Flight tracking via live aviation data",
  "Stripe payment processing — deposits, balances, tips, refunds",
  "Automated email and push notifications for every event",
  "Unlimited bookings. Unlimited drivers. No per-ride fees.",
];

const setupIncludes = [
  "Custom website designed and built for your brand",
  "Full platform configuration — services, vehicles, pricing, locations",
  "Stripe and domain integration",
  "Staff training walkthrough",
  "Launch support",
];

const notPaying = [
  "Per-booking fees",
  "Per-driver fees",
  "Seat-based pricing",
  "Upgrade fees for new features",
  "Long-term contracts — cancel anytime",
];

export default function PricingPreview() {
  return (
    <section className={styles.parent}>
      <div className={styles.container}>
        <div className={styles.cornerContainer}>
          <div className={styles.corner}>
            <SectionIntro text='Pricing' />
          </div>
        </div>
        <LayoutWrapper>
          <div className={styles.content}>
            <div className={styles.top}>
              <h2 className={styles.heading}>
                One plan. Everything included. No surprises.
              </h2>
            </div>
            <div className={styles.bottom}>
              {/* Main pricing card */}
              <div className={styles.card}>
                <div className={styles.cardLeft}>
                  {/* Price */}
                  <div className={styles.priceBlock}>
                    <span className={styles.price}>$499</span>
                    <span className={styles.pricePer}>/month</span>
                  </div>
                  <p className={styles.setupFee}>+ $500 one-time setup fee</p>

                  {/* Founding rate callout */}
                  <div className={styles.foundingBox}>
                    <p className={styles.foundingTitle}>Founding client rate</p>
                    <p className={styles.foundingCopy}>
                      The first operators who come onboard lock in $499/month
                      for life — including every feature we add going forward.
                      This rate will increase for future clients as the platform
                      grows.
                    </p>
                  </div>

                  <div className={styles.btnContainer}>
                    <Button
                      href='/contact'
                      btnType='accent'
                      text='Book your discovery call'
                      arrow
                    />
                  </div>
                </div>

                <div className={styles.cardRight}>
                  {/* What's included */}
                  <div className={styles.listBlock}>
                    <h3 className={styles.listHeading}>What&apos;s included</h3>
                    <ul className={styles.list}>
                      {included.map((item, i) => (
                        <li key={i} className={styles.listItem}>
                          <span className={styles.check}>✓</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className={styles.twoCol}>
                    {/* Setup includes */}
                    <div className={styles.listBlock}>
                      <h3 className={styles.listHeading}>Setup includes</h3>
                      <ul className={styles.list}>
                        {setupIncludes.map((item, i) => (
                          <li key={i} className={styles.listItem}>
                            <span className={styles.check}>✓</span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* What you don't pay for */}
                    <div className={styles.listBlock}>
                      <h3 className={styles.listHeading}>
                        What you don&apos;t pay for
                      </h3>
                      <ul className={styles.list}>
                        {notPaying.map((item, i) => (
                          <li key={i} className={styles.listItem}>
                            <span className={styles.cross}>✕</span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </LayoutWrapper>
      </div>
    </section>
  );
}
