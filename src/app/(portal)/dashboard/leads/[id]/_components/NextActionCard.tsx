"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./LeadEnhancements.module.css";

type Props = {
  leadId: string;
  nextActionAt: string | Date | null;
  nextActionNote: string | null;
};

function toInputDate(date: string | Date | null): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

export default function NextActionCard({
  leadId,
  nextActionAt,
  nextActionNote,
}: Props) {
  const router = useRouter();
  const [date, setDate] = useState(toInputDate(nextActionAt));
  const [note, setNote] = useState(nextActionNote ?? "");
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!date) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/leads/${leadId}/next-action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, note }),
      });
      if (res.ok) router.refresh();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  async function clear() {
    setSaving(true);
    try {
      const res = await fetch(`/api/leads/${leadId}/next-action`, {
        method: "DELETE",
      });
      if (res.ok) {
        setDate("");
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
    <div className={styles.nextActionCard}>
      <h4 className={styles.nextActionTitle}>Next action</h4>
      <input
        type='date'
        value={date}
        onChange={(e) => setDate(e.target.value)}
        className={styles.nextActionDate}
      />
      <textarea
        placeholder="What's the action? (optional)"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        className={styles.nextActionNote}
        rows={2}
      />
      <div className={styles.nextActionButtons}>
        <button
          type='button'
          onClick={save}
          disabled={!date || saving}
          className={styles.nextActionSave}
        >
          {saving ? "Saving..." : nextActionAt ? "Update" : "Set"}
        </button>
        {nextActionAt && (
          <button
            type='button'
            onClick={clear}
            disabled={saving}
            className={styles.nextActionClear}
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
