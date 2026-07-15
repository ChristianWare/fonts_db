"use server";

import { auth } from "../../../auth";
import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { parseCustomQuestionnaire } from "@/lib/customQuestionnaire";

/**
 * Set (or clear) a per-client custom questionnaire. Pass `sections: null`
 * to revert the client to the default black-car question set.
 */
export async function setCustomQuestionnaire({
  clientProfileId,
  sections,
}: {
  clientProfileId: string;
  sections: unknown | null;
}) {
  const session = await auth();
  if (!session?.user || !session.user.roles?.includes("ADMIN")) {
    return { error: "Unauthorized" };
  }

  // Revert to the default questionnaire
  if (sections === null) {
    await db.clientProfile.update({
      where: { id: clientProfileId },
      data: { customQuestionnaire: Prisma.DbNull },
    });
    return { success: true as const, cleared: true as const };
  }

  const parsed = parseCustomQuestionnaire(sections);
  if ("error" in parsed) return { error: parsed.error };

  await db.clientProfile.update({
    where: { id: clientProfileId },
    data: {
      customQuestionnaire: parsed.sections as unknown as Prisma.InputJsonValue,
    },
  });

  return {
    success: true as const,
    sectionCount: parsed.sections.length,
    questionCount: parsed.sections.reduce((n, s) => n + s.questions.length, 0),
  };
}
