"use server";

import { auth } from "../../../auth";
import { db } from "@/lib/db";
import { AssetLabel } from "@prisma/client";

export const getDesignOptions = async () => {
  const session = await auth();
  if (!session?.user?.id) return [];

  const profile = await db.clientProfile.findUnique({
    where: { userId: session.user.id },
  });

  if (!profile) return [];

  return await db.brandAsset.findMany({
    where: {
      clientProfileId: profile.id,
      label: AssetLabel.DESIGN_OPTION,
    },
    orderBy: { createdAt: "asc" },
  });
};
