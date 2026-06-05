"use server";

import { revalidatePath } from "next/cache";
import { auth } from "../../../auth";
import { db } from "@/lib/db";
import stripe from "@/lib/stripe";
import { ProductType } from "@prisma/client";

async function getOwnedSubscription(productType: ProductType) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" as const };

  const profile = await db.clientProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!profile) return { error: "Profile not found" as const };

  const sub = await db.subscription.findUnique({
    where: {
      clientProfileId_productType: {
        clientProfileId: profile.id,
        productType,
      },
    },
  });
  if (!sub) return { error: "No subscription found" as const };

  return { sub };
}

export async function cancelSubscription({
  productType,
}: {
  productType: ProductType;
}) {
  const result = await getOwnedSubscription(productType);
  if ("error" in result) return { error: result.error };
  const { sub } = result;

  if (sub.status !== "ACTIVE" && sub.status !== "PAST_DUE") {
    return { error: "This subscription isn't active" };
  }
  if (sub.cancelAtPeriodEnd) {
    return { error: "Cancellation is already scheduled" };
  }

  // Free/beta subscription — nothing in Stripe to cancel, end it now.
  if (!sub.stripeSubscriptionId) {
    await db.subscription.update({
      where: { id: sub.id },
      data: { status: "CANCELLED", cancelledAt: new Date() },
    });
    revalidatePath("/dashboard/billing");
    return { success: true, immediate: true };
  }

  // Paid subscription — schedule cancellation for period end. During a
  // trial, "period end" is the trial end, so the card is never charged.
  await stripe.subscriptions.update(sub.stripeSubscriptionId, {
    cancel_at_period_end: true,
  });

  await db.subscription.update({
    where: { id: sub.id },
    data: { cancelAtPeriodEnd: true },
  });

  revalidatePath("/dashboard/billing");
  return { success: true, immediate: false };
}

export async function resumeSubscription({
  productType,
}: {
  productType: ProductType;
}) {
  const result = await getOwnedSubscription(productType);
  if ("error" in result) return { error: result.error };
  const { sub } = result;

  if (!sub.cancelAtPeriodEnd || !sub.stripeSubscriptionId) {
    return { error: "No scheduled cancellation to resume" };
  }

  await stripe.subscriptions.update(sub.stripeSubscriptionId, {
    cancel_at_period_end: false,
  });

  await db.subscription.update({
    where: { id: sub.id },
    data: { cancelAtPeriodEnd: false },
  });

  revalidatePath("/dashboard/billing");
  return { success: true };
}
