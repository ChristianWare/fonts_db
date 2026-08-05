import { Resend } from "resend";
import {
  ADMIN_EMAIL,
  FROM_ADDRESS,
  APP_URL,
  buildEmailHTML,
  bodyText,
  bodyDetail,
} from "@/lib/email";

const resend = new Resend(process.env.RESEND_API_KEY!);

/**
 * Carrier email-to-SMS gateway for the admin phone, e.g.
 *   ADMIN_SMS_GATEWAY="6025551234@vtext.com"
 * Verizon @vtext.com · AT&T @txt.att.net · T-Mobile @tmomail.net
 *
 * Leave unset and alerts become email-only — nothing breaks.
 */
const ADMIN_SMS = process.env.ADMIN_SMS_GATEWAY;

/**
 * Text on every successful payment. Fine at 1–5 clients, noise at 20 — on the
 * 1st of the month that's one buzz per client in about five minutes. Flip to
 * false when it stops being fun; the emails keep arriving either way.
 */
const SMS_ON_SUCCESS = true;

const formatCents = (cents: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);

type AdminAlert = {
  /** Terse line for SMS. Keep under ~140 chars — one segment. */
  sms: string;
  /** Whether this one earns a phone buzz. */
  textIt: boolean;
  subject: string;
  /** Email body lines, rendered as paragraphs. */
  lines: string[];
  details?: Array<[label: string, value: string]>;
  /** Path relative to APP_URL, e.g. /admin/clients/abc123/website */
  path?: string;
};

/**
 * Fire-and-forget. Never throws — an alert failure must not fail the webhook,
 * because Stripe would retry the whole event and you'd double-process it.
 */
export async function notifyAdmin(alert: AdminAlert): Promise<void> {
  const url = alert.path ? `${APP_URL}${alert.path}` : undefined;

  // ── Email (always) ──────────────────────────────────────────────────
  try {
    const html = buildEmailHTML({
      preheader: alert.sms,
      heading: alert.subject,
      isAdmin: true,
      body: [
        ...alert.lines.map((l) => bodyText(l)),
        ...(alert.details ?? []).map(([label, value]) =>
          bodyDetail(label, value),
        ),
      ].join(""),
      ...(url ? { ctaLabel: "Open in admin", ctaUrl: url } : {}),
    });

    await resend.emails.send({
      from: FROM_ADDRESS,
      to: ADMIN_EMAIL,
      subject: alert.subject,
      html,
    });
  } catch (err) {
    console.error("[notifyAdmin] email failed:", err);
  }

  // ── SMS via carrier gateway (selective) ─────────────────────────────
  if (!ADMIN_SMS || !alert.textIt) return;

  try {
    await resend.emails.send({
      from: FROM_ADDRESS,
      to: ADMIN_SMS,
      // Gateways prepend the subject to the message body — keep it empty so
      // the text arrives as one clean line.
      subject: "",
      text: alert.sms,
    });
  } catch (err) {
    console.error("[notifyAdmin] SMS gateway failed:", err);
  }
}

/* ────────────────────────────────────────────────────────────────────────────
   Billing events
   ──────────────────────────────────────────────────────────────────────────*/

export async function alertPaymentReceived(p: {
  businessName: string;
  productLabel: string;
  amountCents: number;
  invoiceNumber: string | null;
  clientProfileId: string;
}) {
  return notifyAdmin({
    textIt: SMS_ON_SUCCESS,
    sms: `${formatCents(p.amountCents)} collected from ${p.businessName} - ${p.productLabel}`,
    subject: `Payment received — ${p.businessName}`,
    lines: [`${formatCents(p.amountCents)} collected from ${p.businessName}.`],
    details: [
      ["Product", p.productLabel],
      ["Invoice", p.invoiceNumber ?? "—"],
    ],
    path: `/admin/clients/${p.clientProfileId}/website`,
  });
}

export async function alertPaymentFailed(p: {
  businessName: string;
  productLabel: string;
  amountCents: number;
  reason: string | null;
  cardLabel: string | null;
  nextRetryAt: Date | null;
  clientProfileId: string;
}) {
  const retry = p.nextRetryAt
    ? p.nextRetryAt.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })
    : "no further retries";

  return notifyAdmin({
    textIt: true,
    sms: `DECLINED ${formatCents(p.amountCents)} - ${p.businessName}. ${p.reason ?? "card declined"}. Retry ${retry}.`,
    subject: `Payment declined — ${p.businessName}`,
    lines: [
      `${formatCents(p.amountCents)} failed for ${p.businessName}. That subscription is now past due.`,
    ],
    details: [
      ["Product", p.productLabel],
      ["Card", p.cardLabel ?? "unknown"],
      ["Reason", p.reason ?? "declined"],
      ["Next retry", retry],
    ],
    path: `/admin/clients/${p.clientProfileId}/website`,
  });
}

/** The event Stripe won't alert you on at all. */
export async function alertCardUpdated(p: {
  businessName: string;
  brand: string;
  last4: string;
  hasOpenInvoice: boolean;
  clientProfileId: string;
}) {
  const owed = p.hasOpenInvoice ? " - OPEN INVOICE, collect now" : "";
  return notifyAdmin({
    textIt: true,
    sms: `${p.businessName} added ${p.brand} ****${p.last4}${owed}`,
    subject: `Card updated — ${p.businessName}`,
    lines: [
      `${p.businessName} added a new ${p.brand} ending ${p.last4}.`,
      p.hasOpenInvoice
        ? "They have an open invoice. Hit Collect Now on their billing tab."
        : "Nothing outstanding — no action needed.",
    ],
    path: `/admin/clients/${p.clientProfileId}/website`,
  });
}

export async function alertSubscriptionCancelled(p: {
  businessName: string;
  productLabel: string;
  amountCents: number;
  clientProfileId: string;
}) {
  return notifyAdmin({
    textIt: true,
    sms: `CHURN: ${p.businessName} cancelled ${p.productLabel} (${formatCents(p.amountCents)}/mo)`,
    subject: `Subscription cancelled — ${p.businessName}`,
    lines: [
      `${p.businessName} cancelled ${p.productLabel}. That's ${formatCents(p.amountCents)}/mo off MRR.`,
    ],
    path: `/admin/clients/${p.clientProfileId}/website`,
  });
}
