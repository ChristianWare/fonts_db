"use client";

// Self-contained, additive. Drop into any lead detail view:
//   <MarkWonButton leadId={lead.id} initialValue={lead.estimatedValue} />
// PATCHes /api/leads/[id] with { status: "WON", estimatedValue }, then refreshes
// server data so the ROI summary updates immediately.

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import styles from "./MarkWonButton.module.css";

type Props = {
  leadId: string;
  initialValue?: number | null;
  /** Optional: hide once the lead is already Won. */
  alreadyWon?: boolean;
};

export default function MarkWonButton({
  leadId,
  initialValue,
  alreadyWon = false,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState<string>(
    initialValue != null ? String(initialValue) : "",
  );
  const [saving, setSaving] = useState(false);

  async function submit() {
    const parsed = value.trim() === "" ? 0 : Math.round(Number(value));
    if (!Number.isFinite(parsed) || parsed < 0) {
      toast.error("Enter a dollar amount (or leave blank).");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "WON", estimatedValue: parsed }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Could not mark as won");
      }
      toast.success(
        parsed > 0
          ? `Marked Won — $${parsed.toLocaleString("en-US")}`
          : "Marked Won",
      );
      setOpen(false);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  if (alreadyWon && !open) {
    return (
      <button
        type='button'
        className={styles.editLink}
        onClick={() => setOpen(true)}
      >
        Edit booking value
      </button>
    );
  }

  if (!open) {
    return (
      <button
        type='button'
        className={styles.wonBtn}
        onClick={() => setOpen(true)}
      >
        Mark Won
      </button>
    );
  }

  return (
    <div className={styles.popover}>
      <label className={styles.label}>What&apos;s this booking worth?</label>
      <div className={styles.inputRow}>
        <span className={styles.dollar}>$</span>
        <input
          type='number'
          min={0}
          inputMode='numeric'
          placeholder='e.g. 1800'
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className={styles.input}
          autoFocus
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
            if (e.key === "Escape") setOpen(false);
          }}
        />
      </div>
      <div className={styles.actions}>
        <button
          type='button'
          className={styles.cancelBtn}
          onClick={() => setOpen(false)}
          disabled={saving}
        >
          Cancel
        </button>
        <button
          type='button'
          className={styles.confirmBtn}
          onClick={submit}
          disabled={saving}
        >
          {saving ? "Saving…" : "Confirm Won"}
        </button>
      </div>
      <p className={styles.note}>
        Leave blank if you don&apos;t have a number.
      </p>
    </div>
  );
}
