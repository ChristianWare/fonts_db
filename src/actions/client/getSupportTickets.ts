"use server";

import { auth } from "../../../auth";
import { db } from "@/lib/db";

export const getSupportTickets = async () => {
  const session = await auth();
  if (!session?.user?.id) return [];

  const profile = await db.clientProfile.findUnique({
    where: { userId: session.user.id },
  });

  if (!profile) return [];

  return await db.supportTicket.findMany({
    where: { clientProfileId: profile.id },
    orderBy: { createdAt: "desc" },
  });
};
