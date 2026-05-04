// import { getClientProfile } from "@/actions/client/getClientProfile";
// import { getClientBlueprintStatus } from "@/actions/client/getClientBlueprintPages";
// import { auth } from "../../../../auth";
// import styles from "./DashboardPage.module.css";
// import Link from "next/link";
// import { format } from "date-fns";

// export default async function DashboardPage() {
//   const session = await auth();
//   const profile = await getClientProfile();
//   const blueprintStatus = await getClientBlueprintStatus();

//   const firstName = session?.user?.name?.split(" ")[0] ?? "there";
//   const currentStage = profile?.onboardingStage ?? "REGISTERED";
//   const isLive = currentStage === "SITE_LIVE";
//   const previewUrl = profile?.previewUrl ?? null;
//   const liveUrl = profile?.liveUrl ?? null;

//   const serviceAgreementDoc = profile?.documents.find(
//     (d) => d.type === "SERVICE_AGREEMENT" && d.status === "SIGNED",
//   );

//   const billingActive =
//     profile?.subscription?.status === "ACTIVE" ||
//     profile?.subscription?.status === "PAST_DUE";

//   const questionnaireSubmitted = !!profile?.questionnaire?.submittedAt;

//   const firstAsset =
//     profile?.brandAssets && profile.brandAssets.length > 0
//       ? profile.brandAssets.reduce((earliest, a) =>
//           new Date(a.createdAt) < new Date(earliest.createdAt) ? a : earliest,
//         )
//       : null;

//   const designReviewed = ["DESIGN_REVIEW", "SITE_LIVE"].includes(currentStage);
//   const buildingStarted = designReviewed;

//   // ── What we need from you ──────────────────────────────────────────────────
//   type ClientStep = {
//     key: string;
//     label: string;
//     desc: string;
//     href: string | null;
//     completed: boolean;
//     completedAt: Date | null;
//   };

//   const clientSteps: ClientStep[] = [
//     {
//       key: "account",
//       label: "Create Account",
//       desc: "Your account is active and ready.",
//       href: "/dashboard/profile",
//       completed: true,
//       completedAt: profile?.createdAt ? new Date(profile.createdAt) : null,
//     },
//     {
//       key: "agreement",
//       label: "Service Agreement",
//       desc: "Review and sign your service agreement to get started.",
//       href: "/dashboard/documents",
//       completed: !!serviceAgreementDoc,
//       completedAt: serviceAgreementDoc?.signedAt
//         ? new Date(serviceAgreementDoc.signedAt)
//         : null,
//     },
//     {
//       key: "billing",
//       label: "Enroll in Billing",
//       desc: "Set up your subscription and pay your one-time $500 setup fee.",
//       href: "/dashboard/billing",
//       completed: billingActive,
//       completedAt:
//         billingActive && profile?.subscription?.currentPeriodStart
//           ? new Date(profile.subscription.currentPeriodStart)
//           : null,
//     },
//     {
//       key: "questionnaire",
//       label: "Intake Questionnaire",
//       desc: "Tell us about your business so we can build the right platform.",
//       href: "/dashboard/questionnaire",
//       completed: questionnaireSubmitted,
//       completedAt: profile?.questionnaire?.submittedAt
//         ? new Date(profile.questionnaire.submittedAt)
//         : null,
//     },
//     {
//       key: "assets",
//       label: "Upload Brand Assets",
//       desc: "Upload your logo, fleet photos, and any existing brand files.",
//       href: "/dashboard/assets",
//       completed: !!firstAsset,
//       completedAt: firstAsset ? new Date(firstAsset.createdAt) : null,
//     },
//     {
//       key: "blueprint",
//       label: "Blueprint Approval",
//       desc: blueprintStatus.hasBlueprint
//         ? blueprintStatus.isFullyApproved
//           ? "Blueprint fully approved. We have everything we need to build."
//           : `Review and approve your website blueprint — ${blueprintStatus.approvedSections} of ${blueprintStatus.totalSections} sections approved.`
//         : "Once you complete your questionnaire, we'll prepare your website blueprint for your review.",
//       href: blueprintStatus.hasBlueprint ? "/dashboard/blueprint" : null,
//       completed: blueprintStatus.isFullyApproved,
//       completedAt: null,
//     },
//     {
//       key: "design",
//       label: "Design Review",
//       desc: "Review your design direction and give us your approval to build.",
//       href: "/dashboard/design-selection",
//       completed: designReviewed,
//       completedAt: null,
//     },
//   ];

//   // ── What you will get from us ──────────────────────────────────────────────
//   type DeliveryStep = {
//     key: string;
//     label: string;
//     desc: string;
//     href: string | null;
//     completed: boolean;
//     active: boolean;
//     previewUrl?: string | null;
//     liveUrl?: string | null;
//   };

//   const allClientDone = clientSteps.every((s) => s.completed);

//   const adminUploadedDocs =
//     profile?.documents.filter((d) => d.type !== "SERVICE_AGREEMENT") ?? [];
//   const hasAdditionalDocs = adminUploadedDocs.length > 0;

//   const deliverySteps: DeliveryStep[] = [
//     {
//       key: "blueprint",
//       label: "Website Blueprint",
//       desc: blueprintStatus.hasBlueprint
//         ? "Your sitemap and page-by-page copy plan is ready for review."
//         : "Once you complete your questionnaire, we'll publish your website blueprint.",
//       href: blueprintStatus.hasBlueprint ? "/dashboard/blueprint" : null,
//       completed: blueprintStatus.isFullyApproved,
//       active: blueprintStatus.hasBlueprint,
//     },
//     {
//       key: "preview",
//       label: "Preview Site Access",
//       desc: previewUrl
//         ? "Your build is in progress. Check back anytime to see the latest."
//         : buildingStarted
//           ? "We're setting up your preview environment now."
//           : "Once your design is approved, you'll get a live preview link as we build.",
//       href: null,
//       completed: isLive,
//       active: buildingStarted,
//       previewUrl: previewUrl,
//     },
//     {
//       key: "building",
//       label: "Platform Build",
//       desc: buildingStarted
//         ? "Your platform is actively being built — booking engine, admin dashboard, driver portal, and all integrations."
//         : "We'll begin your full platform build after design approval.",
//       href: null,
//       completed: isLive,
//       active: buildingStarted,
//     },
//     {
//       key: "live",
//       label: "Go Live",
//       desc: isLive
//         ? "Your platform is live and taking bookings."
//         : allClientDone
//           ? "You're almost there. We'll get you live once the build is complete."
//           : "Your site will go live once your build passes our QA checklist.",
//       href: null,
//       completed: isLive,
//       active: allClientDone,
//       liveUrl: liveUrl,
//     },
//     {
//       key: "additional-documents",
//       label: "Resources & Documents",
//       desc: hasAdditionalDocs
//         ? `${adminUploadedDocs.length} resource${adminUploadedDocs.length === 1 ? "" : "s"} available — including your brand identity brief, SEO checklist, content guide, and monthly performance reports.`
//         : isLive
//           ? "Your monthly performance report will appear here each month, alongside your SEO checklist and any other resources we share."
//           : "After launch we'll share your brand identity brief, SEO checklist, content guide, and monthly performance reports here.",
//       href: hasAdditionalDocs ? "/dashboard/documents" : null,
//       completed: false,
//       active: isLive || hasAdditionalDocs,
//     },
//   ];

//   // ── Action card logic ──────────────────────────────────────────────────────
//   const firstIncompleteClient = clientSteps.find((s) => !s.completed) ?? null;
//   const allClientComplete = clientSteps.every((s) => s.completed);

//   const completedClientCount = clientSteps.filter((s) => s.completed).length;
//   const completedDeliveryCount = deliverySteps.filter(
//     (s) => s.completed,
//   ).length;

//   const clientSequentiallyComplete = clientSteps.map((_, index) =>
//     clientSteps.slice(0, index + 1).every((s) => s.completed),
//   );
//   const deliverySequentiallyComplete = deliverySteps.map((_, index) =>
//     deliverySteps.slice(0, index + 1).every((s) => s.completed),
//   );

//   return (
//     <div className={styles.page}>
//       {/* ── Header ── */}
//       <div className={styles.header}>
//         <div className={styles.headerLeft}>
//           <p className={styles.greeting}>Welcome back,</p>
//           <h1 className={`${styles.heading} h2`}>{firstName}</h1>
//           {profile?.businessName && (
//             <p className={styles.businessName}>{profile.businessName}</p>
//           )}
//         </div>
//         {isLive && (
//           <div className={styles.liveBadge}>
//             <span className={styles.liveDot} />
//             Site Live
//           </div>
//         )}
//       </div>

//       {/* ── Action card — next client step ── */}
//       {firstIncompleteClient && firstIncompleteClient.href && (
//         <div className={styles.actionCard}>
//           <div className={styles.actionCardLeft}>
//             <span className={styles.actionLabel}>Action required</span>
//             <p className={styles.actionText}>{firstIncompleteClient.desc}</p>
//           </div>
//           <Link href={firstIncompleteClient.href} className={styles.actionBtn}>
//             {firstIncompleteClient.label} →
//           </Link>
//         </div>
//       )}

//       {/* ── Action card — all client steps done, building ── */}
//       {allClientComplete && !isLive && buildingStarted && (
//         <div className={styles.actionCard}>
//           <div className={styles.actionCardLeft}>
//             <span className={styles.actionLabel}>In progress</span>
//             <p className={styles.actionText}>
//               We have everything we need. Your platform is being built.
//             </p>
//           </div>
//           {previewUrl && (
//             <a
//               href={previewUrl}
//               target='_blank'
//               rel='noopener noreferrer'
//               className={styles.actionBtn}
//             >
//               See progress ↗
//             </a>
//           )}
//         </div>
//       )}

//       {/* ── Action card — site live ── */}
//       {isLive && liveUrl && (
//         <div className={styles.actionCard}>
//           <div className={styles.actionCardLeft}>
//             <span className={styles.actionLabel}>You are live</span>
//             <p className={styles.actionText}>
//               Your platform is live and ready to take bookings.
//             </p>
//           </div>
//           <a
//             href={liveUrl}
//             target='_blank'
//             rel='noopener noreferrer'
//             className={styles.actionBtn}
//           >
//             Visit your site ↗
//           </a>
//         </div>
//       )}

//       {/* ── Tracker ── */}
//       <div className={styles.trackerCard}>
//         {/* Section A — What we need from you */}
//         <div className={styles.trackerSection}>
//           <div className={styles.trackerSectionHeader}>
//             <div className={styles.trackerSectionHeadingBlock}>
//               <span className={styles.trackerSectionNumber}>01. </span>
//               <h2 className={styles.trackerSectionHeading}>
//                 What we need from you
//               </h2>
//             </div>
//             <span className={styles.trackerCount}>
//               {completedClientCount} of {clientSteps.length} complete
//             </span>
//           </div>

//           <div className={styles.stages}>
//             {clientSteps.map((step, index) => {
//               const currentStepIndex = clientSteps.findIndex(
//                 (s) => !s.completed,
//               );
//               const isCurrent = index === currentStepIndex;
//               const stageClass = `${styles.stage} ${
//                 step.completed
//                   ? styles.stageCompleted
//                   : isCurrent
//                     ? styles.stageCurrent
//                     : styles.stageUpcoming
//               } ${step.href ? styles.stageClickable : ""}`;

//               const inner = (
//                 <>
//                   {index < clientSteps.length - 1 && (
//                     <div
//                       className={`${styles.connector} ${
//                         clientSequentiallyComplete[index]
//                           ? styles.connectorCompleted
//                           : styles.connectorUpcoming
//                       }`}
//                     />
//                   )}
//                   <div className={styles.stageDot}>
//                     {step.completed ? (
//                       <svg
//                         width='12'
//                         height='12'
//                         viewBox='0 0 24 24'
//                         fill='none'
//                         stroke='currentColor'
//                         strokeWidth='3'
//                         strokeLinecap='round'
//                         strokeLinejoin='round'
//                       >
//                         <polyline points='20 6 9 17 4 12' />
//                       </svg>
//                     ) : isCurrent ? (
//                       <div className={styles.stageDotInner} />
//                     ) : null}
//                   </div>
//                   <div className={styles.stageText}>
//                     <div className={styles.stageLabelRow}>
//                       <span className={styles.stageLabel}>{step.label}</span>
//                       {step.completed && step.completedAt && (
//                         <span className={styles.stageDate}>
//                           {format(step.completedAt, "MMM d, yyyy")}
//                         </span>
//                       )}
//                       {step.completed && !step.completedAt && (
//                         <span className={styles.stageDate}>Complete</span>
//                       )}
//                       {/* Blueprint partial progress badge */}
//                       {step.key === "blueprint" &&
//                         !step.completed &&
//                         blueprintStatus.hasBlueprint &&
//                         blueprintStatus.totalSections > 0 && (
//                           <span className={styles.stageDateActive}>
//                             {blueprintStatus.approvedSections}/
//                             {blueprintStatus.totalSections} approved
//                           </span>
//                         )}
//                     </div>
//                     <span className={styles.stageDesc}>{step.desc}</span>
//                     {step.href && !step.completed && (
//                       <span className={styles.moreInfo}>
//                         Go to {step.label} →
//                       </span>
//                     )}
//                   </div>
//                 </>
//               );

//               if (step.href) {
//                 return (
//                   <Link key={step.key} href={step.href} className={stageClass}>
//                     {inner}
//                   </Link>
//                 );
//               }
//               return (
//                 <div key={step.key} className={stageClass}>
//                   {inner}
//                 </div>
//               );
//             })}
//           </div>
//         </div>

//         {/* Divider */}
//         <div className={styles.trackerDivider} />

//         {/* Section B — What you will get from us */}
//         <div className={styles.trackerSection}>
//           <div className={styles.trackerSectionHeader}>
//             <div className={styles.trackerSectionHeadingBlock}>
//               <span className={styles.trackerSectionNumber}>02. </span>
//               <h2 className={styles.trackerSectionHeading}>
//                 What you will get from us
//               </h2>
//             </div>
//             <span className={styles.trackerCount}>
//               {completedDeliveryCount} of {deliverySteps.length} complete
//             </span>
//           </div>

//           <div className={styles.stages}>
//             {deliverySteps.map((step, index) => {
//               const stageClass = `${styles.stage} ${
//                 step.completed
//                   ? styles.stageCompleted
//                   : step.active
//                     ? styles.stageCurrent
//                     : styles.stageUpcoming
//               } ${step.href ? styles.stageClickable : ""}`;

//               const inner = (
//                 <>
//                   {index < deliverySteps.length - 1 && (
//                     <div
//                       className={`${styles.connector} ${
//                         deliverySequentiallyComplete[index]
//                           ? styles.connectorCompleted
//                           : styles.connectorUpcoming
//                       }`}
//                     />
//                   )}
//                   <div className={styles.stageDot}>
//                     {step.completed ? (
//                       <svg
//                         width='12'
//                         height='12'
//                         viewBox='0 0 24 24'
//                         fill='none'
//                         stroke='currentColor'
//                         strokeWidth='3'
//                         strokeLinecap='round'
//                         strokeLinejoin='round'
//                       >
//                         <polyline points='20 6 9 17 4 12' />
//                       </svg>
//                     ) : step.active ? (
//                       <div className={styles.stageDotInner} />
//                     ) : null}
//                   </div>
//                   <div className={styles.stageText}>
//                     <div className={styles.stageLabelRow}>
//                       <span className={styles.stageLabel}>{step.label}</span>
//                       {step.completed && (
//                         <span className={styles.stageDate}>Complete</span>
//                       )}
//                       {!step.completed && step.active && (
//                         <span className={styles.stageDateActive}>
//                           {step.key === "additional-documents"
//                             ? hasAdditionalDocs
//                               ? `${adminUploadedDocs.length} available`
//                               : "Ongoing"
//                             : step.key === "blueprint" &&
//                                 blueprintStatus.hasBlueprint &&
//                                 !blueprintStatus.isFullyApproved
//                               ? `${blueprintStatus.approvedSections}/${blueprintStatus.totalSections} approved`
//                               : "In progress"}
//                         </span>
//                       )}
//                     </div>
//                     <span className={styles.stageDesc}>{step.desc}</span>

//                     {step.key === "blueprint" && step.href && (
//                       <Link href={step.href} className={styles.siteLink}>
//                         View your blueprint →
//                       </Link>
//                     )}

//                     {step.key === "preview" &&
//                       step.previewUrl &&
//                       !step.completed && (
//                         <a
//                           href={step.previewUrl}
//                           target='_blank'
//                           rel='noopener noreferrer'
//                           className={styles.siteLink}
//                         >
//                           See progress ↗
//                         </a>
//                       )}

//                     {step.key === "live" && step.liveUrl && step.completed && (
//                       <a
//                         href={step.liveUrl}
//                         target='_blank'
//                         rel='noopener noreferrer'
//                         className={styles.siteLink}
//                       >
//                         Visit your site ↗
//                       </a>
//                     )}

//                     {step.key === "additional-documents" && step.href && (
//                       <Link href={step.href} className={styles.siteLink}>
//                         View your documents →
//                       </Link>
//                     )}
//                   </div>
//                 </>
//               );

//               if (step.href) {
//                 return (
//                   <Link key={step.key} href={step.href} className={stageClass}>
//                     {inner}
//                   </Link>
//                 );
//               }
//               return (
//                 <div key={step.key} className={stageClass}>
//                   {inner}
//                 </div>
//               );
//             })}
//           </div>
//         </div>
//       </div>

//       {/* ── Quick links (post-live) ── */}
//       {isLive && (
//         <div className={styles.quickLinks}>
//           <Link href='/dashboard/change-requests' className={styles.quickLink}>
//             <span className={styles.quickLinkLabel}>Request a change</span>
//             <svg
//               width='16'
//               height='16'
//               viewBox='0 0 24 24'
//               fill='none'
//               stroke='currentColor'
//               strokeWidth='2'
//               strokeLinecap='round'
//               strokeLinejoin='round'
//             >
//               <line x1='5' y1='12' x2='19' y2='12' />
//               <polyline points='12 5 19 12 12 19' />
//             </svg>
//           </Link>
//           <Link href='/dashboard/billing' className={styles.quickLink}>
//             <span className={styles.quickLinkLabel}>View invoices</span>
//             <svg
//               width='16'
//               height='16'
//               viewBox='0 0 24 24'
//               fill='none'
//               stroke='currentColor'
//               strokeWidth='2'
//               strokeLinecap='round'
//               strokeLinejoin='round'
//             >
//               <line x1='5' y1='12' x2='19' y2='12' />
//               <polyline points='12 5 19 12 12 19' />
//             </svg>
//           </Link>
//           {liveUrl ? (
//             <a
//               href={liveUrl}
//               target='_blank'
//               rel='noopener noreferrer'
//               className={styles.quickLink}
//             >
//               <span className={styles.quickLinkLabel}>Visit your site</span>
//               <svg
//                 width='16'
//                 height='16'
//                 viewBox='0 0 24 24'
//                 fill='none'
//                 stroke='currentColor'
//                 strokeWidth='2'
//                 strokeLinecap='round'
//                 strokeLinejoin='round'
//               >
//                 <line x1='5' y1='12' x2='19' y2='12' />
//                 <polyline points='12 5 19 12 12 19' />
//               </svg>
//             </a>
//           ) : (
//             <Link href='/dashboard/support' className={styles.quickLink}>
//               <span className={styles.quickLinkLabel}>Contact support</span>
//               <svg
//                 width='16'
//                 height='16'
//                 viewBox='0 0 24 24'
//                 fill='none'
//                 stroke='currentColor'
//                 strokeWidth='2'
//                 strokeLinecap='round'
//                 strokeLinejoin='round'
//               >
//                 <line x1='5' y1='12' x2='19' y2='12' />
//                 <polyline points='12 5 19 12 12 19' />
//               </svg>
//             </Link>
//           )}
//         </div>
//       )}
//     </div>
//   );
// }

// "use client";

import { getClientProfile } from "@/actions/client/getClientProfile";
import { auth } from "../../../../auth";
import styles from "./DashboardPage.module.css";
import Link from "next/link";

// ── Mock subscription state — replace with real data later ──
// Same as the layout for now. Eventually pull from getClientProfile.
const MOCK_SUBSCRIPTIONS = {
  hasWebsite: true,
  hasLeads: false,
};

export default async function DashboardPage() {
  const session = await auth();
  const profile = await getClientProfile();

  const firstName = session?.user?.name?.split(" ")[0] ?? "there";
  const isLive = profile?.onboardingStage === "SITE_LIVE";
  const liveUrl = profile?.liveUrl ?? null;

  return (
    <div className={styles.page}>
      {/* ── Header ── */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <p className={styles.greeting}>Welcome back,</p>
          <h1 className={`${styles.heading} h2`}>{firstName}</h1>
          {profile?.businessName && (
            <p className={styles.businessName}>{profile.businessName}</p>
          )}
        </div>
      </div>

      {/* ── Section heading ── */}
      <div className={styles.sectionHeader}>
        <span className={styles.sectionNumber}>01.</span>
        <h2 className={styles.sectionHeading}>Your Products</h2>
      </div>

      {/* ── Two-card product overview ── */}
      <div className={styles.productGrid}>
        {/* WEBSITE CARD */}
        {MOCK_SUBSCRIPTIONS.hasWebsite ? (
          <Link href='/dashboard/website' className={styles.productCard}>
            <div className={styles.productCardTop}>
              <div className={styles.productStatus}>
                <span className={styles.statusDot} />
                <span className={styles.statusLabel}>
                  {isLive ? "Live" : "In Progress"}
                </span>
              </div>
              <span className={styles.productPrice}>$499/mo</span>
            </div>
            <div className={styles.productCardMain}>
              <span className={styles.productLabel}>Product 01</span>
              <h3 className={styles.productTitle}>Custom Website</h3>
              <p className={styles.productDesc}>
                {isLive
                  ? "Your platform is live and taking bookings."
                  : "Your platform is currently being built. Check your project status for next steps."}
              </p>
            </div>
            <div className={styles.productCardBottom}>
              <span className={styles.productCta}>
                Manage Website
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
              </span>
              {isLive && liveUrl && (
                <a
                  href={liveUrl}
                  target='_blank'
                  rel='noopener noreferrer'
                  // onClick={(e) => e.stopPropagation()}
                  className={styles.productSecondaryCta}
                >
                  Visit Site ↗
                </a>
              )}
            </div>
          </Link>
        ) : (
          <div className={`${styles.productCard} ${styles.productCardGhost}`}>
            <div className={styles.productCardTop}>
              <div className={styles.productStatus}>
                <span
                  className={`${styles.statusDot} ${styles.statusDotInactive}`}
                />
                <span className={styles.statusLabel}>Not Enrolled</span>
              </div>
              <span className={styles.productPrice}>$499/mo</span>
            </div>
            <div className={styles.productCardMain}>
              <span className={styles.productLabel}>Product 01</span>
              <h3 className={styles.productTitle}>Custom Website</h3>
              <p className={styles.productDesc}>
                A custom booking platform built for black car operators. Direct
                booking, no per-booking fees, flight tracking, driver portal —
                everything included.
              </p>
            </div>
            <div className={styles.productCardBottom}>
              <Link
                href='/dashboard/enroll/website'
                className={styles.productEnrollCta}
              >
                Get Started
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
              </Link>
            </div>
          </div>
        )}

        {/* LEADS CARD */}
        {MOCK_SUBSCRIPTIONS.hasLeads ? (
          <Link href='/dashboard/leads' className={styles.productCard}>
            <div className={styles.productCardTop}>
              <div className={styles.productStatus}>
                <span className={styles.statusDot} />
                <span className={styles.statusLabel}>Active</span>
              </div>
              <span className={styles.productPrice}>$125/mo</span>
            </div>
            <div className={styles.productCardMain}>
              <span className={styles.productLabel}>Product 02</span>
              <h3 className={styles.productTitle}>Leads Tool</h3>
              <p className={styles.productDesc}>
                Find your next corporate account before your competitor does.
                Hot, warm, and cold leads delivered to your dashboard daily.
              </p>
            </div>
            <div className={styles.productCardBottom}>
              <span className={styles.productCta}>
                Open Leads Tool
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
              </span>
            </div>
          </Link>
        ) : (
          <div className={`${styles.productCard} ${styles.productCardGhost}`}>
            <div className={styles.productCardTop}>
              <div className={styles.productStatus}>
                <span
                  className={`${styles.statusDot} ${styles.statusDotInactive}`}
                />
                <span className={styles.statusLabel}>Not Enrolled</span>
              </div>
              <span className={styles.productPrice}>$125/mo</span>
            </div>
            <div className={styles.productCardMain}>
              <span className={styles.productLabel}>Product 02</span>
              <h3 className={styles.productTitle}>Leads Tool</h3>
              <p className={styles.productDesc}>
                Find your next corporate account before your competitor does.
                Hot, warm, and cold leads delivered to your dashboard daily.
              </p>
            </div>
            <div className={styles.productCardBottom}>
              <Link
                href='/dashboard/enroll/leads'
                className={styles.productEnrollCta}
              >
                Get Started
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
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* ── Quick links ── */}
      <div className={styles.quickLinks}>
        <Link href='/dashboard/billing' className={styles.quickLink}>
          <span className={styles.quickLinkLabel}>Billing & Invoices</span>
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
          <span className={styles.quickLinkLabel}>Get Support</span>
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
        <Link href='/dashboard/profile' className={styles.quickLink}>
          <span className={styles.quickLinkLabel}>Account Profile</span>
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
    </div>
  );
}
