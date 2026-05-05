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
      subscriptions: true,
      invoices: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!profile) return null;

  // Alias the WEBSITE subscription as `subscription` (singular) for
  // backwards compat with existing dashboard code that does
  // `profile.subscription?.status`. New code should use
  // `profile.subscriptions` directly.
  return {
    ...profile,
    subscription:
      profile.subscriptions.find((s) => s.productType === "WEBSITE") ?? null,
  };
};
