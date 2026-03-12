"use server";

import { auth } from "../../../auth";
import { db } from "@/lib/db";

export const deleteDesignOption = async (assetId: string) => {
  const session = await auth();
  if (!session?.user?.roles?.includes("ADMIN"))
    return { error: "Unauthorized" };

  await db.brandAsset.delete({ where: { id: assetId } });

  return { success: true };
};
