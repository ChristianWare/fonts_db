"use server";

import { auth } from "../../../auth";
import { db } from "@/lib/db";
import stripe from "@/lib/stripe";
import { sendBillingConfirmedEmail } from "@/lib/emails";

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
      user: { select: { email: true, name: true } },
    },
  });

  if (!profile) return { error: "Profile not found" };
  if (profile.setupFeePaid) return { error: "Setup already complete" };
  if (!profile.stripeCustomerId) return { error: "No Stripe customer found" };

  const customerId = profile.stripeCustomerId;

  await stripe.paymentMethods.attach(paymentMethodId, { customer: customerId });

  await stripe.customers.update(customerId, {
    invoice_settings: { default_payment_method: paymentMethodId },
  });

  if (profile.setupFeeAmountCents > 0) {
    const setupInvoice = await stripe.invoices.create({
      customer: customerId,
      collection_method: "charge_automatically",
      default_payment_method: paymentMethodId,
      description: "One-time setup fee — Fonts & Footers platform onboarding",
      metadata: { clientProfileId: profile.id, type: "setup_fee" },
    });

    await stripe.invoiceItems.create({
      customer: customerId,
      invoice: setupInvoice.id,
      amount: profile.setupFeeAmountCents,
      currency: "usd",
      description: "One-time platform setup fee — Fonts & Footers",
      metadata: { clientProfileId: profile.id, type: "setup_fee" },
    });

    const finalizedInvoice = await stripe.invoices.finalizeInvoice(
      setupInvoice.id,
    );

    const paidInvoice =
      finalizedInvoice.status === "paid"
        ? finalizedInvoice
        : await stripe.invoices.pay(setupInvoice.id);

    if (paidInvoice.status !== "paid") {
      return { error: "Setup fee payment failed. Please try again." };
    }
  }

  const now = new Date();
  const firstOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const anchorTimestamp = Math.floor(firstOfNextMonth.getTime() / 1000);

  const price = await stripe.prices.create({
    unit_amount: profile.monthlyAmountCents,
    currency: "usd",
    recurring: { interval: "month" },
    product_data: { name: "Fonts & Footers — Monthly Platform Fee" },
  });

  const subscription = await stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: price.id }],
    default_payment_method: paymentMethodId,
    billing_cycle_anchor: anchorTimestamp,
    proration_behavior: "none",
    metadata: { clientProfileId: profile.id },
  });

  await db.clientProfile.update({
    where: { id: profile.id },
    data: { setupFeePaid: true, stripeSubscriptionId: subscription.id },
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

  // Billing confirmed email to client
  if (profile.user.email) {
    await sendBillingConfirmedEmail({
      to: profile.user.email,
      name: profile.user.name ?? "Client",
      setupFeeCents: profile.setupFeeAmountCents,
      monthlyCents: profile.monthlyAmountCents,
    });
  }

  return { success: true };
}
