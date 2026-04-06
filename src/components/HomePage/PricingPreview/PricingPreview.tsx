import styles from "./PricingPreview.module.css";
import LayoutWrapper from "../../shared/LayoutWrapper";
import SectionIntro from "../../shared/SectionIntro/SectionIntro";
import Button from "../../shared/Button/Button";

const included = [
  "A website that closes corporate clients before you get on the phone",
  "A booking engine your clients actually complete — mobile, fast, no account required",
  "One dashboard for bookings, payments, drivers, and reporting",
  "Driver portal with push notifications — no calls to dispatch",
  "Customer portal with trip history, receipts, and saved addresses",
  "Corporate accounts with employee management and centralized billing",
  "Live flight tracking — drivers arrive when the passenger does",
  "Stripe payments — deposits, balances, tips, and refunds built in",
  "Automated emails and push notifications for every event",
  "Unlimited bookings. Unlimited drivers. Zero per-ride fees.",
];

const setupIncludes = [
  "Custom website designed and built for your brand",
  "Full platform configuration — services, vehicles, pricing, locations",
  "Stripe and domain integration",
  "Staff training walkthrough",
  "Launch support — we're with you on go-live day",
];

const notPaying = [
  "Per-booking fees",
  "Per-driver fees",
  "Seat-based pricing",
  "Fees for new features",
  "Long-term contracts — cancel anytime",
];

export default function PricingPreview() {
  return (
    <section className={styles.container}>
      <LayoutWrapper>
        <div className={styles.content}>
          <div className={styles.top}>
            <SectionIntro text='Pricing' />
            <h2 className={styles.heading}>
              One price. Everything included. Nothing held back.
            </h2>
            <p className={styles.copy}>
              One flat monthly rate for everything your black car business needs
              to look professional, operate efficiently, and keep every dollar
              it earns.
            </p>
          </div>
          <div className={styles.bottom}>
            <div className={styles.card}>
              <div className={styles.dot1} />
              <div className={styles.dot2} />
              <div className={styles.dot3} />
              <div className={styles.dot4} />
              <div className={styles.cardLeft}>
                <div className={styles.priceBlock}>
                  <span className={`${styles.price} h1`}>$499</span>
                  <span className={styles.pricePer}>/month</span>
                </div>
                <p className={styles.setupFee}>+ $500 one-time setup fee</p>

                <div className={styles.foundingBox}>
                  <p className={styles.foundingTitle}>Founding client rate</p>
                  <p className={styles.foundingCopy}>
                    The first operators who come onboard lock in $499/month for
                    life — including every feature added going forward. This
                    rate will not be available to future clients as the platform
                    grows.
                  </p>
                </div>

                <div className={styles.btnContainer}>
                  <Button
                    href='https://calendly.com/chris-fontsandfooters/30min'
                    target='_blank'
                    btnType='accent'
                    text='Book your discovery call'
                    arrow
                  />
                </div>
              </div>

              <div className={styles.cardRight}>
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
    </section>
  );
}
