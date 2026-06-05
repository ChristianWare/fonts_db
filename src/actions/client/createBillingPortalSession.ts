"use server";

import { auth } from "../../../auth";
import { db } from "@/lib/db";
import stripe from "@/lib/stripe";

export async function createBillingPortalSession() {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const profile = await db.clientProfile.findUnique({
    where: { userId: session.user.id },
    select: { stripeCustomerId: true },
  });

  if (!profile?.stripeCustomerId) {
    return { error: "No billing account found" };
  }

  const origin = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: profile.stripeCustomerId,
    return_url: `${origin}/dashboard/billing`,
  });

  return { url: portalSession.url };
}
