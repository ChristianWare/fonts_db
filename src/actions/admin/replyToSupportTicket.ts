"use server";

import { auth } from "../../../auth";
import { db } from "@/lib/db";

export const replyToSupportTicket = async ({
  ticketId,
  reply,
}: {
  ticketId: string;
  reply: string;
}) => {
  const session = await auth();
  if (!session?.user?.roles?.includes("ADMIN"))
    return { error: "Unauthorized" };

  await db.supportTicket.update({
    where: { id: ticketId },
    data: {
      adminReply: reply,
      repliedAt: new Date(),
      repliedById: session.user.id,
      status: "CLOSED",
    },
  });

  return { success: true };
};
