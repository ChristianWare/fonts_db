"use server";

import { auth } from "../../../auth";
import { db } from "@/lib/db";
import stripe from "@/lib/stripe";

export async function confirmBillingSetup({
  paymentMethodId,
}: {
  paymentMethodId: string;
}) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const profile = await db.clientProfile.findUnique({
    where: { userId: session.user.id },
    select: {
      id: true,
      stripeCustomerId: true,
      setupFeePaid: true,
      setupFeeAmountCents: true,
      monthlyAmountCents: true,
      user: { select: { email: true } },
    },
  });

  if (!profile) return { error: "Profile not found" };
  if (profile.setupFeePaid) return { error: "Setup already complete" };
  if (!profile.stripeCustomerId) return { error: "No Stripe customer found" };

  const customerId = profile.stripeCustomerId;

  // Attach payment method to customer and set as default
  await stripe.paymentMethods.attach(paymentMethodId, {
    customer: customerId,
  });

  await stripe.customers.update(customerId, {
    invoice_settings: { default_payment_method: paymentMethodId },
  });

  // ── Setup fee via Stripe Invoice (generates a downloadable PDF) ──────────
  if (profile.setupFeeAmountCents > 0) {
    // Add a line item to the next invoice
    await stripe.invoiceItems.create({
      customer: customerId,
      amount: profile.setupFeeAmountCents,
      currency: "usd",
      description: "Fonts & Footers — One-time setup fee",
      metadata: { clientProfileId: profile.id, type: "setup_fee" },
    });

    // Create the invoice
    const setupInvoice = await stripe.invoices.create({
      customer: customerId,
      collection_method: "charge_automatically",
      default_payment_method: paymentMethodId,
      metadata: { clientProfileId: profile.id, type: "setup_fee" },
    });

    // Finalize so it gets a PDF
    const finalizedInvoice = await stripe.invoices.finalizeInvoice(
      setupInvoice.id,
    );

    // Only call pay if not already paid (auto_advance may have paid it during finalization)
    const paidInvoice =
      finalizedInvoice.status === "paid"
        ? finalizedInvoice
        : await stripe.invoices.pay(setupInvoice.id);

    if (paidInvoice.status !== "paid") {
      return { error: "Setup fee payment failed. Please try again." };
    }
    // The invoice.paid webhook will fire and create the Invoice record in our DB
    // including the pdfUrl — no need to manually create it here
  }

  // ── Subscription starting 1st of next month ──────────────────────────────
  const now = new Date();
  const firstOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const anchorTimestamp = Math.floor(firstOfNextMonth.getTime() / 1000);

  // Create a one-off price for this client's monthly rate
  const price = await stripe.prices.create({
    unit_amount: profile.monthlyAmountCents,
    currency: "usd",
    recurring: { interval: "month" },
    product_data: {
      name: "Fonts & Footers — Monthly Platform Fee",
    },
  });

  const subscription = await stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: price.id }],
    default_payment_method: paymentMethodId,
    billing_cycle_anchor: anchorTimestamp,
    proration_behavior: "none",
    metadata: { clientProfileId: profile.id },
  });

  // ── Update DB ─────────────────────────────────────────────────────────────
  await db.clientProfile.update({
    where: { id: profile.id },
    data: {
      setupFeePaid: true,
      stripeSubscriptionId: subscription.id,
    },
  });

  await db.subscription.upsert({
    where: { clientProfileId: profile.id },
    create: {
      clientProfileId: profile.id,
      stripeSubscriptionId: subscription.id,
      stripePriceId: price.id,
      stripeCustomerId: customerId,
      status: "ACTIVE",
      planAmountCents: profile.monthlyAmountCents,
      setupFeeAmountCents: profile.setupFeeAmountCents,
      billingAnchorDate: 1,
      currentPeriodStart: firstOfNextMonth,
      currentPeriodEnd: new Date(
        firstOfNextMonth.getFullYear(),
        firstOfNextMonth.getMonth() + 1,
        1,
      ),
    },
    update: {
      stripeSubscriptionId: subscription.id,
      stripePriceId: price.id,
      stripeCustomerId: customerId,
      status: "ACTIVE",
      planAmountCents: profile.monthlyAmountCents,
      setupFeeAmountCents: profile.setupFeeAmountCents,
      billingAnchorDate: 1,
      currentPeriodStart: firstOfNextMonth,
      currentPeriodEnd: new Date(
        firstOfNextMonth.getFullYear(),
        firstOfNextMonth.getMonth() + 1,
        1,
      ),
    },
  });

  return { success: true };
}
