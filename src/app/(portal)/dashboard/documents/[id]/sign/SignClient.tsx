"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { signDocument } from "@/actions/client/signDocument";
import styles from "./SignClient.module.css";

type Document = {
  id: string;
  title: string;
  type: string;
  fileUrl: string;
  createdAt: Date;
};

const documentTypeLabels: Record<string, string> = {
  SERVICE_AGREEMENT: "Service Agreement",
  DESIGN_APPROVAL: "Design Approval",
  CONTENT_REVIEW: "Content Review",
  GO_LIVE_CONFIRMATION: "Go-Live Confirmation",
  OTHER: "Document",
};

export default function SignClient({ document }: { document: Document }) {
  const router = useRouter();
  const [agreed, setAgreed] = useState(false);
  const [signing, setSigning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSign = async () => {
    if (!agreed) return;
    setSigning(true);
    setError(null);

    const result = await signDocument(document.id);

    if (result?.error) {
      setError(result.error);
      setSigning(false);
      return;
    }

    window.location.href = "/dashboard/documents?signed=true";
  };

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <button
          onClick={() => router.push("/dashboard/documents")}
          className={styles.backBtn}
        >
          ← Documents
        </button>
        <div className={styles.docMeta}>
          <span className={styles.docType}>
            {documentTypeLabels[document.type] ?? "Document"}
          </span>
          <span className={styles.docDate}>
            Added {format(new Date(document.createdAt), "MMMM d, yyyy")}
          </span>
        </div>
        <h1 className={styles.heading}>{document.title}</h1>
      </div>

      {/* PDF Preview */}
      <div className={styles.previewCard}>
        <div className={styles.previewHeader}>
          <span className={styles.previewLabel}>Document Preview</span>
          <a
            href={document.fileUrl}
            target='_blank'
            rel='noopener noreferrer'
            className={styles.openBtn}
          >
            Open in new tab
            <svg
              width='12'
              height='12'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeWidth='2.5'
              strokeLinecap='round'
              strokeLinejoin='round'
            >
              <path d='M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6' />
              <polyline points='15 3 21 3 21 9' />
              <line x1='10' y1='14' x2='21' y2='3' />
            </svg>
          </a>
        </div>
        <iframe
          src={document.fileUrl}
          className={styles.pdfFrame}
          title={document.title}
        />
      </div>

      {/* Signature block */}
      <div className={styles.signCard}>
        <div className={styles.signCardHeader}>
          <h2 className={styles.signHeading}>Sign This Document</h2>
          <p className={styles.signDesc}>
            Read the document above carefully. By checking the box and clicking
            &ldquo;Sign Document&rdquo; you are providing your legally binding electronic
            signature.
          </p>
        </div>

        <label className={styles.consentLabel}>
          <input
            type='checkbox'
            className={styles.consentCheckbox}
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
          />
          <span className={styles.consentText}>
            I have read and agree to this document. I understand that checking
            this box and clicking &ldquo;Sign Document&rdquo; constitutes my
            legal electronic signature.
          </span>
        </label>

        {error && <div className={styles.errorBanner}>{error}</div>}

        <div className={styles.signActions}>
          <button
            onClick={() => router.push("/dashboard/documents")}
            className={styles.cancelBtn}
          >
            Cancel
          </button>
          <button
            onClick={handleSign}
            className={styles.signBtn}
            disabled={!agreed || signing}
          >
            {signing ? "Signing..." : "Sign Document →"}
          </button>
        </div>
      </div>

      {/* Legal notice */}
      <p className={styles.legalNote}>
        Your signature is recorded with a timestamp and IP address for
        verification purposes. This electronic signature is legally binding
        under applicable e-signature laws.
      </p>
    </div>
  );
}
