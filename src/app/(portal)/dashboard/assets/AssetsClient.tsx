"use client";

import { useState, useRef } from "react";
import { getCloudinarySignature } from "@/actions/client/getCloudinarySignature";
import { saveBrandAsset } from "@/actions/client/saveBrandAsset";
import { deleteBrandAsset } from "@/actions/client/deleteBrandAsset";
import { useRouter } from "next/navigation";
import styles from "./AssetsClient.module.css";

type Asset = {
  id: string;
  label: string;
  fileName: string;
  fileUrl: string;
  fileSize: number | null;
  createdAt: Date;
};

const assetLabels = [
  { value: "LOGO",        label: "Logo",        desc: "Your primary logo file (SVG, PNG, or AI preferred)" },
  { value: "PHOTO",       label: "Photos",      desc: "Vehicle photos, team photos, or lifestyle imagery" },
  { value: "BRAND_GUIDE", label: "Brand Guide", desc: "Brand guidelines, color swatches, or style docs" },
  { value: "OTHER",       label: "Other",       desc: "Any other files you want to share with us" },
];

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function AssetsClient({
  existingAssets,
  clientId,
}: {
  existingAssets: Asset[];
  clientId: string;
}) {
  const router = useRouter();
  const [assets, setAssets] = useState<Asset[]>(existingAssets);
  const [uploading, setUploading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeLabel, setActiveLabel] = useState<string>("LOGO");

  const handleUpload = async (file: File) => {
    setError(null);
    setUploading(activeLabel);

    try {
      const folder = `fonts-and-footers/clients/${clientId}/assets`;
      const sigData = await getCloudinarySignature(folder);

      if ("error" in sigData) {
        setError(sigData.error ?? "Failed to get upload signature");
        setUploading(null);
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
        { method: "POST", body: formData }
      );

      const data = await response.json();

      if (!response.ok) {
        setError("Upload failed. Please try again.");
        setUploading(null);
        return;
      }

      const result = await saveBrandAsset({
        label: activeLabel,
        fileName: file.name,
        fileUrl: data.secure_url,
        fileSize: data.bytes,
        mimeType: file.type,
      });

      if (result?.error) {
        setError(result.error);
        setUploading(null);
        return;
      }

      router.refresh();
      setUploading(null);

      // Optimistically add to list
      setAssets((prev) => [
        ...prev,
        {
          id: data.public_id,
          label: activeLabel,
          fileName: file.name,
          fileUrl: data.secure_url,
          fileSize: data.bytes,
          createdAt: new Date(),
        },
      ]);
    } catch {
      setError("Something went wrong. Please try again.");
      setUploading(null);
    }
  };

  const handleDelete = async (assetId: string) => {
    const result = await deleteBrandAsset(assetId);
    if (result?.error) {
      setError(result.error);
      return;
    }
    setAssets((prev) => prev.filter((a) => a.id !== assetId));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
    e.target.value = "";
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.heading}>Brand Assets</h1>
        <p className={styles.subheading}>
          Upload your logo, photos, and any brand files so we can build your
          platform to spec.
        </p>
      </div>

      {/* Asset type selector */}
      <div className={styles.labelSelector}>
        {assetLabels.map((al) => (
          <button
            key={al.value}
            className={`${styles.labelBtn} ${
              activeLabel === al.value ? styles.labelBtnActive : ""
            }`}
            onClick={() => setActiveLabel(al.value)}
          >
            {al.label}
          </button>
        ))}
      </div>

      {/* Upload zone */}
      <div
        className={styles.dropzone}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          className={styles.hiddenInput}
          onChange={handleFileChange}
          accept="image/*,.pdf,.ai,.eps,.svg,.zip"
        />

        {uploading ? (
          <div className={styles.uploadingState}>
            <div className={styles.spinner} />
            <p className={styles.uploadingText}>Uploading...</p>
          </div>
        ) : (
          <div className={styles.dropzoneInner}>
            <div className={styles.dropzoneIcon}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </div>
            <div className={styles.dropzoneText}>
              <p className={styles.dropzoneMain}>
                Drop your {assetLabels.find((a) => a.value === activeLabel)?.label.toLowerCase()} here
              </p>
              <p className={styles.dropzoneSub}>
                {assetLabels.find((a) => a.value === activeLabel)?.desc}
              </p>
              <p className={styles.dropzoneFormats}>
                SVG, PNG, JPG, PDF, AI, EPS, ZIP accepted
              </p>
            </div>
            <span className={styles.browseBtn}>Browse files</span>
          </div>
        )}
      </div>

      {error && <div className={styles.errorBanner}>{error}</div>}

      {/* Uploaded assets */}
      {assets.length > 0 && (
        <div className={styles.assetList}>
          <h3 className={styles.assetListHeading}>
            Uploaded files ({assets.length})
          </h3>
          <div className={styles.assets}>
            {assets.map((asset) => (
              <div key={asset.id} className={styles.assetCard}>
                <div className={styles.assetLeft}>
                  <div className={styles.assetIcon}>
                    {asset.fileUrl.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i) ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={asset.fileUrl}
                        alt={asset.fileName}
                        className={styles.assetThumb}
                      />
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                      </svg>
                    )}
                  </div>
                  <div className={styles.assetInfo}>
                    <span className={styles.assetName}>{asset.fileName}</span>
                    <div className={styles.assetMeta}>
                      <span className={styles.assetLabel}>
                        {assetLabels.find((a) => a.value === asset.label)?.label}
                      </span>
                      {asset.fileSize && (
                        <span className={styles.assetSize}>
                          {formatBytes(asset.fileSize)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className={styles.assetActions}>
                  <a
                    href={asset.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.viewBtn}
                  >
                    View
                  </a>
                  <button
                    onClick={() => handleDelete(asset.id)}
                    className={styles.deleteBtn}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}