"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateClientSiteUrls } from "@/actions/admin/updateClientSiteUrls";
import styles from "./SiteUrlsEditor.module.css";

export default function SiteUrlsEditor({
  clientProfileId,
  previewUrl,
  liveUrl,
}: {
  clientProfileId: string;
  previewUrl: string | null;
  liveUrl: string | null;
}) {
  const router = useRouter();
  const [preview, setPreview] = useState(previewUrl ?? "");
  const [live, setLive] = useState(liveUrl ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);

    const result = await updateClientSiteUrls({
      clientProfileId,
      previewUrl: preview,
      liveUrl: live,
    });

    if (result?.error) {
      setError(result.error);
    } else {
      setSaved(true);
      router.refresh();
    }

    setSaving(false);
  };

  return (
    <div className={styles.editor}>
      <div className={styles.editorHeader}>
        <h3 className={styles.editorLabel}>Site URLs</h3>
      </div>

      <div className={styles.fields}>
        {/* Preview URL */}
        <div className={styles.field}>
          <label className={styles.label}>Preview URL</label>
          <input
            type='url'
            className={styles.input}
            placeholder='https://your-project.vercel.app'
            value={preview}
            onChange={(e) => {
              setPreview(e.target.value);
              setSaved(false);
            }}
          />
          <span className={styles.hint}>
            Vercel preview link shown to the client while the site is being
            built. Clear to remove.
          </span>
          {preview && (
            <a
              href={preview}
              target='_blank'
              rel='noopener noreferrer'
              className={styles.testLink}
            >
              Open preview ↗
            </a>
          )}
        </div>

        {/* Live URL */}
        <div className={styles.field}>
          <label className={styles.label}>Live URL</label>
          <input
            type='url'
            className={styles.input}
            placeholder='https://yourdomain.com'
            value={live}
            onChange={(e) => {
              setLive(e.target.value);
              setSaved(false);
            }}
          />
          <span className={styles.hint}>
            The client&apos;s live site URL. Shown on their dashboard once the
            site is marked as live. Clear to remove.
          </span>
          {live && (
            <a
              href={live}
              target='_blank'
              rel='noopener noreferrer'
              className={styles.testLink}
            >
              Open live site ↗
            </a>
          )}
        </div>
      </div>

      {error && <div className={styles.errorBanner}>{error}</div>}

      <div className={styles.footer}>
        {saved && <span className={styles.savedText}>✓ Saved</span>}
        <button
          onClick={handleSave}
          className={styles.saveBtn}
          disabled={saving}
        >
          {saving ? "Saving..." : "Save URLs"}
        </button>
      </div>
    </div>
  );
}
