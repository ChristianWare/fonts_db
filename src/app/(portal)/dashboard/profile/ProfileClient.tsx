"use client";

import { useState } from "react";
import { format } from "date-fns";
import { updateProfile } from "@/actions/client/updateProfile";
import styles from "./ProfileClient.module.css";

const stageLabels: Record<string, string> = {
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

export default function ProfileClient({
  name,
  email,
  phone,
  businessName,
  city,
  state,
  website,
  createdAt,
  onboardingStage,
}: {
  name: string;
  email: string;
  phone: string;
  businessName: string;
  city: string;
  state: string;
  website: string;
  createdAt: Date;
  onboardingStage: string;
}) {
  const [form, setForm] = useState({
    name,
    phone,
    businessName,
    city,
    state,
    website,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
    setError(null);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    const result = await updateProfile(form);
    if (result?.error) {
      setError(result.error);
    } else {
      setSaved(true);
    }
    setSaving(false);
  };

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={`${styles.heading} h2`}>Profile</h1>
          <p className={styles.subheading}>
            Manage your personal and business information.
          </p>
        </div>
        <div className={styles.stagePill}>
          {stageLabels[onboardingStage] ?? onboardingStage}
        </div>
      </div>

      {/* Personal Info */}
      <div className={styles.card}>
        <h1 className={`${styles.cardHeading} h2`}>Personal Information</h1>
        <div className={styles.fieldGrid}>
          <div className={styles.field}>
            <label className={styles.label}>Full Name</label>
            <input
              type='text'
              className={styles.input}
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Email Address</label>
            <input
              type='email'
              className={`${styles.input} ${styles.inputReadonly}`}
              value={email}
              readOnly
            />
            <span className={styles.fieldHint}>
              Contact support to change your email address.
            </span>
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Phone Number</label>
            <input
              type='tel'
              className={styles.input}
              value={form.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
              placeholder='e.g. (602) 555-0123'
            />
          </div>
        </div>
      </div>

      {/* Business Info */}
      <div className={styles.card}>
        <h2 className={styles.cardHeading}>Business Information</h2>
        <div className={styles.fieldGrid}>
          <div className={styles.field}>
            <label className={styles.label}>Business Name</label>
            <input
              type='text'
              className={styles.input}
              value={form.businessName}
              onChange={(e) => handleChange("businessName", e.target.value)}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Current Website</label>
            <input
              type='url'
              className={styles.input}
              value={form.website}
              onChange={(e) => handleChange("website", e.target.value)}
              placeholder='https://yoursite.com'
            />
          </div>
          <div className={styles.fieldRow}>
            <div className={styles.field}>
              <label className={styles.label}>City</label>
              <input
                type='text'
                className={styles.input}
                value={form.city}
                onChange={(e) => handleChange("city", e.target.value)}
                placeholder='Phoenix'
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>State</label>
              <input
                type='text'
                className={styles.input}
                value={form.state}
                onChange={(e) => handleChange("state", e.target.value)}
                placeholder='AZ'
                maxLength={2}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Account Info */}
      <div className={styles.card}>
        <h2 className={styles.cardHeading}>Account Information</h2>
        <div className={styles.infoGrid}>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Member since</span>
            <span className={styles.infoValue}>
              {format(new Date(createdAt), "MMMM d, yyyy")}
            </span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Project status</span>
            <span className={styles.infoValue}>
              {stageLabels[onboardingStage] ?? onboardingStage}
            </span>
          </div>
        </div>
      </div>

      {/* Sticky save bar */}
      <div className={styles.saveBar}>
        {error && <span className={styles.errorText}>{error}</span>}
        {saved && <span className={styles.savedText}>✓ Changes saved</span>}
        <button
          onClick={handleSave}
          className={styles.saveBtn}
          disabled={saving}
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
