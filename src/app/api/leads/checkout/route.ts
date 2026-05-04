import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../../auth";
import { db } from "@/lib/db";
import stripe from "@/lib/stripe";

export const runtime = "nodejs";

const LEADS_TRIAL_DAYS = 7;
const PAYWALL_ENABLED = process.env.LEADS_PAYWALL_ENABLED === "true";

export async function POST(req: NextRequest) {
  // ── Auth ──
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ── Find profile ──
  const profile = await db.clientProfile.findUnique({
    where: { userId: session.user.id },
  });

  if (!profile) {
    return NextResponse.json(
      { error: "No client profile found" },
      { status: 404 },
    );
  }

  // ── Block double-enrollment ──
  const existing = await db.subscription.findUnique({
    where: {
      clientProfileId_productType: {
        clientProfileId: profile.id,
        productType: "LEADS",
      },
    },
  });

  if (
    existing &&
    (existing.status === "ACTIVE" || existing.status === "PAST_DUE")
  ) {
    return NextResponse.json(
      { error: "You already have an active leads subscription" },
      { status: 400 },
    );
  }

  // ── BETA PATH — no Stripe, just create the access row ──
  if (!PAYWALL_ENABLED) {
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
        status: "ACTIVE",
        planAmountCents: 0,
        monthlyAmountCents: 0,
        setupFeeAmountCents: 0,
        // No stripeSubscriptionId — this is a beta access row
      },
      update: {
        status: "ACTIVE",
      },
    });

    // Bootstrap LeadsSettings so onboarding modal triggers
    await db.leadsSettings.upsert({
      where: { clientProfileId: profile.id },
      create: { clientProfileId: profile.id },
      update: {},
    });

    return NextResponse.json({ url: "/dashboard/leads?welcome=true" });
  }

  // ── PAID PATH — full Stripe checkout flow ──
  const priceId = process.env.STRIPE_LEADS_PRICE_ID;
  if (!priceId) {
    console.error("STRIPE_LEADS_PRICE_ID not configured");
    return NextResponse.json(
      { error: "Leads checkout is not configured" },
      { status: 500 },
    );
  }

  // Reuse Stripe customer if we have one, else create
  let stripeCustomerId = profile.stripeCustomerId;
  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({
      email: session.user.email ?? undefined,
      name: profile.businessName,
      metadata: { clientProfileId: profile.id },
    });
    stripeCustomerId = customer.id;
    await db.clientProfile.update({
      where: { id: profile.id },
      data: { stripeCustomerId },
    });
  }

  const origin =
    req.headers.get("origin") ??
    process.env.NEXT_PUBLIC_APP_URL ??
    "http://localhost:3000";

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: stripeCustomerId,
    line_items: [{ price: priceId, quantity: 1 }],
    subscription_data: {
      trial_period_days: LEADS_TRIAL_DAYS,
      metadata: {
        clientProfileId: profile.id,
        productType: "LEADS",
      },
    },
    metadata: {
      clientProfileId: profile.id,
      productType: "LEADS",
    },
    success_url: `${origin}/dashboard/leads?welcome=true`,
    cancel_url: `${origin}/dashboard/enroll/leads?cancelled=true`,
    allow_promotion_codes: true,
  });

  if (!checkoutSession.url) {
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 },
    );
  }

  return NextResponse.json({ url: checkoutSession.url });
}
