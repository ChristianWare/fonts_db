/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../../auth";
import { db } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(_req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await db.clientProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!profile) {
    return NextResponse.json({ error: "No profile" }, { status: 404 });
  }

  const subscription = await db.subscription.findUnique({
    where: {
      clientProfileId_productType: {
        clientProfileId: profile.id,
        productType: "LEADS",
      },
    },
  });

  if (!subscription) {
    return NextResponse.json(
      { error: "No leads subscription to cancel" },
      { status: 404 },
    );
  }

  // PAID PATH (when paywall is on, future): cancel via Stripe so the
  // webhook can fire customer.subscription.deleted and we stay in sync.
  // For now (beta), just flip the local row.
  //
  // TODO when paywall enabled:
  //   if (subscription.stripeSubscriptionId) {
  //     await stripe.subscriptions.cancel(subscription.stripeSubscriptionId);
  //     // The webhook will mark the local row CANCELLED — we can return early.
  //     return NextResponse.json({ success: true });
  //   }

  await db.subscription.update({
    where: { id: subscription.id },
    data: {
      status: "CANCELLED",
      cancelledAt: new Date(),
    },
  });

  // Note: we deliberately leave LeadsSettings.onboardingCompletedAt intact
  // so re-enrollment skips the onboarding modal. Settings persist.

  return NextResponse.json({ success: true });
}
