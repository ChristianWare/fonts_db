"use server";

import { auth } from "../../../auth";
import { db } from "@/lib/db";

export const getClientProfile = async () => {
  const session = await auth();
  if (!session?.user?.id) return null;

  const profile = await db.clientProfile.findUnique({
    where: { userId: session.user.id },
    include: {
      questionnaire: true,
      documents: true,
      brandAssets: true,
      subscription: true,
      invoices: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  return profile;
};
