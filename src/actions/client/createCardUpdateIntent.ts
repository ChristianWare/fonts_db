"use server";

import { auth } from "../../../auth";
import { db } from "@/lib/db";
import stripe from "@/lib/stripe";

export async function createCardUpdateIntent() {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const profile = await db.clientProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true, stripeCustomerId: true },
  });

  if (!profile?.stripeCustomerId) {
    return { error: "No billing account found" };
  }

  const setupIntent = await stripe.setupIntents.create({
    customer: profile.stripeCustomerId,
    payment_method_types: ["card"],
    metadata: { clientProfileId: profile.id, type: "card_update" },
  });

  return { clientSecret: setupIntent.client_secret };
}
