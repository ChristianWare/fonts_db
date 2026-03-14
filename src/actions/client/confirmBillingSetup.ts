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

  // Charge setup fee immediately (if > $0)
  if (profile.setupFeeAmountCents > 0) {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: profile.setupFeeAmountCents,
      currency: "usd",
      customer: customerId,
      payment_method: paymentMethodId,
      confirm: true,
      description: "Fonts & Footers — One-time setup fee",
      metadata: { clientProfileId: profile.id, type: "setup_fee" },
      automatic_payment_methods: { enabled: true, allow_redirects: "never" },
    });

    if (paymentIntent.status !== "succeeded") {
      return { error: "Setup fee payment failed. Please try again." };
    }
  }

  // Create subscription starting on the 1st of next month
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

  // Update DB
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
