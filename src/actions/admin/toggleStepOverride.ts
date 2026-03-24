"use server";

import { auth } from "../../../auth";
import { db } from "@/lib/db";

type OverridableStep = "questionnaireSkipped" | "assetsSkipped";

export const toggleStepOverride = async (
  clientProfileId: string,
  field: OverridableStep,
  value: boolean,
) => {
  const session = await auth();
  if (!session?.user?.roles?.includes("ADMIN"))
    return { error: "Unauthorized" };

  await db.clientProfile.update({
    where: { id: clientProfileId },
    data: { [field]: value },
  });

  return { success: true };
};
