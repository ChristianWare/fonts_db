import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

async function main() {
  const { sendPaymentReceiptEmail } = await import("../src/lib/emails");

  // Minimal placeholder PDF so you can see the attachment in the preview.
  // The real webhook attaches Stripe's actual invoice PDF.
  const dummyPdf = Buffer.from(
    "%PDF-1.1\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n" +
      "2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n" +
      "3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 300 300]>>endobj\n" +
      "trailer<</Root 1 0 R>>\n%%EOF",
    "utf-8",
  );

  const now = new Date();
  const periodEnd = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    now.getDate(),
  );

  await sendPaymentReceiptEmail({
    to: "chris@fontsandfooters.com", // ← your inbox
    name: "Barry La Nier",
    productLabel: "Custom Website", // try "Leads Tool" too
    invoiceNumber: "INV-2026-0004",
    amountCents: 39900, // 12500 for a leads charge
    paidAt: now,
    periodStart: now,
    periodEnd,
    hostedInvoiceUrl: "https://invoice.stripe.com/i/example",
    pdfBuffer: dummyPdf,
    pdfFilename: "INV-2026-0004.pdf",
  });

  console.log("Sent. Check your inbox.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
