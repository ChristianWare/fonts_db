// scripts/test-admin-alerts.ts
//
// Fires the admin alerts with fake data — no Stripe, no webhook, no real money.
// Tests the part most likely to break: Resend → your inbox, and Resend →
// your carrier's SMS gateway.
//
// Usage:
//   npx tsx --env-file=.env.local scripts/test-admin-alerts.ts
//   npx tsx --env-file=.env.local scripts/test-admin-alerts.ts paid
//   npx tsx --env-file=.env.local scripts/test-admin-alerts.ts failed card churn
//
// (Use whichever env file you actually have — .env, .env.local, or pull
//  production values with: vercel env pull .env.production.local)

import { Resend } from "resend";
import {
  alertPaymentReceived,
  alertPaymentFailed,
  alertCardUpdated,
  alertSubscriptionCancelled,
} from "@/lib/adminAlerts";
import { ADMIN_EMAIL, FROM_ADDRESS, APP_URL } from "@/lib/email";

const FAKE_CLIENT_ID = "test-client-id-0000";
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/* ── Preflight ──────────────────────────────────────────────────────────── */

function preflight(): boolean {
  console.log("\n" + "=".repeat(64));
  console.log("ADMIN ALERT TEST");
  console.log("=".repeat(64));

  const smsTarget = process.env.ADMIN_SMS_GATEWAY;
  const hasKey = !!process.env.RESEND_API_KEY;

  console.log(`  RESEND_API_KEY      ${hasKey ? "set" : "MISSING"}`);
  console.log(`  FROM_ADDRESS        ${FROM_ADDRESS}`);
  console.log(`  ADMIN_EMAIL         ${ADMIN_EMAIL}`);
  console.log(`  ADMIN_SMS_GATEWAY   ${smsTarget ?? "not set (email only)"}`);
  console.log(`  APP_URL             ${APP_URL}`);
  console.log("=".repeat(64) + "\n");

  if (!hasKey) {
    console.error(
      "RESEND_API_KEY is missing. tsx does not auto-load .env — pass it:\n" +
        "  npx tsx --env-file=.env.local scripts/test-admin-alerts.ts\n",
    );
    return false;
  }

  if (!smsTarget) {
    console.warn(
      "ADMIN_SMS_GATEWAY not set — testing email only.\n" +
        "  Verizon  6025551234@vtext.com\n" +
        "  AT&T     6025551234@txt.att.net\n" +
        "  T-Mobile 6025551234@tmomail.net\n",
    );
  }

  return true;
}

/* ── Raw transport check ────────────────────────────────────────────────── */
// Runs before the real alerts so a transport problem surfaces with the actual
// Resend error rather than being swallowed by notifyAdmin's try/catch.

async function transportCheck() {
  const target = process.env.ADMIN_SMS_GATEWAY;
  if (!target) return;

  console.log("→ Raw SMS transport check…");
  const resend = new Resend(process.env.RESEND_API_KEY!);

  try {
    const res = await resend.emails.send({
      from: FROM_ADDRESS,
      to: target,
      subject: "",
      text: "FNF alert test - if you got this, the gateway works.",
    });
    if (res.error) {
      console.error(`  FAILED: ${res.error.name} — ${res.error.message}`);
      console.error(
        "  If this complains about the subject, open src/lib/adminAlerts.ts\n" +
          '  and change subject: "" to subject: "FNF" in the SMS block.',
      );
    } else {
      console.log(`  Accepted by Resend (id ${res.data?.id}).`);
      console.log(
        "  Carrier gateways are best-effort — if no text arrives in ~2 min,\n" +
          "  the carrier filtered it. The email path is unaffected.",
      );
    }
  } catch (err) {
    console.error("  FAILED:", err);
  }
  console.log("");
}

/* ── The four alerts ────────────────────────────────────────────────────── */

const tests = {
  paid: async () => {
    console.log("→ alertPaymentReceived  ($399 collected)");
    await alertPaymentReceived({
      businessName: "Nier Transportation",
      productLabel: "Custom Website",
      amountCents: 39900,
      invoiceNumber: "INV-2026-TEST",
      clientProfileId: FAKE_CLIENT_ID,
    });
  },

  failed: async () => {
    console.log("→ alertPaymentFailed    ($399 declined)");
    await alertPaymentFailed({
      businessName: "Nier Transportation",
      productLabel: "Custom Website",
      amountCents: 39900,
      reason: "Your card has insufficient funds.",
      cardLabel: "mastercard ••••9257",
      nextRetryAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      clientProfileId: FAKE_CLIENT_ID,
    });
  },

  card: async () => {
    console.log("→ alertCardUpdated      (new card + open invoice)");
    await alertCardUpdated({
      businessName: "Nier Transportation",
      brand: "mastercard",
      last4: "9257",
      hasOpenInvoice: true,
      clientProfileId: FAKE_CLIENT_ID,
    });
  },

  churn: async () => {
    console.log("→ alertSubscriptionCancelled  ($399/mo lost)");
    await alertSubscriptionCancelled({
      businessName: "Demo Car Co",
      productLabel: "Custom Website",
      amountCents: 39900,
      clientProfileId: FAKE_CLIENT_ID,
    });
  },
};

type TestName = keyof typeof tests;

/* ── Run ────────────────────────────────────────────────────────────────── */

async function main() {
  if (!preflight()) process.exit(1);

  await transportCheck();

  const requested = process.argv.slice(2) as TestName[];
  const names = (
    requested.length ? requested : (Object.keys(tests) as TestName[])
  ).filter((n) => {
    if (n in tests) return true;
    console.warn(`  (skipping unknown test "${n}")`);
    return false;
  });

  if (!names.length) {
    console.error(`No valid tests. Options: ${Object.keys(tests).join(", ")}`);
    process.exit(1);
  }

  for (const [i, name] of names.entries()) {
    await tests[name]();
    // Space the sends so SMS arrive in order and Resend doesn't rate-limit.
    if (i < names.length - 1) await sleep(2000);
  }

  console.log("\n" + "=".repeat(64));
  console.log(`Sent ${names.length} alert(s).`);
  console.log("");
  console.log(`  Check ${ADMIN_EMAIL} for branded emails with an ADMIN`);
  console.log("  NOTIFICATION header and an 'Open in admin' button.");
  if (process.env.ADMIN_SMS_GATEWAY) {
    console.log("  Check your phone for the matching texts.");
  }
  console.log("");
  console.log("  The 'Open in admin' links point at a fake client id and will");
  console.log("  404. That's expected — only the delivery path is under test.");
  console.log("");
  console.log("  notifyAdmin swallows its own errors by design, so failures");
  console.log("  print above as [notifyAdmin] lines rather than throwing.");
  console.log("=".repeat(64) + "\n");
}

main().then(() => process.exit(0));
