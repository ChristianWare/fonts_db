"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateClientBillingRates } from "@/actions/admin/updateClientBillingRates";
import styles from "./BillingRatesEditor.module.css";

function centsToDisplay(cents: number): string {
  return (cents / 100).toFixed(2);
}

function displayToCents(value: string): number {
  const parsed = parseFloat(value.replace(/[^0-9.]/g, ""));
  if (isNaN(parsed)) return 0;
  return Math.round(parsed * 100);
}

export default function BillingRatesEditor({
  clientProfileId,
  setupFeeAmountCents,
  monthlyAmountCents,
  setupFeePaid,
}: {
  clientProfileId: string;
  setupFeeAmountCents: number;
  monthlyAmountCents: number;
  setupFeePaid: boolean;
}) {
  const router = useRouter();
  const [setupFee, setSetupFee] = useState(centsToDisplay(setupFeeAmountCents));
  const [monthly, setMonthly] = useState(centsToDisplay(monthlyAmountCents));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);

    const result = await updateClientBillingRates({
      clientProfileId,
      setupFeeAmountCents: displayToCents(setupFee),
      monthlyAmountCents: displayToCents(monthly),
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
        <h3 className={styles.editorLabel}>Billing Rates</h3>
        {setupFeePaid && (
          <span className={styles.lockedBadge}>Setup fee paid — locked</span>
        )}
      </div>

      <div className={styles.fields}>
        {/* Setup fee */}
        <div className={styles.field}>
          <label className={styles.label}>
            Setup Fee
            {setupFeePaid && (
              <span className={styles.lockedHint}> — cannot be changed</span>
            )}
          </label>
          <div className={styles.inputWrap}>
            <span className={styles.prefix}>$</span>
            <input
              type='number'
              step='0.01'
              min='0'
              className={styles.input}
              value={setupFee}
              onChange={(e) => {
                setSetupFee(e.target.value);
                setSaved(false);
              }}
              disabled={setupFeePaid}
            />
          </div>
          <span className={styles.hint}>
            Charged immediately when client adds card.
          </span>
        </div>

        {/* Monthly rate */}
        <div className={styles.field}>
          <label className={styles.label}>Monthly Rate</label>
          <div className={styles.inputWrap}>
            <span className={styles.prefix}>$</span>
            <input
              type='number'
              step='0.01'
              min='0'
              className={styles.input}
              value={monthly}
              onChange={(e) => {
                setMonthly(e.target.value);
                setSaved(false);
              }}
            />
          </div>
          <span className={styles.hint}>
            Billed on the 1st of each month. Takes effect on next cycle.
          </span>
        </div>
      </div>

      {error && <div className={styles.errorBanner}>{error}</div>}

      <div className={styles.footer}>
        {saved && <span className={styles.savedText}>✓ Rates saved</span>}
        <button
          onClick={handleSave}
          className={styles.saveBtn}
          disabled={saving}
        >
          {saving ? "Saving..." : "Save rates"}
        </button>
      </div>
    </div>
  );
}
