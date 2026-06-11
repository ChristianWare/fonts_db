import dotenv from "dotenv";

// Load env BEFORE anything imports the email lib (which throws if the
// RESEND_API_KEY isn't set yet).
dotenv.config({ path: ".env.local" });
dotenv.config(); // fallback to .env

async function main() {
  // Dynamic import: runs after dotenv above, so the key is present.
  const { sendLeadsWelcomeEmail } = await import("../src/lib/emails");

  const trialEnd = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await sendLeadsWelcomeEmail({
    to: "chris@fontsandfooters.com", // ← your inbox
    name: "Chris Ware",
    trialEndsAt: trialEnd,
    amountCents: 12500,
    cardBrand: "visa",
    cardLast4: "4242",
    billingDay: trialEnd.getDate(),
  });

  console.log("Sent. Check your inbox (and Resend's dashboard log).");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
