"use server";

import { db } from "@/lib/db";
import { buildAgreementHTML } from "./agreementTemplate";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

async function getExecutablePath(): Promise<string> {
  // In production (Vercel), use the serverless Chromium binary
  if (process.env.NODE_ENV === "production") {
    const chromium = (await import("@sparticuz/chromium")).default;
    return chromium.executablePath();
  }

  // In local dev, use the installed Chrome on your machine
  // Mac (Intel or Apple Silicon)
  return "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
}

async function getChromiumArgs(): Promise<string[]> {
  if (process.env.NODE_ENV === "production") {
    const chromium = (await import("@sparticuz/chromium")).default;
    return chromium.args;
  }
  return [
    "--no-sandbox",
    "--disable-setuid-sandbox",
    "--disable-dev-shm-usage",
  ];
}

async function htmlToPDF(html: string): Promise<Buffer> {
  const puppeteer = (await import("puppeteer-core")).default;

  const browser = await puppeteer.launch({
    args: await getChromiumArgs(),
    defaultViewport: { width: 1280, height: 900 },
    executablePath: await getExecutablePath(),
    headless: true,
  });

  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "networkidle0" });

  const pdf = await page.pdf({
    format: "A4",
    printBackground: true,
    margin: { top: "0", bottom: "0", left: "0", right: "0" },
  });

  await browser.close();
  return Buffer.from(pdf);
}

async function uploadPDFToCloudinary(
  buffer: Buffer,
  clientProfileId: string,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const folder = `fonts-and-footers/clients/${clientProfileId}/documents`;
    const publicId = `service-agreement-${Date.now()}`;

    cloudinary.uploader
      .upload_stream(
        {
          folder,
          public_id: publicId,
          resource_type: "raw",
          format: "pdf",
          access_mode: "public",
          type: "upload",
        },
        (error, result) => {
          if (error || !result)
            return reject(error ?? new Error("Cloudinary upload failed"));
          resolve(result.secure_url);
        },
      )
      .end(buffer);
  });
}

export async function generateServiceAgreement(
  clientProfileId: string,
): Promise<{ success: true } | { error: string }> {
  try {
    const client = await db.clientProfile.findUnique({
      where: { id: clientProfileId },
      include: { user: true },
    });

    if (!client) return { error: "Client not found" };

    // Idempotency — don't generate a second agreement if one already exists
    const existing = await db.document.findFirst({
      where: { clientProfileId, type: "SERVICE_AGREEMENT" },
    });

    if (existing) return { success: true };

    const html = buildAgreementHTML({
      clientName: client.user.name ?? "Client",
      businessName: client.businessName,
      date: new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
    });

    const pdfBuffer = await htmlToPDF(html);
    const fileUrl = await uploadPDFToCloudinary(pdfBuffer, clientProfileId);

    await db.document.create({
      data: {
        clientProfileId,
        title: "Web Services Agreement",
        type: "SERVICE_AGREEMENT",
        status: "PENDING_SIGNATURE",
        fileUrl,
        fileName: "web-services-agreement.pdf",
        requiresSignature: true,
        visible: true,
      },
    });

    return { success: true };
  } catch (err) {
    console.error("[generateServiceAgreement]", err);
    return { error: err instanceof Error ? err.message : "Unknown error" };
  }
}
