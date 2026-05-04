/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import stripe from "@/lib/stripe";
import { db } from "@/lib/db";
import Stripe from "stripe";
import { ProductType, SubscriptionStatus } from "@prisma/client";

const STATUS_MAP: Record<string, SubscriptionStatus> = {
  active: "ACTIVE",
  past_due: "PAST_DUE",
  canceled: "CANCELLED",
  paused: "PAUSED",
  incomplete: "INACTIVE",
  incomplete_expired: "INACTIVE",
  trialing: "ACTIVE",
  unpaid: "PAST_DUE",
};

// Defaults to WEBSITE for backwards compat with existing live subs that
// don't have productType in their Stripe metadata.
function getProductType(
  metadata: Stripe.Metadata | null | undefined,
): ProductType {
  return metadata?.productType === "LEADS" ? "LEADS" : "WEBSITE";
}

/**
 * Resolve the Stripe subscription ID from an Invoice.
 * Stripe moved this between API versions — try newest path first,
 * fall back through parent, then line items, then the legacy field.
 */
function getInvoiceSubscriptionId(invoice: Stripe.Invoice): string | null {
  const inv = invoice as any;

  // Newest: invoice.parent.subscription_details.subscription
  const parentSub = inv.parent?.subscription_details?.subscription;
  if (typeof parentSub === "string") return parentSub;
  if (parentSub?.id) return parentSub.id;

  // Legacy: invoice.subscription
  if (typeof inv.subscription === "string") return inv.subscription;
  if (inv.subscription?.id) return inv.subscription.id;

  // Fallback: first line item with a subscription
  for (const line of invoice.lines.data) {
    const lineSub = (line as any).subscription;
    if (typeof lineSub === "string") return lineSub;
    if (lineSub?.id) return lineSub.id;
  }

  return null;
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      // ── Subscription created or updated ──────────────────────────────────
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const clientProfileId = sub.metadata?.clientProfileId;
        if (!clientProfileId) break;

        const productType = getProductType(sub.metadata);
        const stripeCustomerId =
          typeof sub.customer === "string" ? sub.customer : sub.customer.id;
        const status = STATUS_MAP[sub.status] ?? "INACTIVE";
        const planAmountCents = sub.items.data[0]?.price?.unit_amount ?? 0;
        const trialEndsAt = sub.trial_end
          ? new Date(sub.trial_end * 1000)
          : null;

        await db.subscription.upsert({
          where: {
            clientProfileId_productType: { clientProfileId, productType },
          },
          create: {
            clientProfileId,
            productType,
            stripeSubscriptionId: sub.id,
            stripeCustomerId,
            status,
            planAmountCents,
            trialEndsAt,
            billingAnchorDate: 1,
            // Override website-flavored defaults for the leads product
            ...(productType === "LEADS" && {
              monthlyAmountCents: planAmountCents,
              setupFeeAmountCents: 0,
            }),
          },
          update: {
            stripeSubscriptionId: sub.id,
            stripeCustomerId,
            status,
            planAmountCents,
            trialEndsAt,
          },
        });

        // Bootstrap an empty LeadsSettings row on first leads subscription so
        // the onboarding modal trigger (`leadsSettings.onboardingCompletedAt is null`)
        // has something to read.
        if (
          event.type === "customer.subscription.created" &&
          productType === "LEADS"
        ) {
          await db.leadsSettings.upsert({
            where: { clientProfileId },
            create: { clientProfileId },
            update: {}, // no-op if row already exists
          });
        }
        break;
      }

      // ── Subscription deleted (cancelled) ─────────────────────────────────
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;

        // Scoped by Stripe sub ID — cancels only the affected product, not
        // every subscription this client has.
        await db.subscription.updateMany({
          where: { stripeSubscriptionId: sub.id },
          data: {
            status: "CANCELLED",
            cancelledAt: new Date(),
          },
        });
        break;
      }

      // ── Invoice paid ──────────────────────────────────────────────────────
      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId =
          typeof invoice.customer === "string"
            ? invoice.customer
            : invoice.customer?.id;

        if (!customerId) break;

        // Skip $0 invoices — these are subscription creation invoices with a
        // future billing anchor, nothing was actually charged.
        if (invoice.amount_paid === 0) break;

        const profile = await db.clientProfile.findFirst({
          where: { stripeCustomerId: customerId },
          select: { id: true },
        });

        if (!profile) break;

        // Skip if we already have this invoice
        const existing = invoice.id
          ? await db.invoice.findFirst({
              where: { stripeInvoiceId: invoice.id },
            })
          : null;

        if (existing) break;

        // Resolve which product this invoice belongs to so the portal can
        // surface website vs leads invoices separately.
        const stripeSubId = getInvoiceSubscriptionId(invoice);

        let productType: ProductType | null = null;
        if (stripeSubId) {
          const localSub = await db.subscription.findUnique({
            where: { stripeSubscriptionId: stripeSubId },
            select: { productType: true },
          });
          productType = localSub?.productType ?? null;
        }

        // Generate invoice number
        const count = await db.invoice.count();
        const invoiceNumber = `INV-${new Date().getFullYear()}-${String(
          count + 1,
        ).padStart(4, "0")}`;

        await db.invoice.create({
          data: {
            clientProfileId: profile.id,
            invoiceNumber,
            stripeInvoiceId: invoice.id ?? undefined,
            amountCents: invoice.amount_paid,
            status: "PAID",
            paidAt: invoice.status_transitions?.paid_at
              ? new Date(invoice.status_transitions.paid_at * 1000)
              : new Date(),
            pdfUrl: invoice.invoice_pdf ?? undefined,
            periodStart: invoice.period_start
              ? new Date(invoice.period_start * 1000)
              : undefined,
            periodEnd: invoice.period_end
              ? new Date(invoice.period_end * 1000)
              : undefined,
            description: invoice.description ?? undefined,
            productType: productType ?? undefined,
          },
        });

        // Update period dates ONLY on the subscription this invoice is for —
        // scoped by stripeSubscriptionId so a leads invoice doesn't overwrite
        // the website sub's billing window (or vice versa).
        if (stripeSubId && invoice.period_start && invoice.period_end) {
          await db.subscription.updateMany({
            where: { stripeSubscriptionId: stripeSubId },
            data: {
              currentPeriodStart: new Date(invoice.period_start * 1000),
              currentPeriodEnd: new Date(invoice.period_end * 1000),
              status: "ACTIVE",
            },
          });
        }
        break;
      }

      // ── Invoice payment failed ────────────────────────────────────────────
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const stripeSubId = getInvoiceSubscriptionId(invoice);

        if (!stripeSubId) break;

        // Scoped to the affected sub only — don't mark the whole customer
        // past-due when only one product's invoice failed.
        await db.subscription.updateMany({
          where: { stripeSubscriptionId: stripeSubId },
          data: { status: "PAST_DUE" },
        });
        break;
      }

      default:
        // Unhandled event — ignore
        break;
    }
  } catch (err) {
    console.error(`Error processing webhook event ${event.type}:`, err);
    return NextResponse.json(
      { error: "Webhook handler error" },
      { status: 500 },
    );
  }

  return NextResponse.json({ received: true });
}
