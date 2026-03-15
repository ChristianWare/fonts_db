/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { auth } from "../../../auth";
import { db } from "@/lib/db";
import { sendAdminAssetsUploadedEmail } from "@/lib/emails";

export const saveBrandAsset = async ({
  label,
  fileName,
  fileUrl,
  fileSize,
  mimeType,
}: {
  label: string;
  fileName: string;
  fileUrl: string;
  fileSize?: number;
  mimeType?: string;
}) => {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  const profile = await db.clientProfile.findUnique({
    where: { userId: session.user.id },
    include: { user: true },
  });

  if (!profile) return { error: "Profile not found" };

  await db.brandAsset.create({
    data: {
      clientProfileId: profile.id,
      label: label as any,
      fileName,
      fileUrl,
      fileSize,
      mimeType,
    },
  });

  // Advance stage if still on ASSETS_PENDING
  if (profile.onboardingStage === "ASSETS_PENDING") {
    await db.clientProfile.update({
      where: { id: profile.id },
      data: { onboardingStage: "ASSETS_UPLOADED" },
    });
  }

  // Notify admin
  await sendAdminAssetsUploadedEmail({
    clientName: profile.user.name ?? "Client",
    businessName: profile.businessName,
    fileName,
    clientProfileId: profile.id,
  });

  return { success: true };
};
