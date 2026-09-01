"use server";

import Stripe from "stripe";
import { Prisma, type ProductType } from "@prisma/client";
import { auth } from "../../../auth";
import { db } from "@/lib/db";
import stripe from "@/lib/stripe";
import { APP_URL } from "@/lib/email";
import { sendPlanCancelledByAdminEmail } from "@/lib/emails";
import {
  getBillingState,
  retryOpenInvoices,
  type BillingState,
  type InvoiceRetryResult,
} from "@/lib/billing";

/* ────────────────────────────────────────────────────────────────────────────
   Admin guard

   Uses an explicit `ok` discriminant rather than `"error" in res`. TypeScript's
   `in` narrowing does NOT drop branches where the property is optional, and
   inferring a union from differently-shaped object literals makes the missing
   keys optional — which is why `res.error` came back as `string | undefined`
   and every caller inherited it all the way down to toast.error().
   ──────────────────────────────────────────────────────────────────────────*/

const adminClientSelect = {
  id: true,
  businessName: true,
  stripeCustomerId: true,
  user: { select: { email: true, name: true } },
  subscriptions: {
    select: {
      productType: true,
      status: true,
      stripeSubscriptionId: true,
    },
  },
} satisfies Prisma.ClientProfileSelect;

type AdminClient = Prisma.ClientProfileGetPayload<{
  select: typeof adminClientSelect;
}>;

type AdminIdentity = { name: string | null; email: string | null };

type Guard =
  | { ok: false; error: string }
  | { ok: true; profile: AdminClient; admin: AdminIdentity };

/**
 * Every action here resolves the Stripe customer id from the client record
 * SERVER-SIDE after an admin check. A customer id is never accepted from the
 * request — that would be a straight IDOR into any customer's billing.
 */
async function requireAdminClient(clientProfileId: string): Promise<Guard> {
  const session = await auth();
  if (!session?.user?.roles?.includes("ADMIN")) {
    return { ok: false, error: "Unauthorized" };
  }

  const profile = await db.clientProfile.findUnique({
    where: { id: clientProfileId },
    select: adminClientSelect,
  });

  if (!profile) return { ok: false, error: "Client not found" };
  return {
    ok: true,
    profile,
    admin: {
      name: session.user.name ?? null,
      email: session.user.email ?? null,
    },
  };
}

/* ────────────────────────────────────────────────────────────────────────────
   Return shapes — annotated explicitly so the client narrows on `"error" in`
   without inheriting an optional-undefined union.
   ──────────────────────────────────────────────────────────────────────────*/

export type BillingStateResult =
  | { error: string }
  | {
      billing: BillingState;
      businessName: string;
      email: string | null;
      products: { productType: string; status: string; subId: string | null }[];
    };

export type PortalLinkResult =
  | { error: string }
  | { url: string; expiresNote: string };

export type CollectResult =
  | { error: string }
  | { results: InvoiceRetryResult[] };

export type SyncResult = { error: string } | { synced: number };

/* ── Read the full billing picture ──────────────────────────────────────── */

export async function getClientBillingState(
  clientProfileId: string,
): Promise<BillingStateResult> {
  const res = await requireAdminClient(clientProfileId);
  if (!res.ok) return { error: res.error };
  const { profile } = res;

  const subIds = profile.subscriptions
    .map((s) => s.stripeSubscriptionId)
    .filter((id): id is string => !!id);

  const billing = await getBillingState(profile.stripeCustomerId, subIds);

  return {
    billing,
    businessName: profile.businessName,
    email: profile.user.email,
    products: profile.subscriptions.map((s) => ({
      productType: s.productType,
      status: s.status,
      subId: s.stripeSubscriptionId,
    })),
  };
}

/* ── Generate a Stripe-hosted portal link to send the client ────────────── */

export async function createClientPortalLink(
  clientProfileId: string,
): Promise<PortalLinkResult> {
  const res = await requireAdminClient(clientProfileId);
  if (!res.ok) return { error: res.error };
  const { profile } = res;

  if (!profile.stripeCustomerId) return { error: "No Stripe customer on file" };

  try {
    const portal = await stripe.billingPortal.sessions.create({
      customer: profile.stripeCustomerId,
      return_url: `${APP_URL}/dashboard/billing/website`,
    });
    return { url: portal.url, expiresNote: "Single use. Expires shortly." };
  } catch (err) {
    const e = err as Stripe.errors.StripeError;
    console.error("[createClientPortalLink]", e.code, e.message);
    // The most common first-run failure, called out explicitly.
    if (e.message?.includes("configuration")) {
      return {
        error:
          "The Stripe Customer Portal isn't configured yet. Stripe Dashboard → Settings → Billing → Customer portal → activate (once per mode).",
      };
    }
    return { error: e.message ?? "Could not create a portal link." };
  }
}

/* ── Collect anything owed, now ─────────────────────────────────────────── */

export async function collectClientOpenInvoices(
  clientProfileId: string,
): Promise<CollectResult> {
  const res = await requireAdminClient(clientProfileId);
  if (!res.ok) return { error: res.error };
  const { profile } = res;

  if (!profile.stripeCustomerId) return { error: "No Stripe customer on file" };

  try {
    const results = await retryOpenInvoices(profile.stripeCustomerId);
    return { results };
  } catch (err) {
    const e = err as Stripe.errors.StripeError;
    console.error("[collectClientOpenInvoices]", e.code, e.message);
    return { error: e.message ?? "Collection failed." };
  }
}

/* ── Repair drift: point every subscription at the customer default ─────── */

export async function syncClientDefaultCard(
  clientProfileId: string,
): Promise<SyncResult> {
  const res = await requireAdminClient(clientProfileId);
  if (!res.ok) return { error: res.error };
  const { profile } = res;

  if (!profile.stripeCustomerId) return { error: "No Stripe customer on file" };

  try {
    const customer = await stripe.customers.retrieve(profile.stripeCustomerId);
    if (customer.deleted) return { error: "Stripe customer is deleted" };

    const defaultPm =
      typeof customer.invoice_settings?.default_payment_method === "string"
        ? customer.invoice_settings.default_payment_method
        : (customer.invoice_settings?.default_payment_method?.id ?? null);

    if (!defaultPm) return { error: "No default card on the customer to sync" };

    let synced = 0;
    for (const sub of profile.subscriptions) {
      if (!sub.stripeSubscriptionId) continue;
      if (["CANCELLED", "INACTIVE"].includes(sub.status)) continue;
      await stripe.subscriptions.update(sub.stripeSubscriptionId, {
        default_payment_method: defaultPm,
      });
      synced++;
    }

    return { synced };
  } catch (err) {
    const e = err as Stripe.errors.StripeError;
    console.error("[syncClientDefaultCard]", e.code, e.message);
    return { error: e.message ?? "Sync failed." };
  }
}

/* ── Cancel / resume ONE product (admin-initiated) ──────────────────────── */

const PRODUCT_LABELS: Record<ProductType, string> = {
  WEBSITE: "Custom Website",
  LEADS: "Leads Tool",
};

export type CancelMode = "period_end" | "now";

export type AdminCancelResult =
  | { error: string }
  | { success: true; immediate: true }
  | { success: true; immediate: false; accessUntil: string | null };

export type AdminResumeResult = { error: string } | { success: true };

/**
 * Cancel a single product for a client. The other product and the client
 * record itself are untouched — this is the opposite of deleteClient.
 *
 * Stripe-backed sub:
 *   - "period_end"  → cancel_at_period_end in Stripe. Client keeps access
 *                     until currentPeriodEnd. The existing
 *                     customer.subscription.deleted webhook flips the row to
 *                     CANCELLED when the period actually ends.
 *   - "now"         → row is marked CANCELLED locally FIRST, then cancelled in
 *                     Stripe. The webhook sees the row already CANCELLED and
 *                     skips its generic email, so the client gets exactly one
 *                     notice — the detailed one sent here. If Stripe rejects
 *                     the cancel, the local row is rolled back.
 *
 * Free / founding sub (no Stripe id): there is no period to run out, so both
 * modes end it right now.
 *
 * In every success path the client is emailed who cancelled, when, when
 * access ends, and any note you attach.
 *
 * Note: this ends billing and portal access. It does NOT take a live site
 * offline — that's still a manual step.
 */
export async function adminCancelSubscription({
  clientProfileId,
  productType,
  mode,
  note,
}: {
  clientProfileId: string;
  productType: ProductType;
  mode: CancelMode;
  /** Optional message to the client, included in the email. */
  note?: string;
}): Promise<AdminCancelResult> {
  const res = await requireAdminClient(clientProfileId);
  if (!res.ok) return { error: res.error };
  const { profile, admin } = res;
  const label = PRODUCT_LABELS[productType];

  const sub = await db.subscription.findUnique({
    where: { clientProfileId_productType: { clientProfileId, productType } },
  });

  if (!sub) return { error: `No ${label} subscription on this client` };
  if (sub.status === "CANCELLED") {
    return { error: `${label} is already cancelled` };
  }
  if (sub.status === "INACTIVE") {
    return { error: `${label} was never activated — nothing to cancel` };
  }

  const cancelledAt = new Date();
  const cleanNote = note?.trim().slice(0, 1000) || undefined;

  const endNow = () =>
    db.subscription.update({
      where: { id: sub.id },
      data: {
        status: "CANCELLED",
        cancelledAt,
        cancelAtPeriodEnd: false,
      },
    });

  // Put the row back exactly as we found it if Stripe refuses the cancel.
  const rollback = () =>
    db.subscription.update({
      where: { id: sub.id },
      data: {
        status: sub.status,
        cancelledAt: sub.cancelledAt,
        cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
      },
    });

  const notifyClient = async (accessEndsAt: Date | null) => {
    if (!profile.user.email) return;
    await sendPlanCancelledByAdminEmail({
      to: profile.user.email,
      name: profile.user.name ?? "there",
      businessName: profile.businessName,
      productType,
      productLabel: label,
      cancelledBy: admin.name?.trim() || "Fonts & Footers",
      cancelledAt,
      accessEndsAt,
      planAmountCents: sub.planAmountCents,
      note: cleanNote,
    });
  };

  // Free / founding subscription — nothing in Stripe to schedule against.
  if (!sub.stripeSubscriptionId) {
    await endNow();
    await notifyClient(null);
    return { success: true, immediate: true };
  }

  if (mode === "now") {
    await endNow();
    try {
      await stripe.subscriptions.cancel(sub.stripeSubscriptionId);
    } catch (err) {
      const e = err as Stripe.errors.StripeError;
      console.error("[adminCancelSubscription:now]", e.code, e.message);

      // Stripe already considers this sub gone (deleted or cancelled there
      // directly). Our local row is now correct — keep it.
      const goneInStripe =
        e.code === "resource_missing" ||
        /canceled subscription/i.test(e.message ?? "");
      if (!goneInStripe) {
        await rollback();
        return { error: e.message ?? "Could not cancel the subscription." };
      }
    }
    await notifyClient(null);
    return { success: true, immediate: true };
  }

  // mode === "period_end"
  if (sub.cancelAtPeriodEnd) {
    return { error: "Cancellation is already scheduled" };
  }

  try {
    await stripe.subscriptions.update(sub.stripeSubscriptionId, {
      cancel_at_period_end: true,
    });
  } catch (err) {
    const e = err as Stripe.errors.StripeError;
    console.error("[adminCancelSubscription:period_end]", e.code, e.message);
    return { error: e.message ?? "Could not schedule the cancellation." };
  }

  await db.subscription.update({
    where: { id: sub.id },
    data: { cancelAtPeriodEnd: true },
  });
  await notifyClient(sub.currentPeriodEnd);

  return {
    success: true,
    immediate: false,
    accessUntil: sub.currentPeriodEnd?.toISOString() ?? null,
  };
}

/** Undo a scheduled period-end cancellation. Only meaningful for Stripe subs. */
export async function adminResumeSubscription({
  clientProfileId,
  productType,
}: {
  clientProfileId: string;
  productType: ProductType;
}): Promise<AdminResumeResult> {
  const res = await requireAdminClient(clientProfileId);
  if (!res.ok) return { error: res.error };

  const sub = await db.subscription.findUnique({
    where: { clientProfileId_productType: { clientProfileId, productType } },
  });

  if (!sub) {
    return { error: `No ${PRODUCT_LABELS[productType]} subscription found` };
  }
  if (!sub.cancelAtPeriodEnd || !sub.stripeSubscriptionId) {
    return { error: "No scheduled cancellation to undo" };
  }

  try {
    await stripe.subscriptions.update(sub.stripeSubscriptionId, {
      cancel_at_period_end: false,
    });
    await db.subscription.update({
      where: { id: sub.id },
      data: { cancelAtPeriodEnd: false },
    });
    return { success: true };
  } catch (err) {
    const e = err as Stripe.errors.StripeError;
    console.error("[adminResumeSubscription]", e.code, e.message);
    return { error: e.message ?? "Could not resume the subscription." };
  }
}
