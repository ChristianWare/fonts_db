"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./LeadEnhancements.module.css";

type Props = { leadId: string };

const CHANNELS = [
  { key: "EMAIL_SENT", label: "Email" },
  { key: "CALL_MADE", label: "Call" },
  { key: "LINKEDIN_SENT", label: "LinkedIn" },
  { key: "SMS_SENT", label: "SMS" },
  { key: "IN_PERSON_VISIT", label: "Visit" },
];

export default function OutreachQuickLog({ leadId }: Props) {
  const router = useRouter();
  const [channel, setChannel] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  async function log() {
    if (!channel) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/leads/${leadId}/outreach`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel, note }),
      });
      if (res.ok) {
        setChannel(null);
        setNote("");
        router.refresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={styles.outreachLogCard}>
      <h4 className={styles.outreachLogTitle}>Log outreach</h4>
      {!channel ? (
        <div className={styles.outreachChannelGrid}>
          {CHANNELS.map((c) => (
            <button
              key={c.key}
              type='button'
              onClick={() => setChannel(c.key)}
              className={styles.outreachChannelBtn}
            >
              {c.label}
            </button>
          ))}
        </div>
      ) : (
        <>
          <p className={styles.outreachChannelChosen}>
            Logging:{" "}
            <strong>{CHANNELS.find((c) => c.key === channel)?.label}</strong>
          </p>
          <textarea
            placeholder='Disposition: voicemail / spoke briefly / decision-maker reached / left card'
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className={styles.outreachLogNote}
            rows={2}
          />
          <div className={styles.outreachLogButtons}>
            <button
              type='button'
              onClick={log}
              disabled={saving}
              className={styles.outreachLogSubmit}
            >
              {saving ? "Logging..." : "Log it"}
            </button>
            <button
              type='button'
              onClick={() => {
                setChannel(null);
                setNote("");
              }}
              disabled={saving}
              className={styles.outreachLogCancel}
            >
              Cancel
            </button>
          </div>
        </>
      )}
    </div>
  );
}
