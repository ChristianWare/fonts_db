import { redirect } from "next/navigation";
import { auth } from "../../../../../../auth";
import { db } from "@/lib/db";
import { getProductAccess } from "@/lib/subscriptions";
import styles from "./EnrollWebsitePage.module.css";

export const dynamic = "force-dynamic";

function formatCents(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

const CALENDLY_URL = "https://calendly.com/chris-fontsandfooters/30min";

const INCLUDED = [
  {
    title: "Direct booking engine",
    desc: "Clients book and pay on your site. No per-booking fees, no third-party platform taking a cut of every ride.",
  },
  {
    title: "Admin dashboard",
    desc: "Every booking, client, vehicle, and driver in one place. Built for how operators actually run the day.",
  },
  {
    title: "Driver portal",
    desc: "Drivers see their assignments, schedules, and trip details without calling you for the address again.",
  },
  {
    title: "Corporate accounts",
    desc: "House accounts, monthly invoicing, and the booking experience corporate travel coordinators expect.",
  },
];

const STEPS = [
  {
    num: "01",
    title: "Book a 30-minute call",
    desc: "I look at your current site and your operation. If it's not a fit, I'll say so — no pitch, no pressure.",
  },
  {
    num: "02",
    title: "Agreement + payment",
    desc: "If we move forward, your billing page unlocks. You pay the one-time setup fee and your subscription starts.",
  },
  {
    num: "03",
    title: "The build",
    desc: "Questionnaire, brand assets, design review — all tracked right here in your dashboard so you always know where things stand.",
  },
  {
    num: "04",
    title: "Launch",
    desc: "Your site goes live. The monthly covers hosting, maintenance, and change requests from then on.",
  },
];

export default async function EnrollWebsitePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const profile = await db.clientProfile.findUnique({
    where: { userId: session.user.id },
    select: {
      id: true,
      onboardingStage: true,
      setupFeePaid: true,
      setupFeeAmountCents: true,
      monthlyAmountCents: true,
    },
  });
  if (!profile) redirect("/dashboard");

  const access = await getProductAccess(profile.id);

  // Already an active/past-due website client — nothing to enroll in.
  if (access.hasWebsite) redirect("/dashboard/website");

  // Already in the onboarding flow with setup unpaid — their next step is
  // payment, and that lives on the billing page.
  if (profile.onboardingStage !== "REGISTERED" && !profile.setupFeePaid) {
    redirect("/dashboard/billing");
  }

  const setupFee = formatCents(profile.setupFeeAmountCents);
  const monthly = formatCents(profile.monthlyAmountCents);

  return (
    <div className={styles.page}>
      {/* ── Hero ── */}
      <div className={styles.hero}>
        <span className={styles.eyebrow}>Product 01 — Custom Website</span>
        <h1 className={styles.heading}>
          The platform that runs your whole black car business.
        </h1>
        <p className={styles.subheading}>
          A custom-built booking platform — not a template. {setupFee} one-time
          setup, then {monthly}/month. Cancel anytime.
        </p>
        <div className={styles.heroCtas}>
          <a
            href={CALENDLY_URL}
            target='_blank'
            rel='noopener noreferrer'
            className={styles.primaryCta}
          >
            Book a discovery call
            <svg
              width='14'
              height='14'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeWidth='2'
              strokeLinecap='round'
              strokeLinejoin='round'
            >
              <line x1='5' y1='12' x2='19' y2='12' />
              <polyline points='12 5 19 12 12 19' />
            </svg>
          </a>
            <a
            href='mailto:chris@fontsandfooters.com'
            className={styles.secondaryCta}
          >
            Or email me instead
          </a>
        </div>
      </div>

      {/* ── What's included ── */}
      <div className={styles.sectionHeader}>
        <span className={styles.sectionNumber}>01.</span>
        <h2 className={styles.sectionHeading}>What&apos;s Included</h2>
      </div>

      <div className={styles.includedGrid}>
        {INCLUDED.map((item, i) => (
          <div key={item.title} className={styles.includedCard}>
            <span className={styles.includedIndex}>
              {String(i + 1).padStart(2, "0")}
            </span>
            <h3 className={styles.includedTitle}>{item.title}</h3>
            <p className={styles.includedDesc}>{item.desc}</p>
          </div>
        ))}
      </div>

      <div className={styles.includedFootnote}>
        <p className={styles.footnoteText}>
          The {monthly}/month covers hosting, maintenance, and ongoing change
          requests — no surprise invoices for &quot;just one small edit.&quot;
        </p>
      </div>

      {/* ── How it works ── */}
      <div className={styles.sectionHeader}>
        <span className={styles.sectionNumber}>02.</span>
        <h2 className={styles.sectionHeading}>How Enrollment Works</h2>
      </div>

      <div className={styles.stepsGrid}>
        {STEPS.map((step) => (
          <div key={step.num} className={styles.stepCard}>
            <span className={styles.stepNum}>{step.num}</span>
            <h3 className={styles.stepTitle}>{step.title}</h3>
            <p className={styles.stepDesc}>{step.desc}</p>
          </div>
        ))}
      </div>

      {/* ── Bottom CTA ── */}
      <div className={styles.bottomCta}>
        <div className={styles.bottomCtaLeft}>
          <h2 className={styles.bottomCtaHeading}>
            Step one is a conversation.
          </h2>
          <p className={styles.bottomCtaText}>
            Thirty minutes. I&apos;ll look at what you&apos;re working with,
            tell you what it&apos;s costing you, and whether this platform is
            the right fix. If it isn&apos;t, I&apos;ll tell you that too.
          </p>
        </div>
        <a
          href={CALENDLY_URL}
          target='_blank'
          rel='noopener noreferrer'
          className={styles.primaryCta}
        >
          Book a discovery call
          <svg
            width='14'
            height='14'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
          >
            <line x1='5' y1='12' x2='19' y2='12' />
            <polyline points='12 5 19 12 12 19' />
          </svg>
        </a>
      </div>
    </div>
  );
}