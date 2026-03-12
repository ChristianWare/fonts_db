"use server";

import { auth } from "../../../auth";
import { db } from "@/lib/db";

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

  return { success: true };
};
