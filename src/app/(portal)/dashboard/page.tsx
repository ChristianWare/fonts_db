/* eslint-disable @typescript-eslint/no-unused-vars */
import { getClientProfile } from "@/actions/client/getClientProfile";
import { auth } from "../../../../auth";
import styles from "./DashboardPage.module.css";
import Link from "next/link";
import { format } from "date-fns";

export default async function DashboardPage() {
  const session = await auth();
  const profile = await getClientProfile();

  const firstName = session?.user?.name?.split(" ")[0] ?? "there";
  const currentStage = profile?.onboardingStage ?? "REGISTERED";
  const isLive = currentStage === "SITE_LIVE";

  const serviceAgreementDoc = profile?.documents.find(
    (d) => d.type === "SERVICE_AGREEMENT" && d.status === "SIGNED",
  );

  const billingActive =
    profile?.subscription?.status === "ACTIVE" ||
    profile?.subscription?.status === "PAST_DUE";

  const questionnaireSubmitted = !!profile?.questionnaire?.submittedAt;

  const firstAsset =
    profile?.brandAssets && profile.brandAssets.length > 0
      ? profile.brandAssets.reduce((earliest, a) =>
          new Date(a.createdAt) < new Date(earliest.createdAt) ? a : earliest,
        )
      : null;

  const designReviewed = ["DESIGN_REVIEW", "SITE_LIVE"].includes(currentStage);

  const steps = [
    {
      key: "account",
      label: "Create Account",
      desc: "Your account is active and ready.",
      href: "/dashboard/profile",
      completed: true,
      completedAt: profile?.createdAt ? new Date(profile.createdAt) : null,
    },
    {
      key: "agreement",
      label: "Service Agreement",
      desc: "Review and sign your service agreement to get started.",
      href: "/dashboard/documents",
      completed: !!serviceAgreementDoc,
      completedAt: serviceAgreementDoc?.signedAt
        ? new Date(serviceAgreementDoc.signedAt)
        : null,
    },
    {
      key: "billing",
      label: "Billing Subscription",
      desc: "Set up your monthly subscription to activate your account.",
      href: "/dashboard/billing",
      completed: billingActive,
      completedAt:
        billingActive && profile?.subscription?.currentPeriodStart
          ? new Date(profile.subscription.currentPeriodStart)
          : null,
    },
    {
      key: "questionnaire",
      label: "Intake Questionnaire",
      desc: "Tell us about your business so we can build the right platform.",
      href: "/dashboard/questionnaire",
      completed: questionnaireSubmitted,
      completedAt: profile?.questionnaire?.submittedAt
        ? new Date(profile.questionnaire.submittedAt)
        : null,
    },
    {
      key: "assets",
      label: "Brand Assets",
      desc: "Upload your logo, photos, and brand files.",
      href: "/dashboard/assets",
      completed: !!firstAsset,
      completedAt: firstAsset ? new Date(firstAsset.createdAt) : null,
    },
    {
      key: "design",
      label: "Design Review",
      desc: "Review your design options and select the one that fits your brand.",
      href: "/dashboard/design-selection",
      completed: designReviewed,
      completedAt: null,
    },
    {
      key: "live",
      label: "Site Live",
      desc: "Your platform is live. Welcome aboard.",
      href: null,
      completed: isLive,
      completedAt: null,
    },
  ];

  const completedCount = steps.filter((s) => s.completed).length;

  // Sequential completion — connector is only black if all prior steps are done
  const sequentiallyComplete = steps.map((_step, index) =>
    steps.slice(0, index + 1).every((s) => s.completed),
  );

  const currentStepIndex = steps.findIndex((s) => !s.completed);
  const actionStep = currentStepIndex !== -1 ? steps[currentStepIndex] : null;

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <p className={styles.greeting}>Welcome back,</p>
          <h1 className={styles.heading}>{firstName}</h1>
          {profile?.businessName && (
            <p className={styles.businessName}>{profile.businessName}</p>
          )}
        </div>
        {isLive && (
          <div className={styles.liveBadge}>
            <span className={styles.liveDot} />
            Site Live
          </div>
        )}
      </div>

      {/* Action card */}
      {actionStep && actionStep.href && (
        <div className={styles.actionCard}>
          <div className={styles.actionCardLeft}>
            <span className={styles.actionLabel}>Next step</span>
            <p className={styles.actionText}>{actionStep.desc}</p>
          </div>
          <Link href={actionStep.href} className={styles.actionBtn}>
            {actionStep.label} →
          </Link>
        </div>
      )}

      {/* Progress tracker */}
      <div className={styles.trackerCard}>
        <div className={styles.trackerHeader}>
          <h2 className={styles.trackerHeading}>Onboarding Progress</h2>
          <span className={styles.trackerCount}>
            {completedCount} of {steps.length} complete
          </span>
        </div>

        <div className={styles.stages}>
          {steps.map((step, index) => {
            const isCompleted = step.completed;
            const isCurrent = index === currentStepIndex;
            const isUpcoming = !isCompleted && !isCurrent;

            const stageClass = `${styles.stage} ${
              isCompleted
                ? styles.stageCompleted
                : isCurrent
                  ? styles.stageCurrent
                  : styles.stageUpcoming
            } ${step.href ? styles.stageClickable : ""}`;

            const inner = (
              <>
                {/* Connector line */}
                {index < steps.length - 1 && (
                  <div
                    className={`${styles.connector} ${
                      sequentiallyComplete[index]
                        ? styles.connectorCompleted
                        : styles.connectorUpcoming
                    }`}
                  />
                )}

                {/* Dot */}
                <div className={styles.stageDot}>
                  {isCompleted ? (
                    <svg
                      width='12'
                      height='12'
                      viewBox='0 0 24 24'
                      fill='none'
                      stroke='currentColor'
                      strokeWidth='3'
                      strokeLinecap='round'
                      strokeLinejoin='round'
                    >
                      <polyline points='20 6 9 17 4 12' />
                    </svg>
                  ) : isCurrent ? (
                    <div className={styles.stageDotInner} />
                  ) : null}
                </div>

                {/* Text */}
                <div className={styles.stageText}>
                  <div className={styles.stageLabelRow}>
                    <span className={styles.stageLabel}>{step.label}</span>
                    {isCompleted && step.completedAt && (
                      <span className={styles.stageDate}>
                        {format(step.completedAt, "MMM d, yyyy")}
                      </span>
                    )}
                    {isCompleted && !step.completedAt && (
                      <span className={styles.stageDate}>Complete</span>
                    )}
                  </div>
                  <span className={styles.stageDesc}>{step.desc}</span>
                  {step.href && (
                    <span className={styles.moreInfo}>More info →</span>
                  )}
                </div>
              </>
            );

            // Every step with an href is a Link — no exceptions
            if (step.href) {
              return (
                <Link key={step.key} href={step.href} className={stageClass}>
                  {inner}
                </Link>
              );
            }

            return (
              <div key={step.key} className={stageClass}>
                {inner}
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick links — visible once site is live */}
      {isLive && (
        <div className={styles.quickLinks}>
          <Link href='/dashboard/change-requests' className={styles.quickLink}>
            <span className={styles.quickLinkLabel}>Request a change</span>
            <svg
              width='16'
              height='16'
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
          </Link>
          <Link href='/dashboard/billing' className={styles.quickLink}>
            <span className={styles.quickLinkLabel}>View invoices</span>
            <svg
              width='16'
              height='16'
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
          </Link>
          <Link href='/dashboard/support' className={styles.quickLink}>
            <span className={styles.quickLinkLabel}>Contact support</span>
            <svg
              width='16'
              height='16'
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
          </Link>
        </div>
      )}
    </div>
  );
}
