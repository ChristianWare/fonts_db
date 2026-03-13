import { getClientProfile } from "@/actions/client/getClientProfile";
import styles from "./DocumentsPage.module.css";
import { format } from "date-fns";

const documentTypeLabels: Record<string, string> = {
  SERVICE_AGREEMENT: "Service Agreement",
  DESIGN_APPROVAL: "Design Approval",
  CONTENT_REVIEW: "Content Review",
  GO_LIVE_CONFIRMATION: "Go-Live Confirmation",
  OTHER: "Document",
};

const statusLabels: Record<string, string> = {
  PENDING_SIGNATURE: "Signature Required",
  SIGNED: "Signed",
  UPLOADED: "Available",
};

export default async function DocumentsPage() {
  const profile = await getClientProfile();
  const documents = profile?.documents ?? [];
  const visibleDocs = documents.filter((d) => d.visible);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={`${styles.heading} h2`}>Documents</h1>
        <p className={styles.subheading}>
          Review, sign, and download your project documents.
        </p>
      </div>

      {visibleDocs.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            <svg
              width='32'
              height='32'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeWidth='1.5'
              strokeLinecap='round'
              strokeLinejoin='round'
            >
              <path d='M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z' />
              <polyline points='14 2 14 8 20 8' />
            </svg>
          </div>
          <h3 className={styles.emptyHeading}>No documents yet</h3>
          <p className={styles.emptyText}>
            Your documents will appear here once your project gets started.
          </p>
        </div>
      ) : (
        <div className={styles.list}>
          {visibleDocs.map((doc) => {
            const isSigned = doc.status === "SIGNED";
            const needsSignature =
              doc.status === "PENDING_SIGNATURE" && doc.requiresSignature;

            return (
              <div key={doc.id} className={styles.docCard}>
                <div className={styles.docLeft}>
                  <div className={styles.docIcon}>
                    <svg
                      width='20'
                      height='20'
                      viewBox='0 0 24 24'
                      fill='none'
                      stroke='currentColor'
                      strokeWidth='2'
                      strokeLinecap='round'
                      strokeLinejoin='round'
                    >
                      <path d='M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z' />
                      <polyline points='14 2 14 8 20 8' />
                    </svg>
                  </div>
                  <div className={styles.docInfo}>
                    <div className={styles.docTopRow}>
                      <span className={styles.docType}>
                        {documentTypeLabels[doc.type] ?? "Document"}
                      </span>
                      <span
                        className={`${styles.docStatus} ${
                          isSigned
                            ? styles.statusSigned
                            : needsSignature
                              ? styles.statusPending
                              : styles.statusUploaded
                        }`}
                      >
                        {statusLabels[doc.status]}
                      </span>
                    </div>
                    <div className={styles.docTitle}>{doc.title}</div>
                    <p className={styles.docMeta}>
                      {isSigned && doc.signedAt
                        ? `Signed ${format(new Date(doc.signedAt), "MMMM d, yyyy 'at' h:mm a")}`
                        : `Added ${format(new Date(doc.createdAt), "MMMM d, yyyy")}`}
                    </p>
                  </div>
                </div>

                <div className={styles.docActions}>
                  {/* Download */}
                  <a
                    href={doc.fileUrl}
                    target='_blank'
                    rel='noopener noreferrer'
                    className={styles.downloadBtn}
                  >
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
                      <path d='M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4' />
                      <polyline points='7 10 12 15 17 10' />
                      <line x1='12' y1='15' x2='12' y2='3' />
                    </svg>
                    Download
                  </a>

                  {/* Sign button */}
                  {needsSignature && (
                    <a
                      href={`/dashboard/documents/${doc.id}/sign`}
                      className={styles.signBtn}
                    >
                      Sign now
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
                  )}

                  {/* Signed confirmation */}
                  {isSigned && (
                    <div className={styles.signedConfirm}>
                      <svg
                        width='14'
                        height='14'
                        viewBox='0 0 24 24'
                        fill='none'
                        stroke='currentColor'
                        strokeWidth='2.5'
                        strokeLinecap='round'
                        strokeLinejoin='round'
                      >
                        <polyline points='20 6 9 17 4 12' />
                      </svg>
                      Signed
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Signature record — shown if any doc is signed */}
      {visibleDocs.some((d) => d.status === "SIGNED") && (
        <div className={styles.signatureRecord}>
          <h3 className={styles.signatureRecordHeading}>Signature Record</h3>
          {visibleDocs
            .filter((d) => d.status === "SIGNED")
            .map((doc) => (
              <div key={doc.id} className={styles.signatureEntry}>
                <div className={styles.signatureEntryLeft}>
                  <span className={styles.signatureDocTitle}>{doc.title}</span>
                  <div className={styles.signatureDetails}>
                    {doc.signedAt && (
                      <span>
                        Signed on{" "}
                        {format(
                          new Date(doc.signedAt),
                          "MMMM d, yyyy 'at' h:mm a",
                        )}
                      </span>
                    )}
                    {doc.signedByIp && <span>IP: {doc.signedByIp}</span>}
                    <span>
                      Consent: &quot;I agree this constitutes my electronic
                      signature&quot;
                    </span>
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
