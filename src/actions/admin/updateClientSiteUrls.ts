"use server";

import { auth } from "../../../auth";
import { db } from "@/lib/db";

export async function updateClientSiteUrls({
  clientProfileId,
  previewUrl,
  liveUrl,
}: {
  clientProfileId: string;
  previewUrl?: string;
  liveUrl?: string;
}) {
  const session = await auth();
  if (!session?.user || !session.user.roles?.includes("ADMIN")) {
    return { error: "Unauthorized" };
  }

  await db.clientProfile.update({
    where: { id: clientProfileId },
    data: {
      ...(previewUrl !== undefined && {
        previewUrl: previewUrl.trim() || null,
      }),
      ...(liveUrl !== undefined && {
        liveUrl: liveUrl.trim() || null,
      }),
    },
  });

  return { success: true };
}
