"use server";

import { auth } from "../../../auth";
import { db } from "@/lib/db";
import { AssetLabel } from "@prisma/client";

export const uploadDesignOption = async ({
  clientProfileId,
  imageUrl,
  fileName,
  templateName,
  sourceUrl,
}: {
  clientProfileId: string;
  imageUrl: string;
  fileName: string;
  templateName: string;
  sourceUrl?: string;
}) => {
  const session = await auth();
  if (!session?.user?.roles?.includes("ADMIN"))
    return { error: "Unauthorized" };

  await db.brandAsset.create({
    data: {
      clientProfileId,
      fileUrl: imageUrl,
      fileName,
      label: AssetLabel.DESIGN_OPTION,
      templateName,
      sourceUrl: sourceUrl ?? null,
      selected: false,
    },
  });

  return { success: true };
};
