"use server";

import { auth } from "../../../auth";
import { db } from "@/lib/db";
import stripe from "@/lib/stripe";

export async function updateDefaultPaymentMethod({
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

  if (!profile?.stripeCustomerId) {
    return { error: "No billing account found" };
  }

  const customerId = profile.stripeCustomerId;

  // The SetupIntent already attached the payment method to the customer
  // (SetupIntents with a customer attach on success). Attaching again is a
  // safety net for edge cases — ignore "already attached" errors.
  try {
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId,
    });
  } catch {
    // already attached — fine
  }

  // New default for future invoices
  await stripe.customers.update(customerId, {
    invoice_settings: { default_payment_method: paymentMethodId },
  });

  // Subscriptions can override the customer default with their own
  // default_payment_method — point every live sub at the new card.
  const subs = await db.subscription.findMany({
    where: {
      clientProfileId: profile.id,
      stripeSubscriptionId: { not: null },
      status: { in: ["ACTIVE", "PAST_DUE", "PAUSED"] },
    },
    select: { stripeSubscriptionId: true },
  });

  for (const sub of subs) {
    if (!sub.stripeSubscriptionId) continue;
    try {
      await stripe.subscriptions.update(sub.stripeSubscriptionId, {
        default_payment_method: paymentMethodId,
      });
    } catch (err) {
      console.error(
        `Failed to update payment method on ${sub.stripeSubscriptionId}:`,
        err,
      );
    }
  }

  return { success: true };
}
