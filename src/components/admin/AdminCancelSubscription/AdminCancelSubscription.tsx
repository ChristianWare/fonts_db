"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import toast from "react-hot-toast";
import type { ProductType } from "@prisma/client";
import {
  adminCancelSubscription,
  adminResumeSubscription,
  type CancelMode,
} from "@/actions/admin/billingAdminActions";
import styles from "./AdminCancelSubscription.module.css";

const PRODUCT_LABELS: Record<ProductType, string> = {
  WEBSITE: "Custom Website",
  LEADS: "Leads Tool",
};

/** The slice of a Subscription row this control needs. Dates arrive as
 *  Date objects from the server component but are tolerated as strings. */
export type SubscriptionSnapshot = {
  status: string;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: Date | string | null;
  stripeSubscriptionId: string | null;
};

export default function AdminCancelSubscription({
  clientProfileId,
  productType,
  subscription,
}: {
  clientProfileId: string;
  productType: ProductType;
  subscription: SubscriptionSnapshot | null;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<CancelMode>("period_end");
  const [confirming, setConfirming] = useState<CancelMode | null>(null);
  const [busy, setBusy] = useState<"cancel" | "resume" | null>(null);
  const [note, setNote] = useState("");

  const label = PRODUCT_LABELS[productType];

  // Nothing to cancel: not enrolled, never activated, or already cancelled.
  // The status card above already tells that story.
  if (
    !subscription ||
    subscription.status === "INACTIVE" ||
    subscription.status === "CANCELLED"
  ) {
    return null;
  }

  const isFree = !subscription.stripeSubscriptionId;
  const periodEnd = subscription.currentPeriodEnd
    ? format(new Date(subscription.currentPeriodEnd), "MMMM d, yyyy")
    : null;

  const runCancel = async (chosen: CancelMode) => {
    setBusy("cancel");
    const res = await adminCancelSubscription({
      clientProfileId,
      productType,
      mode: chosen,
      note,
    });
    setBusy(null);
    setConfirming(null);

    if ("error" in res) {
      toast.error(res.error);
      return;
    }

    setNote("");
    if (res.immediate) {
      toast.success(`${label} cancelled`);
    } else {
      const until = res.accessUntil
        ? format(new Date(res.accessUntil), "MMM d, yyyy")
        : "the end of the period";
      toast.success(`${label} ends ${until}`);
    }
    router.refresh();
  };

  const runResume = async () => {
    setBusy("resume");
    const res = await adminResumeSubscription({ clientProfileId, productType });
    setBusy(null);
    if ("error" in res) {
      toast.error(res.error);
      return;
    }
    toast.success(`${label} will keep renewing`);
    router.refresh();
  };

  /* ── Cancellation already scheduled ─────────────────────────────────── */

  if (subscription.cancelAtPeriodEnd) {
    return (
      <div className={styles.card}>
        <h3 className={styles.cardHeading}>Cancel {label}</h3>

        <div className={styles.scheduledBox}>
          <span className={styles.scheduledTitle}>Cancellation scheduled</span>
          <p className={styles.body}>
            {periodEnd
              ? `Access and billing end on ${periodEnd}. No further charges.`
              : "Access and billing end when the current period closes."}
          </p>
        </div>

        {confirming === "now" && (
          <NoteField value={note} onChange={setNote} disabled={busy !== null} />
        )}

        <div className={styles.actions}>
          <button
            type='button'
            className={styles.btnGhost}
            onClick={runResume}
            disabled={busy !== null}
          >
            {busy === "resume" ? "Resuming…" : "Keep subscription"}
          </button>

          {confirming !== "now" ? (
            <button
              type='button'
              className={styles.btnDanger}
              onClick={() => setConfirming("now")}
              disabled={busy !== null}
            >
              Cancel now instead
            </button>
          ) : (
            <ConfirmRow
              busy={busy === "cancel"}
              onBack={() => setConfirming(null)}
              onConfirm={() => runCancel("now")}
            />
          )}
        </div>
      </div>
    );
  }

  /* ── Active / past due / paused — offer to cancel ───────────────────── */

  return (
    <div className={styles.card}>
      <h3 className={styles.cardHeading}>Cancel {label}</h3>

      {isFree ? (
        <p className={styles.body}>
          This is a free or founding subscription with nothing in Stripe, so
          cancelling ends it right away. The client gets the standard
          cancellation email.
        </p>
      ) : (
        <fieldset className={styles.choices} disabled={busy !== null}>
          <legend className={styles.legend}>When</legend>

          <label className={styles.choice}>
            <input
              type='radio'
              name='cancelMode'
              value='period_end'
              checked={mode === "period_end"}
              onChange={() => setMode("period_end")}
            />
            <span className={styles.choiceText}>
              <span className={styles.choiceTitle}>
                At the end of the billing period
              </span>
              <span className={styles.choiceDesc}>
                {periodEnd
                  ? `Access continues until ${periodEnd}. No further charges.`
                  : "Access continues until the current period closes. No further charges."}
              </span>
            </span>
          </label>

          <label className={styles.choice}>
            <input
              type='radio'
              name='cancelMode'
              value='now'
              checked={mode === "now"}
              onChange={() => setMode("now")}
            />
            <span className={styles.choiceText}>
              <span className={styles.choiceTitle}>Immediately</span>
              <span className={styles.choiceDesc}>
                Access ends now. Stripe does not refund the current period on
                its own.
              </span>
            </span>
          </label>
        </fieldset>
      )}

      <NoteField value={note} onChange={setNote} disabled={busy !== null} />

      <div className={styles.actions}>
        {confirming === null ? (
          <button
            type='button'
            className={styles.btnDanger}
            onClick={() => setConfirming(isFree ? "now" : mode)}
            disabled={busy !== null}
          >
            Cancel {label}
          </button>
        ) : (
          <ConfirmRow
            busy={busy === "cancel"}
            onBack={() => setConfirming(null)}
            onConfirm={() => runCancel(confirming)}
          />
        )}
      </div>

      <p className={styles.footnote}>
        This ends billing and portal access for this product only — the
        client&apos;s account, other product, documents, and invoices stay. It
        does not take a live site offline; that&apos;s still a manual step. The
        email tells them the site will be taken offline after access ends.
      </p>
    </div>
  );
}

function NoteField({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled: boolean;
}) {
  return (
    <div className={styles.noteField}>
      <label htmlFor='admin-cancel-note' className={styles.noteLabel}>
        Note to client (optional)
      </label>
      <textarea
        id='admin-cancel-note'
        className={styles.noteInput}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        maxLength={1000}
        rows={3}
        placeholder='e.g. Per our call on Friday. Thanks for the year, Barry.'
      />
      <p className={styles.noteHint}>
        The client gets an email right away saying who cancelled, when, when
        access ends, and this note if you add one. Replies come to you.
      </p>
    </div>
  );
}

function ConfirmRow({
  busy,
  onBack,
  onConfirm,
}: {
  busy: boolean;
  onBack: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className={styles.confirmRow}>
      <span className={styles.confirmLabel}>Are you sure?</span>
      <button
        type='button'
        className={styles.btnGhost}
        onClick={onBack}
        disabled={busy}
      >
        Go back
      </button>
      <button
        type='button'
        className={styles.btnDangerSolid}
        onClick={onConfirm}
        disabled={busy}
      >
        {busy ? "Cancelling…" : "Yes, cancel"}
      </button>
    </div>
  );
}
