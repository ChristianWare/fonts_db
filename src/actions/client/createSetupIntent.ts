"use server";

import { auth } from "../../../auth";
import { db } from "@/lib/db";
import stripe from "@/lib/stripe";

export async function createSetupIntent() {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const profile = await db.clientProfile.findUnique({
    where: { userId: session.user.id },
    select: {
      id: true,
      stripeCustomerId: true,
      setupFeePaid: true,
      user: { select: { email: true, name: true } },
    },
  });

  if (!profile) return { error: "Profile not found" };
  if (profile.setupFeePaid) return { error: "Setup fee already paid" };

  // Create Stripe customer if one doesn't exist yet
  let customerId = profile.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: profile.user.email,
      name: profile.user.name ?? undefined,
      metadata: { clientProfileId: profile.id },
    });
    customerId = customer.id;
    await db.clientProfile.update({
      where: { id: profile.id },
      data: { stripeCustomerId: customerId },
    });
  }

  // Create a SetupIntent to securely collect card details
  const setupIntent = await stripe.setupIntents.create({
    customer: customerId,
    payment_method_types: ["card"],
    metadata: { clientProfileId: profile.id },
  });

  return {
    clientSecret: setupIntent.client_secret,
    customerId,
  };
}
