"use server";

import { auth } from "../../../auth";
import { db } from "@/lib/db";

// Stages that should auto-advance to DESIGN_REVIEW when a design is selected
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
  });

  if (!profile) return { error: "Profile not found" };

  // Deselect all first
  await db.brandAsset.updateMany({
    where: { clientProfileId: profile.id, label: "DESIGN_OPTION" },
    data: { selected: false, clientNotes: null },
  });

  // Select the chosen one
  await db.brandAsset.update({
    where: { id: assetId },
    data: { selected: true, clientNotes: clientNotes ?? null },
  });

  // Auto-advance to DESIGN_REVIEW if not already there or beyond
  if (PRE_REVIEW_STAGES.includes(profile.onboardingStage)) {
    await db.clientProfile.update({
      where: { id: profile.id },
      data: { onboardingStage: "DESIGN_REVIEW" },
    });

    // Log the stage change
    await db.stageChangeLog.create({
      data: {
        clientProfileId: profile.id,
        fromStage: profile.onboardingStage,
        toStage: "DESIGN_REVIEW",
        note: "Auto-advanced on design selection",
      },
    });
  }

  return { success: true };
};
