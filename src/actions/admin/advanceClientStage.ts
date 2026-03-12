"use server";

import { auth } from "../../../auth";
import { db } from "@/lib/db";
import { OnboardingStage } from "@prisma/client";

export const advanceClientStage = async (
  clientProfileId: string,
  targetStage: OnboardingStage,
) => {
  const session = await auth();
  if (!session?.user?.roles?.includes("ADMIN"))
    return { error: "Unauthorized" };

  const client = await db.clientProfile.findUnique({
    where: { id: clientProfileId },
  });

  if (!client) return { error: "Client not found" };

  await db.stageChangeLog.create({
    data: {
      clientProfileId,
      fromStage: client.onboardingStage,
      toStage: targetStage,
      changedById: session.user.id,
    },
  });

  await db.clientProfile.update({
    where: { id: clientProfileId },
    data: { onboardingStage: targetStage },
  });

  return { success: true };
};
