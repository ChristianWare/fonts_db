"use server";

import Stripe from "stripe";
import { auth } from "../../../auth";
import { db } from "@/lib/db";
import stripe from "@/lib/stripe";

export async function createCardUpdateIntent() {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  try {
    const profile = await db.clientProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true, stripeCustomerId: true },
    });

    if (!profile?.stripeCustomerId) {
      return { error: "No billing account found" };
    }

    // Confirm the customer actually exists in THIS Stripe account/mode before
    // creating an intent against it. A stale or wrong-mode id is the most
    // common reason setupIntents.create throws here.
    const customer = await stripe.customers.retrieve(profile.stripeCustomerId);
    if (customer.deleted) {
      console.error(
        `[createCardUpdateIntent] deleted customer ${profile.stripeCustomerId} on profile ${profile.id}`,
      );
      return {
        error: "Your billing account needs attention — contact support.",
      };
    }

    const setupIntent = await stripe.setupIntents.create({
      customer: profile.stripeCustomerId,
      payment_method_types: ["card"],
      usage: "off_session",
      metadata: { clientProfileId: profile.id, type: "card_update" },
    });

    if (!setupIntent.client_secret) {
      return { error: "Could not start the card update. Please try again." };
    }

    return { clientSecret: setupIntent.client_secret };
  } catch (err) {
    // Log the real reason server-side, return something a client can read.
    const e = err as Stripe.errors.StripeError;
    console.error(
      "[createCardUpdateIntent] failed:",
      e.type ?? "unknown",
      e.code ?? "",
      e.message ?? err,
    );
    return {
      error: "We couldn't load the payment form. Please try again shortly.",
    };
  }
}
