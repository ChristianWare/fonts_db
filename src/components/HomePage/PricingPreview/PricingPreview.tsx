import styles from "./PricingPreview.module.css";
import LayoutWrapper from "../../shared/LayoutWrapper";
import SectionIntro from "../../shared/SectionIntro/SectionIntro";
import Button from "../../shared/Button/Button";

type Product = "website" | "leads" | "audit";

type ProductPricing = {
  heading: string;
  copy: string;
  price: string;
  pricePer: string;
  /** Sub-price line — setup fee for website, cancel terms for leads, delivery
   *  info for audit. Pass null to hide. */
  priceFootnote: string | null;
  showFoundingBox: boolean;
  foundingTitle?: string;
  foundingCopy?: string;
  ctaHref: string;
  ctaText: string;
  ctaTarget?: string;
  includedHeading: string;
  included: string[];
  setupIncludesHeading?: string;
  setupIncludes?: string[];
  notPayingHeading?: string;
  notPaying?: string[];
};

const PRICING_DATA: Record<Product, ProductPricing> = {
  website: {
    heading: "One price. Everything included. Nothing held back.",
    copy: "One flat monthly rate for everything your black car business needs to look professional, operate efficiently, and keep every dollar it earns.",
    price: "$499",
    pricePer: "/month",
    priceFootnote: "+ $500 one-time setup fee",
    showFoundingBox: true,
    foundingTitle: "Founding client rate",
    foundingCopy:
      "The first operators who come onboard lock in $499/month for life — including every feature added going forward. This rate will not be available to future clients as the platform grows.",
    ctaHref: "https://calendly.com/chris-fontsandfooters/30min",
    ctaTarget: "_blank",
    ctaText: "Book your discovery call",
    includedHeading: "What's included",
    included: [
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
    ],
    setupIncludesHeading: "Setup includes",
    setupIncludes: [
      "Custom website designed and built for your brand",
      "Full platform configuration — services, vehicles, pricing, locations",
      "Stripe and domain integration",
      "Staff training walkthrough",
      "Launch support — we're with you on go-live day",
    ],
    notPayingHeading: "What you don't pay for",
    notPaying: [
      "Per-booking fees",
      "Per-driver fees",
      "Seat-based pricing",
      "Fees for new features",
      "Long-term contracts — cancel anytime",
    ],
  },

  leads: {
    heading: "One price. Everything included. Cancel anytime.",
    copy: "Flat monthly pricing for the full leads intelligence stack — hot, warm, and cold prospects in your inbox every morning, with the dashboard built around closing them.",
    price: "$125",
    pricePer: "/month",
    priceFootnote: "Cancel anytime. No long-term commitment.",
    showFoundingBox: true,
    foundingTitle: "Founding operator rate",
    foundingCopy:
      "The first operators onboard lock in $125/month for life — including every category and intelligence layer added going forward. This rate will not be available to future clients as the lead pool and feature set grow.",
    ctaHref: "/dashboard",
    ctaText: "Start your trial",
    includedHeading: "What's included",
    included: [
      "Daily hot list and prospect digest delivered to your inbox",
      "Full dashboard with pipeline tracking and CRM",
      "AI strategic briefs tailored to each lead",
      "Decision-maker hypothesis with pre-built LinkedIn search links",
      "Personalized outreach scripts in four formats — email, call, LinkedIn, SMS",
      "Apollo-verified contact lookup on every saved lead",
      "Competitive landscape check on every cold lead",
      "Nine cold lead categories — wedding venues, hotels, casinos, and more",
      "Search up to 5 new markets per day, 15 per month",
      "Direct support from Chris — no help desk queues",
    ],
    setupIncludesHeading: "Onboarding includes",
    setupIncludes: [
      "Primary market configured and pre-scraped",
      "Service radius and category preferences locked in",
      "Walkthrough of your first three saved leads",
      "Pipeline import from your existing CRM if you have one",
      "Launch support — we'll help you plan the first week of outreach",
    ],
    notPayingHeading: "What you don't pay for",
    notPaying: [
      "Per-lead fees",
      "Per-market upcharges",
      "Apollo credit overage charges",
      "Fees for new categories as we add them",
      "Long-term contracts — cancel anytime",
    ],
  },

  audit: {
    heading: "Free. No credit card. No commitment.",
    copy: "Enter your URL and get a scored audit across six categories — page speed, booking capability, SEO, trust signals, tech stack, and brand design. PDF report emailed to you in 60 seconds.",
    price: "Free",
    pricePer: "",
    priceFootnote: "Result in 60 seconds. PDF emailed to you.",
    showFoundingBox: false,
    ctaHref: "#audit",
    ctaText: "Run your free audit",
    includedHeading: "What the audit checks",
    included: [
      "Six-category scored audit, emailed as a PDF",
      "Page speed and mobile performance benchmarks",
      "Booking flow check — quote, payment, mobile friction",
      "SEO and local visibility for your market",
      "Trust signal review — reviews, credentials, fleet imagery",
      "Tech stack analysis with platform-specific risks flagged",
      "Brand and conversion gap analysis",
      "Personalized fix recommendations for your specific domain",
      "No follow-up sequence unless you ask for one",
      "Result delivered in 60 seconds, no account required",
    ],
    // No setupIncludes, no notPaying — twoCol section is hidden for audit
  },
};

type Props = {
  product?: Product;
};

export default function PricingPreview({ product = "website" }: Props) {
  const data = PRICING_DATA[product];
  const hasTwoCol = Boolean(data.setupIncludes && data.notPaying);

  return (
    <section className={styles.container}>
      <LayoutWrapper>
        <div className={styles.content}>
          <div className={styles.top}>
            <SectionIntro text='Pricing' />
            <h2 className={styles.heading}>{data.heading}</h2>
            <p className={styles.copy}>{data.copy}</p>
          </div>
          <div className={styles.bottom}>
            <div className={styles.card}>
              <div className={styles.dot1} />
              <div className={styles.dot2} />
              <div className={styles.dot3} />
              <div className={styles.dot4} />
              <div className={styles.cardLeft}>
                <div className={styles.priceBlock}>
                  <span className={`${styles.price} h1`}>{data.price}</span>
                  {data.pricePer && (
                    <span className={styles.pricePer}>{data.pricePer}</span>
                  )}
                </div>
                {data.priceFootnote && (
                  <p className={styles.setupFee}>{data.priceFootnote}</p>
                )}

                {data.showFoundingBox &&
                  data.foundingTitle &&
                  data.foundingCopy && (
                    <div className={styles.foundingBox}>
                      <p className={styles.foundingTitle}>
                        {data.foundingTitle}
                      </p>
                      <p className={styles.foundingCopy}>{data.foundingCopy}</p>
                    </div>
                  )}

                <div className={styles.btnContainer}>
                  <Button
                    href={data.ctaHref}
                    btnType='accent'
                    text={data.ctaText}
                    arrow
                  />
                </div>
              </div>

              <div className={styles.cardRight}>
                <div className={styles.listBlock}>
                  <h3 className={styles.listHeading}>{data.includedHeading}</h3>
                  <ul className={styles.list}>
                    {data.included.map((item, i) => (
                      <li key={i} className={styles.listItem}>
                        <span className={styles.check}>✓</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                {hasTwoCol && (
                  <div className={styles.twoCol}>
                    <div className={styles.listBlock}>
                      <h3 className={styles.listHeading}>
                        {data.setupIncludesHeading ?? "Setup includes"}
                      </h3>
                      <ul className={styles.list}>
                        {data.setupIncludes!.map((item, i) => (
                          <li key={i} className={styles.listItem}>
                            <span className={styles.check}>✓</span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className={styles.listBlock}>
                      <h3 className={styles.listHeading}>
                        {data.notPayingHeading ?? "What you don't pay for"}
                      </h3>
                      <ul className={styles.list}>
                        {data.notPaying!.map((item, i) => (
                          <li key={i} className={styles.listItem}>
                            <span className={styles.cross}>✕</span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </LayoutWrapper>
    </section>
  );
}
