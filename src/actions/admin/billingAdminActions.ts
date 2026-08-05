"use server";

import Stripe from "stripe";
import { Prisma } from "@prisma/client";
import { auth } from "../../../auth";
import { db } from "@/lib/db";
import stripe from "@/lib/stripe";
import { APP_URL } from "@/lib/email";
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

type Guard = { ok: false; error: string } | { ok: true; profile: AdminClient };

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
  return { ok: true, profile };
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
