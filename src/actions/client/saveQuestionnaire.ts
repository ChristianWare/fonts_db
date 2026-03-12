"use server";

import { auth } from "../../../auth";
import { db } from "@/lib/db";

const lockedStages = [
  "ASSETS_PENDING",
  "ASSETS_UPLOADED",
  "DESIGN_REVIEW",
  "SITE_LIVE",
];

export const saveQuestionnaire = async (
  answers: Record<string, string | string[]>,
  submit: boolean = false,
) => {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  const profile = await db.clientProfile.findUnique({
    where: { userId: session.user.id },
    include: { questionnaire: true },
  });

  if (!profile) return { error: "Profile not found" };

  if (lockedStages.includes(profile.onboardingStage)) {
    return {
      error: "Your questionnaire is locked while your site is in progress.",
    };
  }

  const data = {
    answers,
    lastSavedAt: new Date(),
    ...(submit ? { submittedAt: new Date() } : {}),
  };

  await db.questionnaire.upsert({
    where: { clientProfileId: profile.id },
    update: data,
    create: {
      clientProfileId: profile.id,
      ...data,
    },
  });

  if (submit) {
    await db.clientProfile.update({
      where: { id: profile.id },
      data: { onboardingStage: "QUESTIONNAIRE_SUBMITTED" },
    });
  }

  return { success: true };
};
