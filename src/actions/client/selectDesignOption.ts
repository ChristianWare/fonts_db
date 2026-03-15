/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { auth } from "../../../auth";
import { db } from "@/lib/db";
import { sendAdminDesignSelectedEmail } from "@/lib/emails";

const PRE_REVIEW_STAGES = [
  "REGISTERED",
  "AGREEMENT_PENDING",
  "AGREEMENT_SIGNED",
  "QUESTIONNAIRE_PENDING",
  "QUESTIONNAIRE_SUBMITTED",
  "ASSETS_PENDING",
  "ASSETS_UPLOADED",
  "DESIGN_SELECTION",
];

export const selectDesignOption = async ({
  assetId,
  clientNotes,
}: {
  assetId: string;
  clientNotes?: string;
}) => {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  const profile = await db.clientProfile.findUnique({
    where: { userId: session.user.id },
    include: { user: true },
  });

  if (!profile) return { error: "Profile not found" };

  await db.brandAsset.updateMany({
    where: { clientProfileId: profile.id, label: "DESIGN_OPTION" },
    data: { selected: false, clientNotes: null },
  });

  const selectedAsset = await db.brandAsset.update({
    where: { id: assetId },
    data: { selected: true, clientNotes: clientNotes ?? null },
  });

  if (PRE_REVIEW_STAGES.includes(profile.onboardingStage)) {
    await db.clientProfile.update({
      where: { id: profile.id },
      data: { onboardingStage: "DESIGN_REVIEW" },
    });

    await db.stageChangeLog.create({
      data: {
        clientProfileId: profile.id,
        fromStage: profile.onboardingStage,
        toStage: "DESIGN_REVIEW",
        note: "Auto-advanced on design selection",
      },
    });
  }

  // Notify admin
  await sendAdminDesignSelectedEmail({
    clientName: profile.user.name ?? "Client",
    businessName: profile.businessName,
    templateName: (selectedAsset as any).templateName ?? "Design option",
    clientProfileId: profile.id,
  });

  return { success: true };
};
