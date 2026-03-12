/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { AssetLabel } from "@prisma/client";
import { getCloudinarySignature } from "@/actions/client/getCloudinarySignature";
import { uploadDesignOption } from "@/actions/admin/uploadDesignOption";
import { deleteDesignOption } from "@/actions/admin/deleteDesignOption";
import styles from "./ClientDetailClient.module.css";

type Asset = {
  id: string;
  fileUrl: string;
  fileName: string;
  label: string;
  templateName: string | null;
  sourceUrl: string | null;
  selected: boolean;
  clientNotes: string | null;
  createdAt: Date;
};

export default function DesignOptionsTab({
  clientId,
  assets,
}: {
  clientId: string;
  assets: Asset[];
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [templateName, setTemplateName] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const designOptions = assets.filter(
    (a) => a.label === AssetLabel.DESIGN_OPTION,
  );
  const selectedOption = designOptions.find((a) => a.selected);

  const handleUpload = async (file: File) => {
    if (!templateName.trim()) {
      setUploadError("Please enter a template name before uploading.");
      return;
    }

    setUploadError(null);
    setUploading(true);

    try {
      const folder = `fonts-and-footers/clients/${clientId}/design-options`;
      const sigData = await getCloudinarySignature(folder);

      if ("error" in sigData) {
        setUploadError("Failed to get upload signature.");
        setUploading(false);
        return;
      }

      const formData = new FormData();
      formData.append("file", file);
      formData.append("api_key", sigData.apiKey);
      formData.append("timestamp", String(sigData.timestamp));
      formData.append("signature", sigData.signature);
      formData.append("folder", folder);

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${sigData.cloudName}/image/upload`,
        { method: "POST", body: formData },
      );

      const data = await response.json();

      if (!response.ok) {
        setUploadError("Upload failed. Please try again.");
        setUploading(false);
        return;
      }

      const result = await uploadDesignOption({
        clientProfileId: clientId,
        imageUrl: data.secure_url,
        fileName: file.name,
        templateName,
        sourceUrl: sourceUrl.trim() || undefined,
      });

      if (result?.error) {
        setUploadError(result.error);
        setUploading(false);
        return;
      }

      setTemplateName("");
      setSourceUrl("");
      router.refresh();
    } catch {
      setUploadError("Something went wrong.");
    }

    setUploading(false);
  };

  const handleDelete = async (assetId: string) => {
    await deleteDesignOption(assetId);
    router.refresh();
  };

  return (
    <>
      {selectedOption && (
        <div className={styles.card}>
          <h3 className={styles.cardHeading}>Client&apos;s Selection</h3>
          <div className={styles.selectionRow}>
            <img
              src={selectedOption.fileUrl}
              alt={selectedOption.templateName ?? "Selected design"}
              className={styles.selectionThumb}
            />
            <div className={styles.selectionInfo}>
              <span className={styles.selectionName}>
                {selectedOption.templateName ?? "Unnamed template"}
              </span>
              {selectedOption.clientNotes && (
                <div className={styles.selectionNotes}>
                  <span className={styles.selectionNotesLabel}>
                    Client notes
                  </span>
                  <p className={styles.selectionNotesText}>
                    {selectedOption.clientNotes}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className={styles.card}>
        <h3 className={styles.cardHeading}>Upload Design Option</h3>
        <p className={styles.cardDesc}>
          Upload a full-page screenshot. Add up to 5 options for the client to
          choose from.
        </p>
        <div className={styles.uploadForm}>
          <div className={styles.uploadRow}>
            <input
              type='text'
              className={styles.input}
              placeholder='Template name (e.g. Velocity, Obsidian, Luxe)'
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
            />
          </div>
          <input
            type='text'
            className={styles.input}
            placeholder='Webflow / Framer source URL (optional)'
            value={sourceUrl}
            onChange={(e) => setSourceUrl(e.target.value)}
          />
          {uploadError && (
            <div className={styles.errorBanner}>{uploadError}</div>
          )}
          <input
            ref={fileInputRef}
            type='file'
            className={styles.hiddenInput}
            accept='image/*'
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleUpload(file);
              e.target.value = "";
            }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className={styles.uploadBtn}
            disabled={uploading || designOptions.length >= 5}
          >
            {uploading
              ? "Uploading..."
              : designOptions.length >= 5
                ? "Maximum 5 options reached"
                : "Choose screenshot & upload"}
          </button>
        </div>
      </div>

      <div className={styles.card}>
        <h3 className={styles.cardHeading}>
          Design Options ({designOptions.length} / 5)
        </h3>
        {designOptions.length === 0 ? (
          <p className={styles.emptyText}>No design options uploaded yet.</p>
        ) : (
          <div className={styles.docList}>
            {designOptions.map((option, index) => (
              <div key={option.id} className={styles.docRow}>
                <div className={styles.docInfo}>
                  <span className={styles.docTitle}>
                    Option {index + 1}
                    {option.templateName ? ` — ${option.templateName}` : ""}
                    {option.selected && (
                      <span className={styles.selectedTag}>
                        {" · Client's choice"}
                      </span>
                    )}
                  </span>
                  <span className={styles.docMeta}>
                    {format(new Date(option.createdAt), "MMM d, yyyy")}
                    {option.sourceUrl && (
                      <>
                        {" · "}
                        <a
                          href={option.sourceUrl}
                          target='_blank'
                          rel='noopener noreferrer'
                          className={styles.inlineLink}
                        >
                          Source
                        </a>
                      </>
                    )}
                  </span>
                </div>
                <div className={styles.docActions}>
                  <a
                    href={option.fileUrl}
                    target='_blank'
                    rel='noopener noreferrer'
                    className={styles.viewBtn}
                  >
                    View
                  </a>
                  {!option.selected && (
                    <button
                      onClick={() => handleDelete(option.id)}
                      className={styles.deleteBtn}
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
