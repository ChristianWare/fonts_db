/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import stripe from "@/lib/stripe";
import { db } from "@/lib/db";
import Stripe from "stripe";

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

        const statusMap: Record<string, string> = {
          active: "ACTIVE",
          past_due: "PAST_DUE",
          canceled: "CANCELLED",
          paused: "PAUSED",
          incomplete: "INACTIVE",
          incomplete_expired: "INACTIVE",
          trialing: "ACTIVE",
          unpaid: "PAST_DUE",
        };

        await db.subscription.upsert({
          where: { clientProfileId },
          create: {
            clientProfileId,
            stripeSubscriptionId: sub.id,
            stripeCustomerId:
              typeof sub.customer === "string" ? sub.customer : sub.customer.id,
            status: (statusMap[sub.status] ?? "INACTIVE") as any,
            planAmountCents: sub.items.data[0]?.price?.unit_amount ?? 0,
            billingAnchorDate: 1,
          },
          update: {
            status: (statusMap[sub.status] ?? "INACTIVE") as any,
            planAmountCents: sub.items.data[0]?.price?.unit_amount ?? 0,
          },
        });
        break;
      }

      // ── Subscription deleted (cancelled) ─────────────────────────────────
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const clientProfileId = sub.metadata?.clientProfileId;
        if (!clientProfileId) break;

        await db.subscription.updateMany({
          where: { clientProfileId },
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

        // Skip $0 invoices — these are subscription creation invoices
        // with a future billing anchor, nothing was actually charged
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

        // Generate invoice number
        const count = await db.invoice.count({
          where: { clientProfileId: profile.id },
        });
        const invoiceNumber = `INV-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;

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
          },
        });

        // Update subscription period dates if this is a recurring invoice
        if (invoice.period_start && invoice.period_end) {
          await db.subscription.updateMany({
            where: { clientProfileId: profile.id },
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
        const customerId =
          typeof invoice.customer === "string"
            ? invoice.customer
            : invoice.customer?.id;

        if (!customerId) break;

        await db.subscription.updateMany({
          where: { stripeCustomerId: customerId },
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
