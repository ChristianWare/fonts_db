"use server";

import { auth } from "../../../auth";
import { db } from "@/lib/db";

export const submitSupportTicket = async ({
  subject,
  message,
}: {
  subject: string;
  message: string;
}) => {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  const profile = await db.clientProfile.findUnique({
    where: { userId: session.user.id },
  });

  if (!profile) return { error: "Profile not found" };

  await db.supportTicket.create({
    data: {
      clientProfileId: profile.id,
      subject,
      message,
    },
  });

  return { success: true };
};
