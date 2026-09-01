"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import type { ProductType } from "@prisma/client";
import Modal from "@/components/shared/Modal/Modal";
import {
  adminCancelSubscription,
  adminResumeSubscription,
  getLiveSubscriptionSnapshot,
  type CancelMode,
  type InvoiceSweep,
} from "@/actions/admin/billingAdminActions";
import styles from "./AdminCancelSubscription.module.css";

const PRODUCT_LABELS: Record<ProductType, string> = {
  WEBSITE: "Custom Website",
  LEADS: "Leads Tool",
};

// Period boundaries are midnight UTC on the 1st (5 PM the day before in
// Arizona). Format them as billing dates in UTC so Sep 1 doesn't show as Aug 31.
const billingDate = (d: Date | string, style: "long" | "short") =>
  new Intl.DateTimeFormat("en-US", {
    month: style,
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(d));

const formatCents = (cents: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);

/** The slice of a Subscription row this control needs. Dates arrive as
 *  Date objects from the server component but are tolerated as strings. */
export type SubscriptionSnapshot = {
  status: string;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: Date | string | null;
  stripeSubscriptionId: string | null;
};

type Live =
  | { state: "loading" }
  | { state: "free" }
  | { state: "error"; message: string }
  | {
      state: "ok";
      status: string;
      cancelAtPeriodEnd: boolean;
      periodEnd: string | null;
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
  // Which mode the open modal is confirming; null = modal closed.
  const [confirming, setConfirming] = useState<CancelMode | null>(null);
  const [busy, setBusy] = useState<"cancel" | "resume" | null>(null);
  const [note, setNote] = useState("");
  const [live, setLive] = useState<Live>({ state: "loading" });
  const [outcome, setOutcome] = useState<InvoiceSweep | null>(null);

  const label = PRODUCT_LABELS[productType];
  const hasStripe = !!subscription?.stripeSubscriptionId;

  /* ── Ask Stripe what's actually true ──────────────────────────────────
     The stored period can lag a cycle behind; Stripe is the source of truth
     for "when does access end". The action also repairs the local row.   */

  useEffect(() => {
    if (!hasStripe) return;
    let cancelled = false;

    (async () => {
      const res = await getLiveSubscriptionSnapshot({
        clientProfileId,
        productType,
      });
      if (cancelled) return;
      if ("error" in res) {
        setLive({ state: "error", message: res.error });
        return;
      }
      if (!res.live) {
        setLive({ state: "free" });
        return;
      }
      setLive({
        state: "ok",
        status: res.status,
        cancelAtPeriodEnd: res.cancelAtPeriodEnd,
        periodEnd: res.periodEnd,
      });
      // The row was stale and just got corrected — re-render the page so the
      // status card above shows the same dates we do.
      if (res.synced) router.refresh();
    })();

    return () => {
      cancelled = true;
    };
  }, [clientProfileId, productType, hasStripe, router]);

  const closeModal = useCallback(() => {
    if (busy === "cancel") return; // don't allow dismiss mid-request
    setConfirming(null);
  }, [busy]);

  /* ── What just happened (persists across router.refresh) ───────────── */

  if (outcome) {
    return (
      <div className={styles.card}>
        <h3 className={styles.cardHeading}>{label} cancelled</h3>
        <OutcomePanel sweep={outcome} />
        <div className={styles.actions}>
          <button
            type='button'
            className={styles.btnGhost}
            onClick={() => setOutcome(null)}
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  // Prefer Stripe's view of status / flag over the stored row.
  const status = live.state === "ok" ? live.status : subscription?.status;
  const cancelAtPeriodEnd =
    live.state === "ok"
      ? live.cancelAtPeriodEnd
      : (subscription?.cancelAtPeriodEnd ?? false);

  // Nothing to cancel: not enrolled, never activated, or already cancelled.
  if (!subscription || status === "INACTIVE" || status === "CANCELLED") {
    return null;
  }

  const isFree = !hasStripe;
  const periodEndRaw =
    live.state === "ok" ? live.periodEnd : subscription.currentPeriodEnd;
  const periodEnd = periodEndRaw ? billingDate(periodEndRaw, "long") : null;
  const checking = hasStripe && live.state === "loading";

  const accessLine = checking
    ? "Checking the current billing period with Stripe…"
    : periodEnd
      ? `Access continues until ${periodEnd}. No further charges.`
      : "Access continues until the current period closes. No further charges.";

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
      setOutcome(
        res.invoices ?? {
          deletedDrafts: 0,
          voidedOpen: 0,
          leftOpen: [],
          refundCandidate: null,
          error: null,
        },
      );
    } else {
      const until = res.accessUntil
        ? billingDate(res.accessUntil, "short")
        : "the end of the period";
      toast.success(`${label} ends ${until}`);
      setLive((l) =>
        l.state === "ok"
          ? { ...l, cancelAtPeriodEnd: true, periodEnd: res.accessUntil }
          : l,
      );
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
    setLive((l) => (l.state === "ok" ? { ...l, cancelAtPeriodEnd: false } : l));
    router.refresh();
  };

  /* ── Cancellation already scheduled ─────────────────────────────────── */

  if (cancelAtPeriodEnd) {
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

        <div className={styles.actions}>
          <button
            type='button'
            className={styles.btnGhost}
            onClick={runResume}
            disabled={busy !== null}
          >
            {busy === "resume" ? "Resuming…" : "Keep subscription"}
          </button>
          <button
            type='button'
            className={styles.btnDanger}
            onClick={() => setConfirming("now")}
            disabled={busy !== null}
          >
            Cancel now instead
          </button>
        </div>

        <ConfirmModal
          open={confirming !== null}
          onClose={closeModal}
          onConfirm={() => runCancel("now")}
          busy={busy === "cancel"}
          label={label}
          mode='now'
          isFree={isFree}
          periodEnd={periodEnd}
          note={note}
          onNoteChange={setNote}
        />
      </div>
    );
  }

  /* ── Active / past due / paused — offer to cancel ───────────────────── */

  return (
    <div className={styles.card}>
      <h3 className={styles.cardHeading}>Cancel {label}</h3>

      {live.state === "error" && (
        <p className={styles.warnText}>
          Couldn&apos;t reach Stripe to confirm the billing period (
          {live.message}
          ). The date below is from the database and may be a cycle behind —
          Stripe still uses its own period end when you cancel.
        </p>
      )}

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
              <span className={styles.choiceDesc}>{accessLine}</span>
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
                Access ends now. Any unpaid invoice for the current period is
                voided so it&apos;s never collected. If the current period was
                already paid, you&apos;ll get a link to refund it in Stripe —
                refunds are never automatic.
              </span>
            </span>
          </label>
        </fieldset>
      )}

      <div className={styles.actions}>
        <button
          type='button'
          className={styles.btnDanger}
          onClick={() => setConfirming(isFree ? "now" : mode)}
          disabled={busy !== null || checking}
        >
          Cancel {label}
        </button>
      </div>

      <ConfirmModal
        open={confirming !== null}
        onClose={closeModal}
        onConfirm={() => confirming && runCancel(confirming)}
        busy={busy === "cancel"}
        label={label}
        mode={confirming ?? mode}
        isFree={isFree}
        periodEnd={periodEnd}
        note={note}
        onNoteChange={setNote}
      />

      <p className={styles.footnote}>
        This ends billing and portal access for this product only — the
        client&apos;s account, other product, documents, and invoices stay. It
        does not take a live site offline; that&apos;s still a manual step. The
        email tells them the site will be taken offline after access ends.
      </p>
    </div>
  );
}

function OutcomePanel({ sweep }: { sweep: InvoiceSweep }) {
  const nothingFound =
    !sweep.error &&
    sweep.deletedDrafts === 0 &&
    sweep.voidedOpen === 0 &&
    sweep.leftOpen.length === 0 &&
    !sweep.refundCandidate;

  return (
    <div className={styles.outcome}>
      <p className={styles.body}>
        The subscription is cancelled in Stripe and the client has been emailed.
      </p>

      {sweep.error && (
        <p className={styles.warnText}>
          Couldn&apos;t check this subscription&apos;s invoices ({sweep.error}).
          Open the customer in Stripe and look for an invoice covering the
          current period.
        </p>
      )}

      {nothingFound && (
        <p className={styles.okText}>
          No invoice for the current period was found — nothing to void or
          refund.
        </p>
      )}

      {sweep.deletedDrafts > 0 && (
        <p className={styles.okText}>
          Deleted {sweep.deletedDrafts} draft renewal invoice
          {sweep.deletedDrafts === 1 ? "" : "s"} before it could be charged.
        </p>
      )}

      {sweep.voidedOpen > 0 && (
        <p className={styles.okText}>
          Voided {sweep.voidedOpen} unpaid invoice
          {sweep.voidedOpen === 1 ? "" : "s"} for the current period. Nothing
          will be collected.
        </p>
      )}

      {sweep.refundCandidate && (
        <div className={styles.refundBox}>
          <span className={styles.scheduledTitle}>Refund needed</span>
          <p className={styles.body}>
            The current period was already paid —{" "}
            {formatCents(sweep.refundCandidate.amountCents)} covering through{" "}
            {billingDate(sweep.refundCandidate.paidThrough, "long")}. Cancelling
            doesn&apos;t refund it. Open the invoice, click the payment, and
            refund it in full. Stripe keeps its processing fee; the client sees
            the money in 5–10 business days.
          </p>
          <a
            href={sweep.refundCandidate.dashboardUrl}
            target='_blank'
            rel='noopener noreferrer'
            className={styles.btnGhost}
          >
            Open invoice in Stripe ↗
          </a>
        </div>
      )}

      {sweep.leftOpen.length > 0 && (
        <div className={styles.outcomeList}>
          <p className={styles.body}>
            Left alone: {sweep.leftOpen.length} unpaid invoice
            {sweep.leftOpen.length === 1 ? "" : "s"} for a period that&apos;s
            already been used. Collect or void{" "}
            {sweep.leftOpen.length === 1 ? "it" : "them"} in Stripe.
          </p>
          {sweep.leftOpen.map((inv) => (
            <a
              key={inv.invoiceId}
              href={inv.dashboardUrl}
              target='_blank'
              rel='noopener noreferrer'
              className={styles.btnGhost}
            >
              {formatCents(inv.amountCents)} · {inv.invoiceId} ↗
            </a>
          ))}
        </div>
      )}
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

function ConfirmModal({
  open,
  onClose,
  onConfirm,
  busy,
  label,
  mode,
  isFree,
  periodEnd,
  note,
  onNoteChange,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  busy: boolean;
  label: string;
  mode: CancelMode;
  isFree: boolean;
  periodEnd: string | null;
  note: string;
  onNoteChange: (v: string) => void;
}) {
  const detail = isFree
    ? "This is immediate — there's nothing in Stripe, so their access ends right away."
    : mode === "now"
      ? "This is immediate — their access ends right away. Any unpaid invoice for the current period is voided, and if it was already paid you'll get a link to refund it."
      : periodEnd
        ? `They keep access until ${periodEnd}. No further charges after that.`
        : "They keep access until the current billing period closes. No further charges after that.";

  return (
    <Modal isOpen={open} onClose={onClose}>
      <div className={styles.modalBody}>
        <p className={styles.modalTitle}>
          Are you sure you want to cancel {label} for this client?
        </p>
        <p className={styles.modalDetail}>{detail}</p>

        <NoteField value={note} onChange={onNoteChange} disabled={busy} />

        <div className={styles.modalActions}>
          <button
            type='button'
            className={styles.btnDangerSolid}
            onClick={onConfirm}
            disabled={busy}
          >
            {busy ? "Cancelling…" : "Yes, cancel"}
          </button>
          <button
            type='button'
            className={styles.btnGhost}
            onClick={onClose}
            disabled={busy}
          >
            Keep subscription
          </button>
        </div>
      </div>
    </Modal>
  );
}
