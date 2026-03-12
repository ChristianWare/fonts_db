"use server";

import { auth } from "../../../auth";
import { db } from "@/lib/db";
import { headers } from "next/headers";
import { buildAgreementHTML } from "@/lib/agreementTemplate";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

async function regenerateSignedPDF(
  clientName: string,
  businessName: string,
  generatedDate: string,
  signedDate: string,
  clientProfileId: string,
): Promise<string> {
  const html = buildAgreementHTML({
    clientName,
    businessName,
    date: generatedDate,
    signedDate,
  });

  // Import puppeteer the same way as generateServiceAgreement
  const puppeteer = (await import("puppeteer-core")).default;

  let executablePath: string;
  let args: string[];

  if (process.env.NODE_ENV === "production") {
    const chromium = (await import("@sparticuz/chromium")).default;
    executablePath = await chromium.executablePath();
    args = chromium.args;
  } else {
    executablePath =
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
    args = [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
    ];
  }

  const browser = await puppeteer.launch({
    args,
    defaultViewport: { width: 1280, height: 900 },
    executablePath,
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

  const buffer = Buffer.from(pdf);

  // Upload signed version to Cloudinary
  return new Promise((resolve, reject) => {
    const folder = `fonts-and-footers/clients/${clientProfileId}/documents`;
    const publicId = `service-agreement-signed-${Date.now()}`;

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

export const signDocument = async (documentId: string) => {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  const headersList = await headers();
  const ip =
    headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headersList.get("x-real-ip") ??
    "unknown";

  const profile = await db.clientProfile.findUnique({
    where: { userId: session.user.id },
    include: { user: true },
  });

  if (!profile) return { error: "Profile not found" };

  const document = await db.document.findFirst({
    where: {
      id: documentId,
      clientProfileId: profile.id,
      requiresSignature: true,
      status: "PENDING_SIGNATURE",
    },
  });

  if (!document) return { error: "Document not found or already signed" };

  const signedAt = new Date();
  const signedDate = signedAt.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Regenerate PDF with signature filled in
  let signedFileUrl = document.fileUrl;
  try {
    signedFileUrl = await regenerateSignedPDF(
      profile.user.name ?? "Client",
      profile.businessName,
      new Date(document.createdAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      signedDate,
      profile.id,
    );
  } catch (err) {
    // Don't block signing if PDF regeneration fails — still mark as signed
    console.error("[signDocument] PDF regeneration failed:", err);
  }

  await db.document.update({
    where: { id: documentId },
    data: {
      status: "SIGNED",
      signedAt,
      signedByIp: ip,
      signatureConsent: true,
      fileUrl: signedFileUrl,
    },
  });

  return { success: true };
};
