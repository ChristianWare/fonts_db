"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import toast from "react-hot-toast";
import {
  getClientBillingState,
  createClientPortalLink,
  collectClientOpenInvoices,
  syncClientDefaultCard,
} from "@/actions/admin/billingAdminActions";
import type { BillingState } from "@/lib/billing";
import styles from "./AdminBillingPanel.module.css";

const formatCents = (cents: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);

export default function AdminBillingPanel({
  clientProfileId,
}: {
  clientProfileId: string;
}) {
  const router = useRouter();
  const [billing, setBilling] = useState<BillingState | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [portalUrl, setPortalUrl] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  /* ── Fetch ──────────────────────────────────────────────────────────────
     The effect body starts with an await, so no setState runs synchronously
     during the effect — that's what react-hooks/set-state-in-effect flags.
     Resetting to the loading state happens in `reload()`, an event handler.  */

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await getClientBillingState(clientProfileId);
        if (cancelled) return;
        if ("error" in res) setLoadError(res.error);
        else setBilling(res.billing);
      } catch (err) {
        console.error("[AdminBillingPanel] load failed:", err);
        if (!cancelled) {
          setLoadError("Couldn't reach the billing service. Try again.");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [clientProfileId, reloadToken]);

  const reload = () => {
    setBilling(null);
    setLoadError(null);
    setReloadToken((t) => t + 1);
  };

  /* ── Actions ────────────────────────────────────────────────────────── */

  const handlePortalLink = async () => {
    setBusy("portal");
    const res = await createClientPortalLink(clientProfileId);
    setBusy(null);
    if ("error" in res) {
      toast.error(res.error);
      return;
    }
    setPortalUrl(res.url);
    await navigator.clipboard.writeText(res.url).catch(() => {});
    toast.success("Portal link copied to clipboard");
  };

  const handleCollect = async () => {
    setBusy("collect");
    const res = await collectClientOpenInvoices(clientProfileId);
    setBusy(null);
    if ("error" in res) {
      toast.error(res.error);
      return;
    }

    const paid = res.results.filter((r) => r.status === "paid");
    const needsAuth = res.results.find((r) => r.status === "action_required");
    const failed = res.results.filter((r) => r.status === "failed");

    if (paid.length) {
      toast.success(
        `Collected ${formatCents(paid.reduce((s, r) => s + r.amountCents, 0))}`,
      );
    }
    if (needsAuth) {
      toast("Card needs authentication — send the hosted invoice link.", {
        icon: "!",
      });
      if (needsAuth.hostedInvoiceUrl) setPortalUrl(needsAuth.hostedInvoiceUrl);
    }
    if (failed.length) toast.error(failed[0].message ?? "Payment declined");
    if (!res.results.length) toast("Nothing open to collect.");

    reload();
    router.refresh();
  };

  const handleSync = async () => {
    setBusy("sync");
    const res = await syncClientDefaultCard(clientProfileId);
    setBusy(null);
    if ("error" in res) {
      toast.error(res.error);
      return;
    }
    toast.success(`Synced ${res.synced} subscription(s) to the default card`);
    reload();
  };

  /* ── State 1: loading ───────────────────────────────────────────────── */

  if (!billing && !loadError) {
    return (
      <div className={styles.card}>
        <h3 className={styles.cardHeading}>Payment Method</h3>
        <p className={styles.muted}>Loading billing from Stripe…</p>
      </div>
    );
  }

  /* ── State 2: the fetch itself broke (NOT the same as "no card") ────── */

  if (loadError || billing?.state === "error") {
    const msg =
      loadError ?? (billing?.state === "error" ? billing.message : "Unknown");
    return (
      <div className={styles.card}>
        <h3 className={styles.cardHeading}>Payment Method</h3>
        <div className={styles.errorBox}>
          <span className={styles.errorTitle}>Couldn&apos;t load billing</span>
          <p className={styles.errorBody}>{msg}</p>
          <p className={styles.errorHint}>
            This is a Stripe/connection failure — it does <b>not</b> mean the
            client has no card.
          </p>
        </div>
        <button onClick={reload} className={styles.btnGhost} type='button'>
          Retry
        </button>
      </div>
    );
  }

  /* ── State 3: no Stripe customer at all ─────────────────────────────── */

  if (billing?.state === "no_customer") {
    return (
      <div className={styles.card}>
        <h3 className={styles.cardHeading}>Payment Method</h3>
        <p className={styles.muted}>
          This client has no Stripe customer yet. One is created when they
          complete billing enrollment.
        </p>
      </div>
    );
  }

  if (billing?.state !== "ok") return null;

  const {
    cards,
    subscriptions,
    openInvoices,
    lastFailure,
    hasMismatch,
    keyMode,
    customerId,
  } = billing;

  const defaultCard = cards.find((c) => c.isCustomerDefault) ?? null;
  const totalOwed = openInvoices.reduce((s, i) => s + i.amountDueCents, 0);
  const driftedSubs = subscriptions.filter(
    (s) =>
      s.effectivePaymentMethodId &&
      defaultCard &&
      s.effectivePaymentMethodId !== defaultCard.paymentMethodId,
  );

  return (
    <div className={styles.card}>
      <div className={styles.headRow}>
        <h3 className={styles.cardHeading}>Payment Method</h3>
        {keyMode === "test" && (
          <span className={styles.testBadge}>Test mode</span>
        )}
      </div>

      {/* ── Amount owed banner ───────────────────────────────────────── */}
      {totalOwed > 0 && (
        <div className={styles.owedBanner}>
          <div>
            <span className={styles.owedAmount}>{formatCents(totalOwed)}</span>
            <span className={styles.owedLabel}>
              owed across {openInvoices.length} open invoice
              {openInvoices.length === 1 ? "" : "s"}
            </span>
          </div>
          <button
            onClick={handleCollect}
            disabled={busy !== null || !defaultCard}
            className={styles.btnPrimary}
            type='button'
          >
            {busy === "collect" ? "Collecting…" : "Collect now"}
          </button>
        </div>
      )}

      {/* ── Last failure ─────────────────────────────────────────────── */}
      {lastFailure && (
        <div className={styles.failureRow}>
          <span className={styles.failureLabel}>Last decline</span>
          <span className={styles.failureValue}>
            {formatCents(lastFailure.amountCents)} on{" "}
            {lastFailure.cardLabel ?? "unknown card"} —{" "}
            {lastFailure.message ?? lastFailure.declineCode ?? "declined"}{" "}
            <span className={styles.muted}>
              ({format(new Date(lastFailure.failedAt), "MMM d")})
            </span>
          </span>
        </div>
      )}

      {/* ── Cards on file ────────────────────────────────────────────── */}
      {cards.length === 0 ? (
        <p className={styles.muted}>
          No card on file. Stripe reached successfully — this client genuinely
          hasn&apos;t added one.
        </p>
      ) : (
        <div className={styles.cardList}>
          {cards.map((c) => (
            <div key={c.paymentMethodId} className={styles.cardRow}>
              <div className={styles.cardLeft}>
                <span className={styles.cardBrand}>{c.brand}</span>
                <span className={styles.cardDigits}>•••• {c.last4}</span>
                <span className={styles.cardMeta}>
                  Exp {String(c.expMonth).padStart(2, "0")}/
                  {String(c.expYear).slice(-2)}
                </span>
                {c.expiringSoon && (
                  <span className={styles.warnPill}>Expiring soon</span>
                )}
              </div>
              <div className={styles.cardRight}>
                {c.isCustomerDefault && (
                  <span className={styles.defaultPill}>Default</span>
                )}
                <span className={styles.cardMeta}>
                  Added {format(new Date(c.addedAt), "MMM d, yyyy")}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── What each subscription will actually charge ──────────────── */}
      {subscriptions.length > 0 && (
        <div className={styles.subList}>
          <span className={styles.subHeading}>Charges on renewal</span>
          {subscriptions.map((s) => (
            <div key={s.stripeSubscriptionId} className={styles.subRow}>
              <span className={styles.subStatus}>{s.stripeStatus}</span>
              <span className={styles.subCard}>
                {s.effectiveCardLabel ?? "— no card resolved —"}
                {s.usesCustomerDefault && (
                  <span className={styles.muted}> (customer default)</span>
                )}
              </span>
            </div>
          ))}
        </div>
      )}

      {(hasMismatch || driftedSubs.length > 0) && (
        <div className={styles.warnBox}>
          <b>Card drift detected.</b> At least one subscription charges a
          different card than the customer default — a renewal will hit the
          wrong card.
          <button
            onClick={handleSync}
            disabled={busy !== null}
            className={styles.btnGhost}
            type='button'
          >
            {busy === "sync" ? "Syncing…" : "Sync all to default"}
          </button>
        </div>
      )}

      {/* ── Actions ──────────────────────────────────────────────────── */}
      <div className={styles.actions}>
        <button
          onClick={handlePortalLink}
          disabled={busy !== null}
          className={styles.btnPrimary}
          type='button'
        >
          {busy === "portal" ? "Generating…" : "Copy card-update link"}
        </button>

        {openInvoices.map((inv) =>
          inv.hostedInvoiceUrl ? (
            <a
              key={inv.invoiceId}
              href={inv.hostedInvoiceUrl}
              target='_blank'
              rel='noopener noreferrer'
              className={styles.btnGhost}
            >
              Open {inv.invoiceNumber ?? "invoice"} ·{" "}
              {formatCents(inv.amountDueCents)}
            </a>
          ) : null,
        )}

        <a
          href={`https://dashboard.stripe.com${keyMode === "test" ? "/test" : ""}/customers/${customerId}`}
          target='_blank'
          rel='noopener noreferrer'
          className={styles.btnGhost}
        >
          View in Stripe ↗
        </a>
      </div>

      {portalUrl && (
        <div className={styles.linkBox}>
          <span className={styles.linkLabel}>
            Send this to the client — they enter the card themselves on
            Stripe&apos;s page:
          </span>
          <code className={styles.linkCode}>{portalUrl}</code>
        </div>
      )}

      <p className={styles.footnote}>
        Card details are entered by the cardholder on Stripe&apos;s hosted page.
        Never take a card number over the phone — a charge you key in yourself
        has no cardholder authentication behind it in a dispute.
      </p>
    </div>
  );
}
