/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import stripe from "@/lib/stripe";
import { db } from "@/lib/db";
import Stripe from "stripe";
import { ProductType, SubscriptionStatus } from "@prisma/client";
import {
  sendLeadsTrialEndingEmail,
  sendPaymentFailedEmail,
  sendCancellationConfirmedEmail,
  sendPaymentReceiptEmail,
} from "@/lib/emails";
import {
  alertPaymentReceived,
  alertPaymentFailed,
  alertCardUpdated,
  alertSubscriptionCancelled,
} from "@/lib/adminAlerts";

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

const PRODUCT_LABELS: Record<ProductType, string> = {
  WEBSITE: "Custom Website",
  LEADS: "Leads Tool",
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
        const cancelAtPeriodEnd = sub.cancel_at_period_end ?? false;

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
            cancelAtPeriodEnd,
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
            cancelAtPeriodEnd,
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

      // ── Trial ending soon (fires ~3 days before trial end) ───────────────
      case "customer.subscription.trial_will_end": {
        const sub = event.data.object as Stripe.Subscription;
        const clientProfileId = sub.metadata?.clientProfileId;
        if (!clientProfileId) break;

        // Already cancelled — they made their choice, don't nudge them.
        if (sub.cancel_at_period_end) break;

        const productType = getProductType(sub.metadata);
        if (productType !== "LEADS") break;

        const profile = await db.clientProfile.findUnique({
          where: { id: clientProfileId },
          select: {
            id: true,
            user: { select: { email: true, name: true } },
          },
        });
        if (!profile?.user.email) break;

        const trialEndsAt = sub.trial_end
          ? new Date(sub.trial_end * 1000)
          : null;
        const amountCents = sub.items.data[0]?.price?.unit_amount ?? 0;

        const savedLeadsCount = await db.savedLead.count({
          where: { clientProfileId, isDraft: false },
        });

        await sendLeadsTrialEndingEmail({
          to: profile.user.email,
          name: profile.user.name?.split(" ")[0] ?? "there",
          trialEndsAt,
          amountCents,
          savedLeadsCount,
        });
        break;
      }

      // ── Subscription deleted (cancelled) ─────────────────────────────────
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;

        // Look up owner before the update so we can email them after.
        const localSub = await db.subscription.findUnique({
          where: { stripeSubscriptionId: sub.id },
          select: {
            productType: true,
            planAmountCents: true,
            clientProfile: {
              select: {
                id: true,
                businessName: true,
                user: { select: { email: true, name: true } },
              },
            },
          },
        });

        // Scoped by Stripe sub ID — cancels only the affected product, not
        // every subscription this client has.
        await db.subscription.updateMany({
          where: { stripeSubscriptionId: sub.id },
          data: {
            status: "CANCELLED",
            cancelledAt: new Date(),
            cancelAtPeriodEnd: false,
          },
        });

        if (localSub?.clientProfile.user.email) {
          await sendCancellationConfirmedEmail({
            to: localSub.clientProfile.user.email,
            name: localSub.clientProfile.user.name?.split(" ")[0] ?? "there",
            productLabel: PRODUCT_LABELS[localSub.productType],
          });
        }

        if (localSub) {
          await alertSubscriptionCancelled({
            businessName: localSub.clientProfile.businessName,
            productLabel: PRODUCT_LABELS[localSub.productType],
            amountCents: localSub.planAmountCents,
            clientProfileId: localSub.clientProfile.id,
          });
        }
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
          select: {
            id: true,
            businessName: true,
            user: { select: { email: true, name: true } },
          },
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

        // Setup-fee invoices have no subscription attached — identify them
        // by the metadata confirmBillingSetup stamps on the invoice.
        if (!productType && invoice.metadata?.type === "setup_fee") {
          productType = "WEBSITE";
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

        // Branded receipt with the Stripe-generated PDF attached. Wrapped so a
        // mail/fetch failure never fails the webhook (Stripe would retry it).
        if (profile.user?.email) {
          try {
            let pdfBuffer: Buffer | null = null;
            if (invoice.invoice_pdf) {
              const pdfRes = await fetch(invoice.invoice_pdf);
              if (pdfRes.ok) {
                pdfBuffer = Buffer.from(await pdfRes.arrayBuffer());
              }
            }

            await sendPaymentReceiptEmail({
              to: profile.user.email,
              name: profile.user.name ?? "there",
              productLabel: productType
                ? PRODUCT_LABELS[productType]
                : "Subscription",
              invoiceNumber,
              amountCents: invoice.amount_paid,
              paidAt: invoice.status_transitions?.paid_at
                ? new Date(invoice.status_transitions.paid_at * 1000)
                : new Date(),
              periodStart: invoice.period_start
                ? new Date(invoice.period_start * 1000)
                : null,
              periodEnd: invoice.period_end
                ? new Date(invoice.period_end * 1000)
                : null,
              hostedInvoiceUrl: invoice.hosted_invoice_url ?? null,
              pdfBuffer,
              pdfFilename: `${invoiceNumber}.pdf`,
            });
          } catch (err) {
            console.error("[webhook invoice.paid] receipt email failed:", err);
          }
        }

        // 💰 Admin alert — money landed.
        await alertPaymentReceived({
          businessName: profile.businessName,
          productLabel: productType
            ? PRODUCT_LABELS[productType]
            : "Subscription",
          amountCents: invoice.amount_paid,
          invoiceNumber,
          clientProfileId: profile.id,
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

        const localSub = await db.subscription.findUnique({
          where: { stripeSubscriptionId: stripeSubId },
          select: {
            productType: true,
            clientProfile: {
              select: {
                id: true,
                businessName: true,
                user: { select: { email: true, name: true } },
              },
            },
          },
        });

        // Scoped to the affected sub only — don't mark the whole customer
        // past-due when only one product's invoice failed.
        await db.subscription.updateMany({
          where: { stripeSubscriptionId: stripeSubId },
          data: { status: "PAST_DUE" },
        });

        if (localSub?.clientProfile.user.email) {
          await sendPaymentFailedEmail({
            to: localSub.clientProfile.user.email,
            name: localSub.clientProfile.user.name?.split(" ")[0] ?? "there",
            productLabel: PRODUCT_LABELS[localSub.productType],
            amountCents: invoice.amount_due,
            nextRetryAt: invoice.next_payment_attempt
              ? new Date(invoice.next_payment_attempt * 1000)
              : null,
          });
        }

        // ⚠️ Admin alert — pull the real decline reason off the latest failed
        // charge. Charges are stable across API versions; invoice.payment_intent
        // is not.
        if (localSub) {
          let reason: string | null = null;
          let cardLabel: string | null = null;

          const failedCustomerId =
            typeof invoice.customer === "string"
              ? invoice.customer
              : invoice.customer?.id;

          if (failedCustomerId) {
            try {
              const charges = await stripe.charges.list({
                customer: failedCustomerId,
                limit: 3,
              });
              const failed = charges.data.find((c) => c.status === "failed");
              if (failed) {
                reason =
                  failed.outcome?.seller_message ??
                  failed.failure_message ??
                  null;
                const card = failed.payment_method_details?.card;
                cardLabel = card ? `${card.brand} ••••${card.last4}` : null;
              }
            } catch (err) {
              console.error("[webhook payment_failed] charge lookup:", err);
            }
          }

          await alertPaymentFailed({
            businessName: localSub.clientProfile.businessName,
            productLabel: PRODUCT_LABELS[localSub.productType],
            amountCents: invoice.amount_due,
            reason,
            cardLabel,
            nextRetryAt: invoice.next_payment_attempt
              ? new Date(invoice.next_payment_attempt * 1000)
              : null,
            clientProfileId: localSub.clientProfile.id,
          });
        }
        break;
      }

      // ── Card attached (client updated their payment method) ───────────────
      // NOTE: enable `payment_method.attached` on the webhook endpoint in the
      // Stripe Dashboard or this case never fires.
      case "payment_method.attached": {
        const pm = event.data.object as Stripe.PaymentMethod;
        if (!pm.customer || !pm.card) break;

        const pmCustomerId =
          typeof pm.customer === "string" ? pm.customer : pm.customer.id;

        const profile = await db.clientProfile.findFirst({
          where: { stripeCustomerId: pmCustomerId },
          select: { id: true, businessName: true },
        });
        if (!profile) break;

        // Is there money sitting behind this card?
        let hasOpenInvoice = false;
        try {
          const open = await stripe.invoices.list({
            customer: pmCustomerId,
            status: "open",
            limit: 1,
          });
          hasOpenInvoice = open.data.length > 0;
        } catch (err) {
          console.error("[webhook pm.attached] open invoice lookup:", err);
        }

        await alertCardUpdated({
          businessName: profile.businessName,
          brand: pm.card.brand,
          last4: pm.card.last4,
          hasOpenInvoice,
          clientProfileId: profile.id,
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
