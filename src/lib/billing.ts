import Stripe from "stripe";
import stripe from "@/lib/stripe";

/* ────────────────────────────────────────────────────────────────────────────
   Types
   ──────────────────────────────────────────────────────────────────────────*/

export type CardOnFile = {
  paymentMethodId: string;
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
  /** ISO date the card was attached — answers "did they actually update it?" */
  addedAt: string;
  isCustomerDefault: boolean;
  /** True when the card expires within 60 days (or already has). */
  expiringSoon: boolean;
};

export type SubscriptionCharge = {
  stripeSubscriptionId: string;
  stripeStatus: string;
  /** The PM this subscription will actually charge. */
  effectivePaymentMethodId: string | null;
  effectiveCardLabel: string | null;
  /** False when the sub has its own default that differs from the customer's. */
  usesCustomerDefault: boolean;
};

export type OpenInvoice = {
  invoiceId: string;
  invoiceNumber: string | null;
  amountDueCents: number;
  hostedInvoiceUrl: string | null;
  createdAt: string;
  collectionMethod: string;
};

export type LastFailure = {
  chargeId: string;
  amountCents: number;
  failedAt: string;
  cardLabel: string | null;
  /** Stripe's plain-English reason, e.g. "Transaction not allowed". */
  message: string | null;
  declineCode: string | null;
};

export type BillingState =
  | { state: "no_customer" }
  | { state: "error"; message: string; code: string | null }
  | {
      state: "ok";
      customerId: string;
      keyMode: "live" | "test";
      cards: CardOnFile[];
      defaultPaymentMethodId: string | null;
      subscriptions: SubscriptionCharge[];
      openInvoices: OpenInvoice[];
      lastFailure: LastFailure | null;
      /** Any subscription pointing at a card that no longer exists. */
      hasMismatch: boolean;
    };

/* ────────────────────────────────────────────────────────────────────────────
   Helpers
   ──────────────────────────────────────────────────────────────────────────*/

const cardLabel = (pm?: Stripe.PaymentMethod | null) =>
  pm?.card ? `${pm.card.brand} ••••${pm.card.last4}` : null;

function isExpiringSoon(expMonth: number, expYear: number): boolean {
  // Cards die at the END of their expiry month.
  const expiry = new Date(expYear, expMonth, 1);
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() + 60);
  return expiry <= cutoff;
}

/**
 * Reads everything worth knowing about a customer's billing in one pass.
 *
 * Deliberately returns a discriminated union rather than null on failure:
 * "no card on file" and "we couldn't reach Stripe" are different facts and
 * must never render the same way.
 */
export async function getBillingState(
  stripeCustomerId: string | null,
  subscriptionIds: string[] = [],
): Promise<BillingState> {
  if (!stripeCustomerId) return { state: "no_customer" };

  const keyMode = process.env.STRIPE_SECRET_KEY?.startsWith("sk_live_")
    ? ("live" as const)
    : ("test" as const);

  try {
    const customer = await stripe.customers.retrieve(stripeCustomerId);
    if (customer.deleted) {
      return {
        state: "error",
        message: "This Stripe customer has been deleted.",
        code: "customer_deleted",
      };
    }

    const defaultPaymentMethodId =
      typeof customer.invoice_settings?.default_payment_method === "string"
        ? customer.invoice_settings.default_payment_method
        : (customer.invoice_settings?.default_payment_method?.id ?? null);

    const [pmList, invoiceList, chargeList] = await Promise.all([
      stripe.paymentMethods.list({
        customer: stripeCustomerId,
        type: "card",
        limit: 10,
      }),
      stripe.invoices.list({
        customer: stripeCustomerId,
        status: "open",
        limit: 20,
      }),
      // Charges are stable across API versions; invoice.payment_intent is not.
      stripe.charges.list({ customer: stripeCustomerId, limit: 10 }),
    ]);

    const cards: CardOnFile[] = pmList.data
      .filter((pm) => pm.card)
      .map((pm) => ({
        paymentMethodId: pm.id,
        brand: pm.card!.brand,
        last4: pm.card!.last4,
        expMonth: pm.card!.exp_month,
        expYear: pm.card!.exp_year,
        addedAt: new Date(pm.created * 1000).toISOString(),
        isCustomerDefault: pm.id === defaultPaymentMethodId,
        expiringSoon: isExpiringSoon(pm.card!.exp_month, pm.card!.exp_year),
      }))
      .sort((a, b) => (a.isCustomerDefault ? -1 : b.isCustomerDefault ? 1 : 0));

    // Which card each subscription will actually charge. A subscription-level
    // default OVERRIDES the customer default — this is the drift that lets a
    // "successful" card update still charge a dead card.
    const subscriptions: SubscriptionCharge[] = [];
    let hasMismatch = false;

    for (const subId of subscriptionIds.filter(Boolean)) {
      try {
        const sub = await stripe.subscriptions.retrieve(subId, {
          expand: ["default_payment_method"],
        });
        const subPm = sub.default_payment_method;
        const subPmId = typeof subPm === "string" ? subPm : (subPm?.id ?? null);
        const effectiveId = subPmId ?? defaultPaymentMethodId;
        const match = pmList.data.find((pm) => pm.id === effectiveId);

        if (effectiveId && !match) hasMismatch = true;

        subscriptions.push({
          stripeSubscriptionId: subId,
          stripeStatus: sub.status,
          effectivePaymentMethodId: effectiveId,
          effectiveCardLabel: cardLabel(match),
          usesCustomerDefault: !subPmId,
        });
      } catch {
        subscriptions.push({
          stripeSubscriptionId: subId,
          stripeStatus: "unknown",
          effectivePaymentMethodId: null,
          effectiveCardLabel: null,
          usesCustomerDefault: false,
        });
        hasMismatch = true;
      }
    }

    const openInvoices: OpenInvoice[] = invoiceList.data
      .filter((inv): inv is Stripe.Invoice & { id: string } => !!inv.id)
      .map((inv) => ({
        invoiceId: inv.id,
        invoiceNumber: inv.number,
        amountDueCents: inv.amount_due,
        hostedInvoiceUrl: inv.hosted_invoice_url ?? null,
        createdAt: new Date(inv.created * 1000).toISOString(),
        collectionMethod: inv.collection_method ?? "charge_automatically",
      }));

    const failed = chargeList.data.find((c) => c.status === "failed");
    const lastFailure: LastFailure | null = failed
      ? {
          chargeId: failed.id,
          amountCents: failed.amount,
          failedAt: new Date(failed.created * 1000).toISOString(),
          cardLabel: failed.payment_method_details?.card
            ? `${failed.payment_method_details.card.brand} ••••${failed.payment_method_details.card.last4}`
            : null,
          message:
            failed.outcome?.seller_message ?? failed.failure_message ?? null,
          declineCode: failed.failure_code ?? null,
        }
      : null;

    return {
      state: "ok",
      customerId: stripeCustomerId,
      keyMode,
      cards,
      defaultPaymentMethodId,
      subscriptions,
      openInvoices,
      lastFailure,
      hasMismatch,
    };
  } catch (err) {
    const e = err as Stripe.errors.StripeError;
    console.error(
      "[getBillingState] failed:",
      e.type ?? "unknown",
      e.code ?? "",
      e.message ?? err,
    );
    return {
      state: "error",
      message:
        e.code === "resource_missing"
          ? `Stripe has no customer ${stripeCustomerId} in ${keyMode} mode. The stored ID is from the other mode or was deleted.`
          : (e.message ?? "Could not reach Stripe."),
      code: e.code ?? null,
    };
  }
}

/* ────────────────────────────────────────────────────────────────────────────
   Collection
   ──────────────────────────────────────────────────────────────────────────*/

export type InvoiceRetryResult = {
  invoiceId: string;
  amountCents: number;
  status: "paid" | "action_required" | "failed";
  hostedInvoiceUrl?: string | null;
  message?: string;
};

/**
 * Pays every automatically-collected open invoice using the customer's current
 * default card. Safe to call repeatedly — paid invoices leave the `open` list.
 */
export async function retryOpenInvoices(
  stripeCustomerId: string,
  paymentMethodId?: string,
): Promise<InvoiceRetryResult[]> {
  const open = await stripe.invoices.list({
    customer: stripeCustomerId,
    status: "open",
    limit: 20,
  });

  const results: InvoiceRetryResult[] = [];

  for (const invoice of open.data) {
    if (!invoice.id) continue;
    // Manually-collected invoices are sent, not charged. Leave them alone.
    if (invoice.collection_method !== "charge_automatically") continue;

    try {
      const paid = await stripe.invoices.pay(invoice.id, {
        ...(paymentMethodId ? { payment_method: paymentMethodId } : {}),
        off_session: true,
      });
      results.push({
        invoiceId: invoice.id,
        amountCents: invoice.amount_due,
        status: paid.status === "paid" ? "paid" : "failed",
        hostedInvoiceUrl: paid.hosted_invoice_url,
      });
    } catch (err) {
      const e = err as Stripe.errors.StripeError;
      const code = e.code ?? e.decline_code;
      results.push({
        invoiceId: invoice.id,
        amountCents: invoice.amount_due,
        status:
          code === "authentication_required" ? "action_required" : "failed",
        hostedInvoiceUrl: invoice.hosted_invoice_url,
        message: e.message,
      });
      console.error(`[retryOpenInvoices] ${invoice.id}:`, code, e.message);
    }
  }

  return results;
}
