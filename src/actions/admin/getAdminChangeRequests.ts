"use server";

import { auth } from "../../../auth";
import { db } from "@/lib/db";

export const getAdminChangeRequests = async () => {
  const session = await auth();
  if (!session?.user?.roles?.includes("ADMIN")) return [];

  return await db.changeRequest.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      clientProfile: {
        select: {
          businessName: true,
          user: { select: { name: true, email: true } },
        },
      },
    },
  });
};
