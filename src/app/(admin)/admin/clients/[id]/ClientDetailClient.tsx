/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { advanceClientStage } from "@/actions/admin/advanceClientStage";
import { getCloudinarySignature } from "@/actions/client/getCloudinarySignature";
import { uploadDocumentToClient } from "@/actions/admin/uploadDocumentToClient";
import { questionnaireSections } from "@/lib/questionnaire.config";
import styles from "./ClientDetailClient.module.css";
import DesignOptionsTab from "./DesignOptionsTab";

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

const documentTypes = [
  { value: "SERVICE_AGREEMENT", label: "Service Agreement" },
  { value: "DESIGN_APPROVAL", label: "Design Approval" },
  { value: "CONTENT_REVIEW", label: "Content Review" },
  { value: "GO_LIVE_CONFIRMATION", label: "Go-Live Confirmation" },
  { value: "OTHER", label: "Other" },
];

type ClientData = Awaited<
  ReturnType<typeof import("@/actions/admin/getClientById").getClientById>
>;

export default function ClientDetailClient({
  client,
}: {
  client: NonNullable<ClientData>;
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<
    "overview" | "documents" | "questionnaire" | "assets" | "design"
  >("overview");

  const [isLive, setIsLive] = useState(client.onboardingStage === "SITE_LIVE");
  const [togglingLive, setTogglingLive] = useState(false);

  const [docTitle, setDocTitle] = useState("");
  const [docType, setDocType] = useState("SERVICE_AGREEMENT");
  const [requiresSignature, setRequiresSignature] = useState(true);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [docError, setDocError] = useState<string | null>(null);

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

  // ── Progress tracker ───────────────────────────────────────────────────────
  const serviceAgreementDoc = client.documents.find(
    (d) => d.type === "SERVICE_AGREEMENT" && d.status === "SIGNED",
  );
  const billingActive =
    (client as any).subscription?.status === "ACTIVE" ||
    (client as any).subscription?.status === "PAST_DUE";
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

  const steps = [
    {
      key: "account",
      label: "Create Account",
      completed: true,
      completedAt: new Date(client.createdAt),
    },
    {
      key: "agreement",
      label: "Service Agreement",
      completed: !!serviceAgreementDoc,
      completedAt: serviceAgreementDoc?.signedAt
        ? new Date(serviceAgreementDoc.signedAt)
        : null,
    },
    {
      key: "billing",
      label: "Billing Subscription",
      completed: billingActive,
      completedAt: null,
    },
    {
      key: "questionnaire",
      label: "Intake Questionnaire",
      completed: questionnaireSubmitted,
      completedAt: client.questionnaire?.submittedAt
        ? new Date(client.questionnaire.submittedAt)
        : null,
    },
    {
      key: "assets",
      label: "Brand Assets",
      completed: !!firstAsset,
      completedAt: firstAsset ? new Date(firstAsset.createdAt) : null,
    },
    {
      key: "design",
      label: "Design Review",
      completed: designReviewed,
      completedAt: null,
    },
    {
      key: "live",
      label: "Site Live",
      completed: isLive,
      completedAt: null,
    },
  ];

  const completedCount = steps.filter((s) => s.completed).length;
  const sequentiallyComplete = steps.map((_s, i) =>
    steps.slice(0, i + 1).every((s) => s.completed),
  );

  // ── Client's design selection ──────────────────────────────────────────────
  // Design options are brand assets with selected/clientNotes fields
  const selectedDesign =
    (client.brandAssets as any[]).find((a) => a.selected === true) ?? null;

  const answers = client.questionnaire?.answers as Record<string, any> | null;

  return (
    <div className={styles.page}>
      {/* Header */}
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
              <h1 className={styles.heading}>{client.businessName}</h1>
              <p className={styles.clientEmail}>{client.user.email}</p>
            </div>
          </div>
        </div>
        <div className={styles.stageBadge}>
          {stageLabels[client.onboardingStage as OnboardingStage]}
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        {(
          [
            "overview",
            "documents",
            "questionnaire",
            "assets",
            "design",
          ] as const
        ).map((tab) => (
          <button
            key={tab}
            className={`${styles.tab} ${activeTab === tab ? styles.tabActive : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
            {/* Dot indicator on Design tab when client has made a selection */}
            {tab === "design" && selectedDesign && (
              <span className={styles.tabDot} />
            )}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW TAB ─────────────────────────────────────────────────── */}
      {activeTab === "overview" && (
        <div className={styles.tabContent}>
          <div className={styles.card}>
            <div className={styles.trackerHeader}>
              <h3 className={styles.cardHeading}>Onboarding Progress</h3>
              <span className={styles.trackerCount}>
                {completedCount} of {steps.length} complete
              </span>
            </div>

            <div className={styles.stages}>
              {steps.map((step, index) => {
                const isCompleted = step.completed;
                return (
                  <div
                    key={step.key}
                    className={`${styles.stage} ${
                      isCompleted ? styles.stageCompleted : styles.stageUpcoming
                    }`}
                  >
                    {index < steps.length - 1 && (
                      <div
                        className={`${styles.connector} ${
                          sequentiallyComplete[index]
                            ? styles.connectorCompleted
                            : styles.connectorUpcoming
                        }`}
                      />
                    )}
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
                      ) : null}
                    </div>
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
                    </div>
                  </div>
                );
              })}
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
                    : "Toggle on once the client's site has been launched."}
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
        </div>
      )}

      {/* ── DOCUMENTS TAB ────────────────────────────────────────────────── */}
      {activeTab === "documents" && (
        <div className={styles.tabContent}>
          <div className={styles.card}>
            <h3 className={styles.cardHeading}>Upload Document</h3>
            <p className={styles.cardDesc}>
              Upload a document to this client&apos;s portal.
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
                  {documentTypes.map((dt) => (
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
              Documents ({client.documents.length})
            </h3>
            {client.documents.length === 0 ? (
              <p className={styles.emptyText}>No documents uploaded yet.</p>
            ) : (
              <div className={styles.docList}>
                {client.documents.map((doc) => (
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

      {/* ── QUESTIONNAIRE TAB ────────────────────────────────────────────── */}
      {activeTab === "questionnaire" && (
        <div className={styles.tabContent}>
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
            questionnaireSections.map((section) => {
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
          {/* Client's selection — shown when they've picked something */}
          {selectedDesign ? (
            <div className={styles.card}>
              <div className={styles.selectionHeader}>
                <div>
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
                {/* Thumbnail */}
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

                {/* Meta */}
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

          {/* Admin's design options uploader */}
          <DesignOptionsTab clientId={client.id} assets={client.brandAssets} />
        </div>
      )}
    </div>
  );
}
