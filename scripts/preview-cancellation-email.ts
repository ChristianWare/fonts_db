import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

// Sends both variants of the admin-initiated cancellation email to your inbox.
//   npx tsx scripts/preview-cancellation-email.ts
async function main() {
  const { sendPlanCancelledByAdminEmail } = await import("../src/lib/emails");

  const to = "chris@fontsandfooters.com"; // ← your inbox
  const cancelledAt = new Date();
  const periodEnd = new Date(
    cancelledAt.getFullYear(),
    cancelledAt.getMonth() + 1,
    1,
  );

  // 1) Scheduled for period end — the default from the admin page.
  await sendPlanCancelledByAdminEmail({
    to,
    name: "Barry La Nier",
    businessName: "Nier Transportation",
    productType: "WEBSITE", // try "LEADS" too
    productLabel: "Custom Website",
    cancelledBy: "Chris",
    cancelledAt,
    accessEndsAt: periodEnd,
    planAmountCents: 49900,
    note: "Per our call on Friday. Thanks for the year, Barry — door's always open.",
  });

  // 2) Immediate — no note attached.
  await sendPlanCancelledByAdminEmail({
    to,
    name: "Barry La Nier",
    businessName: "Nier Transportation",
    productType: "WEBSITE",
    productLabel: "Custom Website",
    cancelledBy: "Chris",
    cancelledAt,
    accessEndsAt: null,
    planAmountCents: 49900,
  });

  console.log("Sent two previews. Check your inbox.");
}

main();
