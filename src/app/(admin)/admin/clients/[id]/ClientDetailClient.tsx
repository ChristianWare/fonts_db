/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */
"use client";

import styles from "./ClientDetailClient.module.css";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { advanceClientStage } from "@/actions/admin/advanceClientStage";
import { getCloudinarySignature } from "@/actions/client/getCloudinarySignature";
import { uploadDocumentToClient } from "@/actions/admin/uploadDocumentToClient";
import { resolveQuestionnaireSections } from "@/lib/customQuestionnaire";
import { setCustomQuestionnaire } from "@/actions/admin/setCustomQuestionnaire";
import DesignOptionsTab from "./DesignOptionsTab";
import BlueprintTab from "./BlueprintTab";
import BillingRatesEditor from "@/components/admin/BillingRatesEditor/BillingRatesEditor";
import SiteUrlsEditor from "./SiteUrlsEditor";
import { deleteClient } from "@/actions/admin/deleteClient";
import { toggleStepOverride } from "@/actions/admin/toggleStepOverride";
import Button from "@/components/shared/Button/Button";
import toast from "react-hot-toast";

type OnboardingStage =
  | "REGISTERED"
  | "AGREEMENT_PENDING"
  | "AGREEMENT_SIGNED"
  | "QUESTIONNAIRE_PENDING"
  | "QUESTIONNAIRE_SUBMITTED"
  | "ASSETS_PENDING"
  | "ASSETS_UPLOADED"
  | "DESIGN_SELECTION"
  | "DESIGN_REVIEW"
  | "SITE_LIVE";

const stageLabels: Record<OnboardingStage, string> = {
  REGISTERED: "Registered",
  AGREEMENT_PENDING: "Agreement Pending",
  AGREEMENT_SIGNED: "Agreement Signed",
  QUESTIONNAIRE_PENDING: "Questionnaire Pending",
  QUESTIONNAIRE_SUBMITTED: "Questionnaire Submitted",
  ASSETS_PENDING: "Assets Pending",
  ASSETS_UPLOADED: "Assets Uploaded",
  DESIGN_SELECTION: "Design Selection",
  DESIGN_REVIEW: "Design Review",
  SITE_LIVE: "Site Live",
};

// Resources tab does NOT include SERVICE_AGREEMENT — that lives in its own tab
const resourceDocumentTypes = [
  { value: "DESIGN_APPROVAL", label: "Design Approval" },
  { value: "CONTENT_REVIEW", label: "Content Review" },
  { value: "GO_LIVE_CONFIRMATION", label: "Go-Live Confirmation" },
  { value: "OTHER", label: "Other" },
];

type ClientData = Awaited<
  ReturnType<typeof import("@/actions/admin/getClientById").getClientById>
>;

const LEADS_PRICE_CENTS = 12500;
const LEADS_TRIAL_DAYS = 7;

function formatCents(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

export default function ClientDetailClient({
  client,
}: {
  client: NonNullable<ClientData>;
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<
    | "overview"
    | "agreement"
    | "resources"
    | "questionnaire"
    | "assets"
    | "design"
    | "billing"
    | "blueprint"
  >("overview");

  const [isLive, setIsLive] = useState(client.onboardingStage === "SITE_LIVE");
  const [togglingLive, setTogglingLive] = useState(false);
  const [approving, setApproving] = useState(false);

  const [docTitle, setDocTitle] = useState("");
  const [docType, setDocType] = useState("DESIGN_APPROVAL");
  const [requiresSignature, setRequiresSignature] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [docError, setDocError] = useState<string | null>(null);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [questionnaireSkipped, setQuestionnaireSkipped] = useState(
    client.questionnaireSkipped,
  );
  const [assetsSkipped, setAssetsSkipped] = useState(client.assetsSkipped);

  // ── Custom questionnaire (per-client question set) ────────────────────────
  const questionsInputRef = useRef<HTMLInputElement>(null);
  const [uploadingQuestions, setUploadingQuestions] = useState(false);
  const [revertingQuestions, setRevertingQuestions] = useState(false);
  const [questionsError, setQuestionsError] = useState<string | null>(null);
  const customQuestionnaireRaw = (client as any).customQuestionnaire ?? null;
  const hasCustomQuestionnaire = !!customQuestionnaireRaw;
  const effectiveSections = resolveQuestionnaireSections(
    customQuestionnaireRaw,
  );
  const effectiveQuestionCount = effectiveSections.reduce(
    (n, s) => n + s.questions.length,
    0,
  );

  // Website is "approved" once the admin has advanced them past REGISTERED.
  // Before that, the only relevant action is approving them.
  const websiteApproved = client.onboardingStage !== "REGISTERED";

  const handleToggleLive = async () => {
    setTogglingLive(true);
    const targetStage: OnboardingStage = isLive ? "DESIGN_REVIEW" : "SITE_LIVE";
    const result = await advanceClientStage(client.id, targetStage);
    if (!result?.error) {
      setIsLive(!isLive);
      router.refresh();
    }
    setTogglingLive(false);
  };

  const handleApprove = async () => {
    setApproving(true);
    const result = await advanceClientStage(client.id, "AGREEMENT_PENDING");
    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success("Approved — billing unlocked for this client.");
      router.refresh();
    }
    setApproving(false);
  };

  const handleDocUpload = async (file: File) => {
    if (!docTitle.trim()) {
      setDocError("Please enter a document title before uploading.");
      return;
    }
    setDocError(null);
    setUploadingDoc(true);
    try {
      const folder = `fonts-and-footers/clients/${client.id}/documents`;
      const sigData = await getCloudinarySignature(folder);
      if ("error" in sigData) {
        setDocError("Failed to get upload signature.");
        setUploadingDoc(false);
        return;
      }
      const formData = new FormData();
      formData.append("file", file);
      formData.append("api_key", sigData.apiKey);
      formData.append("timestamp", String(sigData.timestamp));
      formData.append("signature", sigData.signature);
      formData.append("folder", folder);
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${sigData.cloudName}/auto/upload`,
        { method: "POST", body: formData },
      );
      const data = await response.json();
      if (!response.ok) {
        setDocError("Upload failed. Please try again.");
        setUploadingDoc(false);
        return;
      }
      const result = await uploadDocumentToClient({
        clientProfileId: client.id,
        title: docTitle,
        type: docType as any,
        fileUrl: data.secure_url,
        fileName: file.name,
        requiresSignature,
      });
      if (result?.error) {
        setDocError(result.error);
        setUploadingDoc(false);
        return;
      }
      setDocTitle("");
      router.refresh();
    } catch {
      setDocError("Something went wrong.");
    }
    setUploadingDoc(false);
  };

  const handleQuestionsUpload = async (file: File) => {
    setQuestionsError(null);
    setUploadingQuestions(true);
    try {
      const text = await file.text();
      let parsed: unknown;
      try {
        parsed = JSON.parse(text);
      } catch {
        setQuestionsError("That file isn't valid JSON.");
        setUploadingQuestions(false);
        return;
      }
      const result = await setCustomQuestionnaire({
        clientProfileId: client.id,
        sections: parsed,
      });
      if (result?.error) {
        setQuestionsError(result.error);
      } else {
        toast.success(
          `Custom questionnaire set — ${result.sectionCount} sections, ${result.questionCount} questions.`,
        );
        router.refresh();
      }
    } catch {
      setQuestionsError("Something went wrong.");
    }
    setUploadingQuestions(false);
  };

  const handleRevertQuestions = async () => {
    setRevertingQuestions(true);
    const result = await setCustomQuestionnaire({
      clientProfileId: client.id,
      sections: null,
    });
    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success("Reverted to the default questionnaire.");
      router.refresh();
    }
    setRevertingQuestions(false);
  };

  const downloadQuestionnaireTemplate = () => {
    const blob = new Blob([JSON.stringify(effectiveSections, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "questionnaire-template.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Derived state ─────────────────────────────────────────────────────────
  const serviceAgreementDoc = client.documents.find(
    (d) => d.type === "SERVICE_AGREEMENT" && d.status === "SIGNED",
  );
  const serviceAgreementAny = client.documents.find(
    (d) => d.type === "SERVICE_AGREEMENT",
  );
  const websiteSubscription =
    client.subscriptions.find((s) => s.productType === "WEBSITE") ?? null;
  const billingActive =
    websiteSubscription?.status === "ACTIVE" ||
    websiteSubscription?.status === "PAST_DUE";
  const questionnaireSubmitted = !!client.questionnaire?.submittedAt;
  const firstAsset =
    client.brandAssets.length > 0
      ? client.brandAssets.reduce((earliest, a) =>
          new Date(a.createdAt) < new Date(earliest.createdAt) ? a : earliest,
        )
      : null;
  const designReviewed = ["DESIGN_REVIEW", "SITE_LIVE"].includes(
    client.onboardingStage,
  );
  const buildingStarted = designReviewed;
  const hasPreviewUrl = !!client.previewUrl;
  const hasLiveUrl = !!client.liveUrl;
  const adminUploadedDocs = client.documents.filter(
    (d) => d.type !== "SERVICE_AGREEMENT",
  );
  const hasAdditionalDocs = adminUploadedDocs.length > 0;

  // ── Section 01 — What we need from the client ─────────────────────────────
  type ClientStep = {
    key: string;
    label: string;
    desc: string;
    completed: boolean;
    completedAt: Date | null;
    skippable?: boolean;
    skipped?: boolean;
    onSkip?: (val: boolean) => Promise<void>;
  };

  const clientSteps: ClientStep[] = [
    {
      key: "account",
      label: "Create Account",
      desc: "Account created and verified.",
      completed: true,
      completedAt: new Date(client.createdAt),
    },
    {
      key: "agreement",
      label: "Service Agreement",
      desc: serviceAgreementDoc
        ? "Client has signed the service agreement."
        : "Waiting on client signature.",
      completed: !!serviceAgreementDoc,
      completedAt: serviceAgreementDoc?.signedAt
        ? new Date(serviceAgreementDoc.signedAt)
        : null,
    },
    {
      key: "billing",
      label: "Billing Enrolled",
      desc: billingActive
        ? "Subscription active. Setup fee paid."
        : "Client has not yet enrolled in billing.",
      completed: billingActive,
      completedAt:
        billingActive && websiteSubscription?.createdAt
          ? new Date(websiteSubscription.createdAt)
          : null,
    },
    {
      key: "questionnaire",
      label: "Intake Questionnaire",
      desc: questionnaireSubmitted
        ? "Questionnaire submitted."
        : questionnaireSkipped
          ? "Marked complete manually."
          : "Waiting on client to submit.",
      completed: questionnaireSubmitted || questionnaireSkipped,
      completedAt: client.questionnaire?.submittedAt
        ? new Date(client.questionnaire.submittedAt)
        : null,
      skippable: !questionnaireSubmitted,
      skipped: questionnaireSkipped,
      onSkip: async (val: boolean) => {
        setQuestionnaireSkipped(val);
        await toggleStepOverride(client.id, "questionnaireSkipped", val);
        router.refresh();
      },
    },
    {
      key: "assets",
      label: "Brand Assets",
      desc: firstAsset
        ? `${client.brandAssets.filter((a) => a.label !== "DESIGN_OPTION").length} file(s) uploaded.`
        : assetsSkipped
          ? "Marked complete manually."
          : "Waiting on client to upload files.",
      completed: !!firstAsset || assetsSkipped,
      completedAt: firstAsset ? new Date(firstAsset.createdAt) : null,
      skippable: !firstAsset,
      skipped: assetsSkipped,
      onSkip: async (val: boolean) => {
        setAssetsSkipped(val);
        await toggleStepOverride(client.id, "assetsSkipped", val);
        router.refresh();
      },
    },
    {
      key: "design",
      label: "Design Selection",
      desc: designReviewed
        ? "Client has approved their design direction."
        : "Waiting on client design approval.",
      completed: designReviewed,
      completedAt: null,
    },
  ];

  // ── Section 02 — What we deliver ──────────────────────────────────────────
  type DeliveryStep = {
    key: string;
    label: string;
    desc: string;
    completed: boolean;
    active: boolean;
  };

  const allClientDone = clientSteps.every((s) => s.completed);

  const deliverySteps: DeliveryStep[] = [
    {
      key: "blueprint",
      label: "Website Blueprint",
      desc: questionnaireSubmitted
        ? "Questionnaire received. Publish the sitemap and copy plan to the client portal."
        : "Available once client submits their questionnaire.",
      completed: questionnaireSubmitted && hasPreviewUrl,
      active: questionnaireSubmitted,
    },
    {
      key: "preview",
      label: "Preview Site Link",
      desc: hasPreviewUrl
        ? `Preview URL is live: ${client.previewUrl}`
        : buildingStarted
          ? "Set the preview URL so the client can track progress."
          : "Set once build has started.",
      completed: hasPreviewUrl,
      active: buildingStarted,
    },
    {
      key: "building",
      label: "Platform Build",
      desc: isLive
        ? "Build complete."
        : buildingStarted
          ? "Build is in progress — booking engine, admin dashboard, driver portal, integrations."
          : "Begins after design is approved.",
      completed: isLive,
      active: buildingStarted,
    },
    {
      key: "live",
      label: "Go Live",
      desc: isLive
        ? hasLiveUrl
          ? `Live at: ${client.liveUrl}`
          : "Site is live. Add the live URL in the URLs section below."
        : allClientDone
          ? "All client steps complete. Toggle live once QA is done."
          : "Waiting on client checklist to be complete.",
      completed: isLive,
      active: allClientDone,
    },
    {
      key: "additional-documents",
      label: "Resources & Documents",
      desc: hasAdditionalDocs
        ? `${adminUploadedDocs.length} resource${adminUploadedDocs.length === 1 ? "" : "s"} uploaded — brand identity brief, SEO checklist, content guide, monthly reports, and any other files shared with this client.`
        : isLive
          ? "No resources uploaded yet. Upload docs from the Resources tab — they'll appear in the client's portal immediately."
          : "After launch, upload monthly reports, the SEO checklist, brand brief, and content guide here.",
      completed: false,
      active: isLive || hasAdditionalDocs,
    },
  ];

  const completedClientCount = clientSteps.filter((s) => s.completed).length;
  const completedDeliveryCount = deliverySteps.filter(
    (s) => s.completed,
  ).length;

  const clientSequentiallyComplete = clientSteps.map((_, i) =>
    clientSteps.slice(0, i + 1).every((s) => s.completed),
  );
  const deliverySequentiallyComplete = deliverySteps.map((_, i) =>
    deliverySteps.slice(0, i + 1).every((s) => s.completed),
  );

  const selectedDesign =
    (client.brandAssets as any[]).find((a) => a.selected === true) ?? null;

  const answers = client.questionnaire?.answers as Record<string, any> | null;

  const tabs = [
    { key: "overview", label: "Overview" },
    { key: "agreement", label: "Agreement" },
    { key: "resources", label: "Resources" },
    { key: "blueprint", label: "Blueprint" },
    { key: "questionnaire", label: "Questionnaire" },
    { key: "assets", label: "Assets" },
    { key: "design", label: "Design" },
    { key: "billing", label: "Billing" },
  ] as const;

  // Reusable cards available in both pre- and post-approval states
  const clientInfoCard = (
    <div className={styles.card}>
      <h3 className={styles.cardHeading}>Client Information</h3>
      <div className={styles.infoGrid}>
        <div className={styles.infoRow}>
          <span className={styles.infoLabel}>Name</span>
          <span className={styles.infoValue}>{client.user.name}</span>
        </div>
        <div className={styles.infoRow}>
          <span className={styles.infoLabel}>Email</span>
          <span className={styles.infoValue}>{client.user.email}</span>
        </div>
        <div className={styles.infoRow}>
          <span className={styles.infoLabel}>Business</span>
          <span className={styles.infoValue}>{client.businessName}</span>
        </div>
        {client.city && (
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Location</span>
            <span className={styles.infoValue}>
              {client.city}
              {client.state ? `, ${client.state}` : ""}
            </span>
          </div>
        )}
        {client.phone && (
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Phone</span>
            <span className={styles.infoValue}>{client.phone}</span>
          </div>
        )}
        <div className={styles.infoRow}>
          <span className={styles.infoLabel}>Client since</span>
          <span className={styles.infoValue}>
            {format(new Date(client.createdAt), "MMMM d, yyyy")}
          </span>
        </div>
      </div>
    </div>
  );

  const billingRatesCard = (
    <div className={styles.card}>
      <BillingRatesEditor
        clientProfileId={client.id}
        setupFeeAmountCents={client.setupFeeAmountCents}
        monthlyAmountCents={client.monthlyAmountCents}
        setupFeePaid={client.setupFeePaid}
      />
    </div>
  );

  const dangerCard = (
    <div className={styles.card} style={{ borderColor: "#fed7d7" }}>
      <h3
        className={styles.cardHeading}
        style={{ backgroundColor: "#c53030", color: "#fff" }}
      >
        Danger Zone
      </h3>
      <div className={styles.infoRow}>
        <div
          style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}
        >
          <span className={styles.liveToggleLabel}>Delete this client</span>
          <span className={styles.liveToggleDesc}>
            Permanently deletes the client, all documents, assets, invoices, and
            their user account. This cannot be undone.
          </span>
        </div>
        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            style={{
              flexShrink: 0,
              padding: "1rem 2rem",
              border: "1px solid #c53030",
              background: "none",
              color: "#c53030",
              fontFamily: "var(--GeistMono)",
              fontSize: "1.4rem",
              textTransform: "uppercase",
              letterSpacing: "0.07em",
              cursor: "pointer",
            }}
          >
            Delete client
          </button>
        ) : (
          <div style={{ display: "flex", gap: "1rem", flexShrink: 0 }}>
            <button
              onClick={() => setShowDeleteConfirm(false)}
              style={{
                padding: "1rem 2rem",
                border: "1px solid var(--lightGray)",
                background: "none",
                color: "var(--text)",
                fontFamily: "var(--GeistMono)",
                fontSize: "1.4rem",
                textTransform: "uppercase",
                letterSpacing: "0.07em",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              onClick={async () => {
                setDeleting(true);
                await deleteClient(client.id);
              }}
              disabled={deleting}
              style={{
                padding: "1rem 2rem",
                border: "none",
                background: "#c53030",
                color: "#fff",
                fontFamily: "var(--GeistMono)",
                fontSize: "1.4rem",
                textTransform: "uppercase",
                letterSpacing: "0.07em",
                cursor: deleting ? "not-allowed" : "pointer",
                opacity: deleting ? 0.5 : 1,
              }}
            >
              {deleting ? "Deleting..." : "Yes, delete"}
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className={styles.page}>
      {/* ── Header ── */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <button onClick={() => router.back()} className={styles.backBtn}>
            ← Clients
          </button>
          <div className={styles.clientMeta}>
            <div className={styles.clientAvatar}>
              {(client.user.name ?? "?")[0].toUpperCase()}
            </div>
            <div>
              <h1 className={`${styles.heading} h2`}>{client.businessName}</h1>
              <p className={styles.clientEmail}>{client.user.email}</p>
            </div>
          </div>
        </div>
        <div className={styles.stageBadge}>
          {stageLabels[client.onboardingStage as OnboardingStage]}
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className={styles.tabs}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={`${styles.tab} ${activeTab === tab.key ? styles.tabActive : ""}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
            {tab.key === "design" && selectedDesign && (
              <span className={styles.tabDot} />
            )}
            {tab.key === "agreement" && serviceAgreementAny && (
              <span
                className={`${styles.tabDot} ${serviceAgreementDoc ? styles.tabDotGreen : styles.tabDotAmber}`}
              />
            )}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW TAB ─────────────────────────────────────────────────── */}
      {activeTab === "overview" && (
        <div className={styles.tabContent}>
          {!websiteApproved ? (
            /* ── PRE-APPROVAL: approve + set rates + info + danger ── */
            <>
              <div
                className={styles.card}
                style={{ borderColor: "var(--black)" }}
              >
                <h3 className={styles.cardHeading}>
                  Approve for Website Product
                </h3>
                <p className={styles.cardDesc}>
                  This client hasn&apos;t been approved for the website product
                  yet. Had the discovery call and want to move forward? Set
                  their rates in Billing Rates below first (
                  {`$${(client.setupFeeAmountCents / 100).toLocaleString()}`}{" "}
                  setup /{" "}
                  {`$${(client.monthlyAmountCents / 100).toLocaleString()}`}/mo
                  currently) — rates lock in when they pay. Approving advances
                  them to Agreement Pending and unlocks the setup-fee checkout
                  on their billing page.
                </p>
                <Button
                  onClick={handleApprove}
                  text={approving ? "Approving..." : "Approve & unlock billing"}
                  btnType='accent'
                  disabled={approving}
                  arrow
                />
              </div>

              {billingRatesCard}
              {clientInfoCard}
              {dangerCard}
            </>
          ) : (
            /* ── POST-APPROVAL: full onboarding tracker ── */
            <>
              <div className={styles.trackerCard}>
                {/* Section 01 */}
                <div className={styles.trackerSection}>
                  <div className={styles.trackerSectionHeader}>
                    <div className={styles.trackerSectionHeadingBlock}>
                      <span className={styles.trackerSectionNumber}>01.</span>
                      <h3 className={styles.trackerSectionHeading}>
                        What we need from the client
                      </h3>
                    </div>
                    <span className={styles.trackerCount}>
                      {completedClientCount} of {clientSteps.length} complete
                    </span>
                  </div>

                  <div className={styles.stages}>
                    {clientSteps.map((step, index) => {
                      const isCurrent =
                        !step.completed &&
                        clientSteps.slice(0, index).every((s) => s.completed);

                      return (
                        <div
                          key={step.key}
                          className={`${styles.stage} ${
                            step.completed
                              ? styles.stageCompleted
                              : isCurrent
                                ? styles.stageCurrent
                                : styles.stageUpcoming
                          }`}
                        >
                          {index < clientSteps.length - 1 && (
                            <div
                              className={`${styles.connector} ${
                                clientSequentiallyComplete[index]
                                  ? styles.connectorCompleted
                                  : styles.connectorUpcoming
                              }`}
                            />
                          )}
                          <div className={styles.stageDot}>
                            {step.completed ? (
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
                          <div className={styles.stageText}>
                            <div className={styles.stageLabelRow}>
                              <span className={styles.stageLabel}>
                                {step.label}
                              </span>
                              {step.completed && step.completedAt && (
                                <span className={styles.stageDate}>
                                  {format(step.completedAt, "MMM d, yyyy")}
                                </span>
                              )}
                              {step.completed && !step.completedAt && (
                                <span className={styles.stageDate}>
                                  Complete
                                </span>
                              )}
                              {!step.completed && isCurrent && (
                                <span className={styles.stageDatePending}>
                                  Pending
                                </span>
                              )}
                            </div>
                            <span className={styles.stageDesc}>
                              {step.desc}
                            </span>
                            {step.skippable && (
                              <label className={styles.skipLabel}>
                                <input
                                  type='checkbox'
                                  className={styles.skipCheckbox}
                                  checked={step.skipped ?? false}
                                  onChange={(e) =>
                                    step.onSkip?.(e.target.checked)
                                  }
                                />
                                <span className={styles.skipText}>
                                  Mark as complete (override)
                                </span>
                              </label>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className={styles.trackerDivider} />

                {/* Section 02 */}
                <div className={styles.trackerSection}>
                  <div className={styles.trackerSectionHeader}>
                    <div className={styles.trackerSectionHeadingBlock}>
                      <span className={styles.trackerSectionNumber}>02.</span>
                      <h3 className={styles.trackerSectionHeading}>
                        What we deliver
                      </h3>
                    </div>
                    <span className={styles.trackerCount}>
                      {completedDeliveryCount} of {deliverySteps.length}{" "}
                      complete
                    </span>
                  </div>

                  <div className={styles.stages}>
                    {deliverySteps.map((step, index) => (
                      <div
                        key={step.key}
                        className={`${styles.stage} ${
                          step.completed
                            ? styles.stageCompleted
                            : step.active
                              ? styles.stageCurrent
                              : styles.stageUpcoming
                        }`}
                      >
                        {index < deliverySteps.length - 1 && (
                          <div
                            className={`${styles.connector} ${
                              deliverySequentiallyComplete[index]
                                ? styles.connectorCompleted
                                : styles.connectorUpcoming
                            }`}
                          />
                        )}
                        <div className={styles.stageDot}>
                          {step.completed ? (
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
                          ) : step.active ? (
                            <div className={styles.stageDotInner} />
                          ) : null}
                        </div>
                        <div className={styles.stageText}>
                          <div className={styles.stageLabelRow}>
                            <span className={styles.stageLabel}>
                              {step.label}
                            </span>
                            {step.completed && (
                              <span className={styles.stageDate}>Complete</span>
                            )}
                            {!step.completed && step.active && (
                              <span className={styles.stageDateActive}>
                                {step.key === "additional-documents"
                                  ? hasAdditionalDocs
                                    ? `${adminUploadedDocs.length} uploaded`
                                    : "Action needed"
                                  : "Action needed"}
                              </span>
                            )}
                          </div>
                          <span className={styles.stageDesc}>{step.desc}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className={styles.toggleDivider} />
                  <div className={styles.liveToggleRow}>
                    <div className={styles.liveToggleLeft}>
                      <span className={styles.liveToggleLabel}>
                        Mark site as live
                      </span>
                      <span className={styles.liveToggleDesc}>
                        {isLive
                          ? "Site is currently live. Toggle off to revert to Design Review."
                          : "Toggle on once the client's site has been launched and QA'd."}
                      </span>
                    </div>
                    <button
                      className={`${styles.toggle} ${isLive ? styles.toggleOn : styles.toggleOff}`}
                      onClick={handleToggleLive}
                      disabled={togglingLive}
                      aria-label='Toggle site live'
                    >
                      <span className={styles.toggleThumb} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Stage history */}
              {client.stageLog.length > 0 && (
                <div className={styles.card}>
                  <h3 className={styles.cardHeading}>Stage History</h3>
                  <div className={styles.stageLog}>
                    {client.stageLog.map((log) => (
                      <div key={log.id} className={styles.stageLogEntry}>
                        <span className={styles.stageLogText}>
                          {stageLabels[log.fromStage as OnboardingStage]} →{" "}
                          {stageLabels[log.toStage as OnboardingStage]}
                        </span>
                        <span className={styles.stageLogMeta}>
                          {log.changedBy?.name ?? "Admin"} ·{" "}
                          {format(new Date(log.createdAt), "MMM d, yyyy")}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {clientInfoCard}
              {billingRatesCard}

              <div className={styles.card}>
                <SiteUrlsEditor
                  clientProfileId={client.id}
                  previewUrl={client.previewUrl ?? null}
                  liveUrl={client.liveUrl ?? null}
                />
              </div>

              {dangerCard}
            </>
          )}
        </div>
      )}

      {/* ── AGREEMENT TAB ────────────────────────────────────────────────── */}
      {activeTab === "agreement" && (
        <div className={styles.tabContent}>
          <div className={styles.card}>
            <h3 className={styles.cardHeading}>Service Agreement</h3>
            {!serviceAgreementAny ? (
              <p className={styles.emptyText}>
                No service agreement has been sent to this client yet. Upload
                one from the legacy documents flow or send it via your signing
                tool.
              </p>
            ) : (
              <div className={styles.docList}>
                <div className={styles.docRow}>
                  <div className={styles.docInfo}>
                    <span className={styles.docTitle}>
                      {serviceAgreementAny.title}
                    </span>
                    <span className={styles.docMeta}>
                      {serviceAgreementAny.status === "SIGNED"
                        ? `Signed ${format(new Date(serviceAgreementAny.signedAt!), "MMMM d, yyyy")}`
                        : serviceAgreementAny.status === "PENDING_SIGNATURE"
                          ? "Sent — awaiting client signature"
                          : "Uploaded — no signature required"}
                    </span>
                  </div>
                  <div className={styles.docActions}>
                    {serviceAgreementAny.status === "SIGNED" && (
                      <span className={styles.signedBadge}>✓ Signed</span>
                    )}
                    {serviceAgreementAny.status === "PENDING_SIGNATURE" && (
                      <span className={styles.pendingBadge}>Pending</span>
                    )}
                    <a
                      href={serviceAgreementAny.fileUrl}
                      target='_blank'
                      rel='noopener noreferrer'
                      className={styles.downloadBtn}
                    >
                      ↓ Download
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── RESOURCES TAB ────────────────────────────────────────────────── */}
      {activeTab === "resources" && (
        <div className={styles.tabContent}>
          <div className={styles.card}>
            <h3 className={styles.cardHeading}>Upload Resource</h3>
            <p className={styles.cardDesc}>
              Upload brand guides, SEO checklists, monthly reports, content
              guides, and any other files for this client. These appear in their
              portal under Resources & Documents.
            </p>
            <div className={styles.uploadForm}>
              <div className={styles.uploadRow}>
                <input
                  type='text'
                  className={styles.input}
                  placeholder='Document title'
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                />
                <select
                  className={styles.select}
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                >
                  {resourceDocumentTypes.map((dt) => (
                    <option key={dt.value} value={dt.value}>
                      {dt.label}
                    </option>
                  ))}
                </select>
              </div>
              <label className={styles.checkboxLabel}>
                <input
                  type='checkbox'
                  checked={requiresSignature}
                  onChange={(e) => setRequiresSignature(e.target.checked)}
                  className={styles.checkbox}
                />
                <span className={styles.checkboxText}>
                  Requires client signature
                </span>
              </label>
              {docError && <div className={styles.errorBanner}>{docError}</div>}
              <input
                ref={fileInputRef}
                type='file'
                className={styles.hiddenInput}
                accept='.pdf,.doc,.docx'
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleDocUpload(file);
                  e.target.value = "";
                }}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className={styles.uploadBtn}
                disabled={uploadingDoc}
              >
                {uploadingDoc ? "Uploading..." : "Choose file & upload"}
              </button>
            </div>
          </div>

          <div className={styles.card}>
            <h3 className={styles.cardHeading}>
              Uploaded Resources ({adminUploadedDocs.length})
            </h3>
            {adminUploadedDocs.length === 0 ? (
              <p className={styles.emptyText}>No resources uploaded yet.</p>
            ) : (
              <div className={styles.docList}>
                {adminUploadedDocs.map((doc) => (
                  <div key={doc.id} className={styles.docRow}>
                    <div className={styles.docInfo}>
                      <span className={styles.docTitle}>{doc.title}</span>
                      <span className={styles.docMeta}>
                        {doc.type.replace(/_/g, " ")} ·{" "}
                        {doc.status === "SIGNED"
                          ? `Signed ${format(new Date(doc.signedAt!), "MMM d, yyyy")}`
                          : doc.status === "PENDING_SIGNATURE"
                            ? "Awaiting signature"
                            : "Uploaded"}
                        {" · "}
                        {format(new Date(doc.createdAt), "MMM d, yyyy")}
                      </span>
                    </div>
                    <a
                      href={doc.fileUrl}
                      target='_blank'
                      rel='noopener noreferrer'
                      className={styles.viewBtn}
                    >
                      View
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── BLUEPRINT TAB ────────────────────────────────────────────────── */}
      {activeTab === "blueprint" && (
        <div className={styles.tabContent}>
          <div
            className={styles.card}
            style={{ padding: 0, overflow: "hidden" }}
          >
            <div style={{ padding: "3rem 3rem 2rem" }}>
              <h3 className={styles.cardHeading}>Website Blueprint</h3>
              <p className={styles.cardDesc} style={{ marginTop: "1.2rem" }}>
                Build the sitemap and copy plan for this client. Each page and
                section can be drafted, sent for review, and approved. The
                client sees this in their portal under Website Blueprint.
              </p>
            </div>
            <BlueprintTab
              clientId={client.id}
              initialPages={(client as any).sitemapPages ?? []}
            />
          </div>
        </div>
      )}

      {/* ── QUESTIONNAIRE TAB ────────────────────────────────────────────── */}
      {activeTab === "questionnaire" && (
        <div className={styles.tabContent}>
          <div className={styles.card}>
            <h3 className={styles.cardHeading}>Question Set</h3>
            <p className={styles.cardDesc}>
              {hasCustomQuestionnaire
                ? `This client has a custom questionnaire — ${effectiveSections.length} section${effectiveSections.length === 1 ? "" : "s"}, ${effectiveQuestionCount} questions. Upload a new JSON file to replace it, or revert to the default black car set.`
                : "This client sees the default black car questionnaire. Upload a JSON file of custom questions to replace it for this client only — useful for clients outside the black car space."}
            </p>
            {client.questionnaire?.submittedAt && (
              <p className={styles.cardDesc} style={{ color: "#c05621" }}>
                Heads up: this client already submitted answers. If you replace
                the questions, answers to removed questions will still be kept
                and shown under &ldquo;Other Answers&rdquo; below.
              </p>
            )}
            {questionsError && (
              <div className={styles.errorBanner}>{questionsError}</div>
            )}
            <input
              ref={questionsInputRef}
              type='file'
              className={styles.hiddenInput}
              accept='.json,application/json'
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleQuestionsUpload(file);
                e.target.value = "";
              }}
            />
            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
              <button
                onClick={() => questionsInputRef.current?.click()}
                className={styles.uploadBtn}
                disabled={uploadingQuestions}
              >
                {uploadingQuestions
                  ? "Uploading..."
                  : hasCustomQuestionnaire
                    ? "Replace custom questions (.json)"
                    : "Upload custom questions (.json)"}
              </button>
              <button
                onClick={downloadQuestionnaireTemplate}
                className={styles.uploadBtn}
                disabled={uploadingQuestions}
              >
                Download current set as template
              </button>
              {hasCustomQuestionnaire && (
                <button
                  onClick={handleRevertQuestions}
                  className={styles.uploadBtn}
                  disabled={revertingQuestions}
                >
                  {revertingQuestions ? "Reverting..." : "Revert to default"}
                </button>
              )}
            </div>
          </div>

          <div className={styles.card}>
            <h3 className={styles.cardHeading}>Questionnaire Responses</h3>
            {!client.questionnaire ? (
              <p className={styles.emptyText}>
                Client has not submitted the questionnaire yet.
              </p>
            ) : !client.questionnaire.submittedAt ? (
              <p className={styles.emptyText}>
                Client has started but not yet submitted the questionnaire.
              </p>
            ) : (
              <p className={styles.submittedDate}>
                Submitted{" "}
                {format(
                  new Date(client.questionnaire.submittedAt),
                  "MMMM d, yyyy 'at' h:mm a",
                )}
              </p>
            )}
          </div>

          {client.questionnaire?.submittedAt &&
            answers &&
            effectiveSections.map((section) => {
              const sectionAnswers = section.questions.filter(
                (q) =>
                  answers[q.id] !== undefined &&
                  answers[q.id] !== "" &&
                  !(
                    Array.isArray(answers[q.id]) &&
                    (answers[q.id] as string[]).length === 0
                  ),
              );
              if (sectionAnswers.length === 0) return null;
              return (
                <div key={section.title} className={styles.card}>
                  <h3 className={styles.cardHeading}>{section.title}</h3>
                  <div className={styles.answerList}>
                    {sectionAnswers.map((q) => {
                      const val = answers[q.id];
                      return (
                        <div key={q.id} className={styles.answerRow}>
                          <span className={styles.answerKey}>{q.label}</span>
                          <span className={styles.answerValue}>
                            {Array.isArray(val) ? val.join(", ") : val}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

          {client.questionnaire?.submittedAt &&
            answers &&
            (() => {
              const knownIds = new Set(
                effectiveSections.flatMap((s) => s.questions.map((q) => q.id)),
              );
              const orphaned = Object.entries(answers).filter(
                ([id, val]) =>
                  !knownIds.has(id) &&
                  val !== "" &&
                  !(Array.isArray(val) && (val as string[]).length === 0),
              );
              if (orphaned.length === 0) return null;
              return (
                <div className={styles.card}>
                  <h3 className={styles.cardHeading}>Other Answers</h3>
                  <p className={styles.cardDesc}>
                    Answers to questions that are no longer part of this
                    client&apos;s questionnaire.
                  </p>
                  <div className={styles.answerList}>
                    {orphaned.map(([id, val]) => (
                      <div key={id} className={styles.answerRow}>
                        <span className={styles.answerKey}>{id}</span>
                        <span className={styles.answerValue}>
                          {Array.isArray(val) ? val.join(", ") : String(val)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
        </div>
      )}

      {/* ── ASSETS TAB ───────────────────────────────────────────────────── */}
      {activeTab === "assets" && (
        <div className={styles.tabContent}>
          <div className={styles.card}>
            {(() => {
              const clientAssets = client.brandAssets.filter(
                (a) => a.label !== "DESIGN_OPTION",
              );
              return (
                <>
                  <h3 className={styles.cardHeading}>
                    Brand Assets ({clientAssets.length})
                  </h3>
                  {clientAssets.length === 0 ? (
                    <p className={styles.emptyText}>
                      Client has not uploaded any assets yet.
                    </p>
                  ) : (
                    <div className={styles.assetList}>
                      {clientAssets.map((asset) => (
                        <div key={asset.id} className={styles.assetRow}>
                          <div className={styles.assetInfo}>
                            <span className={styles.assetName}>
                              {asset.fileName}
                            </span>
                            <span className={styles.assetMeta}>
                              {asset.label} ·{" "}
                              {format(new Date(asset.createdAt), "MMM d, yyyy")}
                            </span>
                          </div>
                          <a
                            href={asset.fileUrl}
                            target='_blank'
                            rel='noopener noreferrer'
                            className={styles.viewBtn}
                          >
                            View
                          </a>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* ── DESIGN TAB ───────────────────────────────────────────────────── */}
      {activeTab === "design" && (
        <div className={styles.tabContent}>
          {selectedDesign ? (
            <div className={styles.card}>
              <div className={styles.selectionHeader}>
                <div className={styles.selectionHeader}>
                  <h3 className={styles.cardHeading}>
                    Client&apos;s Selection
                  </h3>
                  <p className={styles.cardDesc}>
                    {client.user.name?.split(" ")[0]} has chosen the following
                    design.
                  </p>
                </div>
                <span className={styles.selectionBadge}>✓ Choice made</span>
              </div>
              <div className={styles.selectionBody}>
                <div className={styles.selectionThumb}>
                  <img
                    src={selectedDesign.fileUrl}
                    alt={selectedDesign.templateName ?? "Selected design"}
                    className={styles.selectionThumbImg}
                  />
                  <a
                    href={selectedDesign.fileUrl}
                    target='_blank'
                    rel='noopener noreferrer'
                    className={styles.selectionViewBtn}
                  >
                    View full design ↗
                  </a>
                </div>
                <div className={styles.selectionMeta}>
                  {selectedDesign.templateName && (
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Template</span>
                      <span className={styles.infoValue}>
                        {selectedDesign.templateName}
                      </span>
                    </div>
                  )}
                  {selectedDesign.sourceUrl && (
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Source</span>
                      <a
                        href={selectedDesign.sourceUrl}
                        target='_blank'
                        rel='noopener noreferrer'
                        className={styles.infoLink}
                      >
                        View template →
                      </a>
                    </div>
                  )}
                  {selectedDesign.clientNotes ? (
                    <div className={styles.selectionNotesBlock}>
                      <span className={styles.infoLabel}>Client notes</span>
                      <p className={styles.selectionNotesText}>
                        {selectedDesign.clientNotes}
                      </p>
                    </div>
                  ) : (
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Client notes</span>
                      <span
                        className={styles.infoValue}
                        style={{ color: "var(--gray)" }}
                      >
                        None provided
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className={styles.card}>
              <h3 className={styles.cardHeading}>Client&apos;s Selection</h3>
              <p className={styles.emptyText}>
                The client has not selected a design yet.
              </p>
            </div>
          )}
          <DesignOptionsTab clientId={client.id} assets={client.brandAssets} />
        </div>
      )}

      {/* ── BILLING TAB (website only) ─────────────────────────────────── */}
      {activeTab === "billing" && (
        <div className={styles.tabContent}>
          {(() => {
            const sub =
              client.subscriptions.find((s) => s.productType === "WEBSITE") ??
              null;
            const isActive = sub?.status === "ACTIVE";
            const isPastDue = sub?.status === "PAST_DUE";
            const isCancelled = sub?.status === "CANCELLED";
            const isPaid = (sub?.planAmountCents ?? 0) > 0;

            const statusText = !sub
              ? "Not Enrolled"
              : isActive
                ? "Active"
                : isPastDue
                  ? "Past Due"
                  : isCancelled
                    ? "Cancelled"
                    : sub.status === "PAUSED"
                      ? "Paused"
                      : sub.status;

            const priceText = !sub
              ? `${formatCents(client.monthlyAmountCents)}/mo`
              : `${formatCents(sub.planAmountCents)}/mo`;

            return (
              <div className={styles.card}>
                <h3 className={styles.cardHeading}>Custom Website</h3>
                <div className={styles.infoGrid}>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Status</span>
                    <span className={styles.infoValue}>
                      {statusText}
                      {sub?.cancelAtPeriodEnd ? " (cancelling)" : ""}
                    </span>
                  </div>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Plan</span>
                    <span className={styles.infoValue}>{priceText}</span>
                  </div>

                  {sub?.cancelAtPeriodEnd && sub.currentPeriodEnd && (
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Access until</span>
                      <span className={styles.infoValue}>
                        {format(new Date(sub.currentPeriodEnd), "MMMM d, yyyy")}
                      </span>
                    </div>
                  )}

                  {sub && !sub.cancelAtPeriodEnd && sub.currentPeriodEnd && (
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>
                        {isActive ? "Next billing date" : "Period ended"}
                      </span>
                      <span className={styles.infoValue}>
                        {format(new Date(sub.currentPeriodEnd), "MMMM d, yyyy")}
                      </span>
                    </div>
                  )}

                  {sub?.billingAnchorDate &&
                    !isCancelled &&
                    !sub.cancelAtPeriodEnd && (
                      <div className={styles.infoRow}>
                        <span className={styles.infoLabel}>Billing day</span>
                        <span className={styles.infoValue}>
                          Day {sub.billingAnchorDate} of each month
                        </span>
                      </div>
                    )}

                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Setup fee</span>
                    <span className={styles.infoValue}>
                      {client.setupFeePaid ? "Paid" : "Not yet paid"}
                    </span>
                  </div>

                  {isCancelled && sub?.cancelledAt && (
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Cancelled on</span>
                      <span className={styles.infoValue}>
                        {format(new Date(sub.cancelledAt), "MMMM d, yyyy")}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {/* Website invoices (leads invoices live on the leads page) */}
          <div className={styles.card}>
            <h3 className={styles.cardHeading}>Website Invoices</h3>
            {(() => {
              const websiteInvoices = client.invoices.filter(
                (inv) => inv.productType === "WEBSITE" || !inv.productType,
              );
              return websiteInvoices.length === 0 ? (
                <p className={styles.emptyText}>No invoices yet.</p>
              ) : (
                <div className={styles.invoiceList}>
                  {websiteInvoices.map((invoice) => (
                    <div key={invoice.id} className={styles.invoiceRow}>
                      <div className={styles.invoiceLeft}>
                        <span className={styles.invoiceNumber}>
                          {invoice.invoiceNumber}
                        </span>
                        <span className={styles.invoiceMeta}>
                          {invoice.description ??
                            (invoice.periodStart && invoice.periodEnd
                              ? `${format(new Date(invoice.periodStart), "MMM d")} – ${format(new Date(invoice.periodEnd), "MMM d, yyyy")}`
                              : "Subscription")}
                        </span>
                      </div>
                      <div className={styles.invoiceRight}>
                        <span className={styles.invoiceAmount}>
                          {formatCents(invoice.amountCents)}
                        </span>
                        <span
                          className={`${styles.invoiceStatus} ${
                            invoice.status === "PAID"
                              ? styles.invoiceStatusPaid
                              : invoice.status === "OPEN"
                                ? styles.invoiceStatusOpen
                                : styles.invoiceStatusOther
                          }`}
                        >
                          {invoice.status === "PAID"
                            ? "Paid"
                            : invoice.status === "OPEN"
                              ? "Due"
                              : invoice.status}
                        </span>
                        {invoice.pdfUrl && (
                          <a
                            href={invoice.pdfUrl}
                            target='_blank'
                            rel='noopener noreferrer'
                            className={styles.invoiceDownload}
                          >
                            ↓ PDF
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
