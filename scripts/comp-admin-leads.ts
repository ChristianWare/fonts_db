// scripts/comp-admin-leads.ts
import { db } from "@/lib/db";

async function main() {
  const profile = await db.clientProfile.findFirst({
    where: { user: { email: "chris@fontsandfooters.com" } },
    select: { id: true },
  });
  if (!profile) throw new Error("Admin profile not found");

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
      billingAnchorDate: 1,
    },
    update: {
      status: "ACTIVE",
      planAmountCents: 0,
      stripeSubscriptionId: null,
    },
  });
  console.log("Comped admin leads access.");
}

main();
