"use server";

import { auth } from "../../../auth";
import { db } from "@/lib/db";

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

  return { success: true };
};
