"use server";

import { auth } from "../../../auth";
import { db } from "@/lib/db";

export const deleteBrandAsset = async (assetId: string) => {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  const profile = await db.clientProfile.findUnique({
    where: { userId: session.user.id },
  });

  if (!profile) return { error: "Profile not found" };

  const asset = await db.brandAsset.findFirst({
    where: { id: assetId, clientProfileId: profile.id },
  });

  if (!asset) return { error: "Asset not found" };

  await db.brandAsset.delete({ where: { id: assetId } });

  return { success: true };
};
