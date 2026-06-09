"use server";

import { auth } from "../../../auth";
import { db } from "@/lib/db";
import stripe from "@/lib/stripe";

export async function createLeadsSetupIntent() {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const profile = await db.clientProfile.findUnique({
    where: { userId: session.user.id },
    select: {
      id: true,
      stripeCustomerId: true,
      businessName: true,
      user: { select: { email: true } },
    },
  });
  if (!profile) return { error: "Profile not found" };

  // Block if they already have an active/past-due leads sub (incl. comped admin)
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

  // Create or reuse the Stripe customer
  let customerId = profile.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: profile.user.email ?? undefined,
      name: profile.businessName,
      metadata: { clientProfileId: profile.id },
    });
    customerId = customer.id;
    await db.clientProfile.update({
      where: { id: profile.id },
      data: { stripeCustomerId: customerId },
    });
  }

  const setupIntent = await stripe.setupIntents.create({
    customer: customerId,
    payment_method_types: ["card"],
    usage: "off_session", // card will be charged when the trial converts
    metadata: { clientProfileId: profile.id, productType: "LEADS" },
  });

  return { clientSecret: setupIntent.client_secret };
}
