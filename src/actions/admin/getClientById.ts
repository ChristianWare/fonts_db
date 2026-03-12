"use server";

import { auth } from "../../../auth";
import { db } from "@/lib/db";

export const getClientById = async (clientProfileId: string) => {
  const session = await auth();
  if (!session?.user?.roles?.includes("ADMIN")) return null;

  return await db.clientProfile.findUnique({
    where: { id: clientProfileId },
    include: {
      user: { select: { id: true, name: true, email: true } },
      questionnaire: true,
      documents: { orderBy: { createdAt: "desc" } },
      brandAssets: { orderBy: { createdAt: "desc" } },
      subscription: true,
      invoices: { orderBy: { createdAt: "desc" } },
      changeRequests: { orderBy: { createdAt: "desc" } },
      supportTickets: { orderBy: { createdAt: "desc" } },
      stageLog: {
        orderBy: { createdAt: "desc" },
        include: {
          changedBy: { select: { name: true } },
        },
      },
    },
  });
};
