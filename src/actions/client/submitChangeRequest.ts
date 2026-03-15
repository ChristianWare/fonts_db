"use server";

import { auth } from "../../../auth";
import { db } from "@/lib/db";
import {
  sendChangeRequestConfirmationEmail,
  sendAdminChangeRequestEmail,
} from "@/lib/emails";

export const submitChangeRequest = async ({
  title,
  description,
}: {
  title: string;
  description: string;
}) => {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  const profile = await db.clientProfile.findUnique({
    where: { userId: session.user.id },
    include: { user: true },
  });

  if (!profile) return { error: "Profile not found" };

  if (profile.onboardingStage !== "SITE_LIVE") {
    return {
      error: "Change requests are only available after your site is live.",
    };
  }

  await db.changeRequest.create({
    data: {
      clientProfileId: profile.id,
      title,
      description,
    },
  });

  // Confirm to client
  if (profile.user.email) {
    await sendChangeRequestConfirmationEmail({
      to: profile.user.email,
      name: profile.user.name ?? "Client",
      title,
    });
  }

  // Notify admin
  await sendAdminChangeRequestEmail({
    clientName: profile.user.name ?? "Client",
    businessName: profile.businessName,
    title,
    description,
    clientProfileId: profile.id,
  });

  return { success: true };
};
