"use server";

import { auth } from "../../../auth";
import { db } from "@/lib/db";
import stripe from "@/lib/stripe";

const LEADS_PRICE_CENTS = 12500;
const LEADS_TRIAL_DAYS = 7;

export async function confirmLeadsEnrollment({
  paymentMethodId,
}: {
  paymentMethodId: string;
}) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const profile = await db.clientProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true, stripeCustomerId: true },
  });
  if (!profile) return { error: "Profile not found" };
  if (!profile.stripeCustomerId) return { error: "No Stripe customer found" };

  const customerId = profile.stripeCustomerId;

  // Idempotency: don't create a second sub on a double-submit
  const existing = await db.subscription.findUnique({
    where: {
      clientProfileId_productType: {
        clientProfileId: profile.id,
        productType: "LEADS",
      },
    },
    select: { status: true },
  });
  if (
    existing &&
    (existing.status === "ACTIVE" || existing.status === "PAST_DUE")
  ) {
    return { error: "You already have an active leads subscription" };
  }

  // Attach the card + make it the customer default
  await stripe.paymentMethods.attach(paymentMethodId, { customer: customerId });
  await stripe.customers.update(customerId, {
    invoice_settings: { default_payment_method: paymentMethodId },
  });

  // Mint the price inline (same approach as the website flow)
  const price = await stripe.prices.create({
    unit_amount: LEADS_PRICE_CENTS,
    currency: "usd",
    recurring: { interval: "month" },
    product_data: { name: "Fonts & Footers — Leads Tool" },
  });

  const subscription = await stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: price.id }],
    default_payment_method: paymentMethodId,
    trial_period_days: LEADS_TRIAL_DAYS,
    metadata: { clientProfileId: profile.id, productType: "LEADS" },
  });

  const trialEnd = subscription.trial_end
    ? new Date(subscription.trial_end * 1000)
    : null;

  // Write the access row now so the user has access on redirect. The
  // subscription.created webhook will also upsert this same row (idempotent).
  await db.subscription.upsert({
    where: {
      clientProfileId_productType: {
        clientProfileId: profile.id,
        productType: "LEADS",
      },
    },
    create: {
      clientProfileId: profile.id,
      productType: "LEADS",
      stripeSubscriptionId: subscription.id,
      stripePriceId: price.id,
      stripeCustomerId: customerId,
      status: "ACTIVE", // Stripe "trialing" maps to ACTIVE in our model
      planAmountCents: LEADS_PRICE_CENTS,
      monthlyAmountCents: LEADS_PRICE_CENTS,
      setupFeeAmountCents: 0,
      trialEndsAt: trialEnd,
      currentPeriodStart: new Date(),
      currentPeriodEnd: trialEnd,
      billingAnchorDate: trialEnd ? trialEnd.getDate() : 1,
    },
    update: {
      stripeSubscriptionId: subscription.id,
      stripePriceId: price.id,
      stripeCustomerId: customerId,
      status: "ACTIVE",
      planAmountCents: LEADS_PRICE_CENTS,
      monthlyAmountCents: LEADS_PRICE_CENTS,
      setupFeeAmountCents: 0,
      trialEndsAt: trialEnd,
      currentPeriodStart: new Date(),
      currentPeriodEnd: trialEnd,
      cancelAtPeriodEnd: false,
    },
  });

  // Bootstrap LeadsSettings so the settings page has a row to read
  await db.leadsSettings.upsert({
    where: { clientProfileId: profile.id },
    create: { clientProfileId: profile.id },
    update: {},
  });

  return { success: true };
}
