"use server";

import { auth } from "../../../auth";
import { db } from "@/lib/db";
import { ChangeRequestStatus } from "@prisma/client";

export const updateChangeRequestStatus = async ({
  requestId,
  status,
  adminNotes,
}: {
  requestId: string;
  status: ChangeRequestStatus;
  adminNotes?: string;
}) => {
  const session = await auth();
  if (!session?.user?.roles?.includes("ADMIN"))
    return { error: "Unauthorized" };

  await db.changeRequest.update({
    where: { id: requestId },
    data: {
      status,
      adminNotes,
      ...(status === "COMPLETED" ? { completedAt: new Date() } : {}),
    },
  });

  return { success: true };
};
