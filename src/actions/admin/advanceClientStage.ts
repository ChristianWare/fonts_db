"use server";

import { auth } from "../../../auth";
import { db } from "@/lib/db";
import { OnboardingStage } from "@prisma/client";
import { sendWelcomeEmail } from "@/lib/emails";

export const advanceClientStage = async (
  clientProfileId: string,
  targetStage: OnboardingStage,
) => {
  const session = await auth();
  if (!session?.user?.roles?.includes("ADMIN"))
    return { error: "Unauthorized" };

  const client = await db.clientProfile.findUnique({
    where: { id: clientProfileId },
    include: { user: { select: { email: true, name: true } } },
  });

  if (!client) return { error: "Client not found" };

  await db.stageChangeLog.create({
    data: {
      clientProfileId,
      fromStage: client.onboardingStage,
      toStage: targetStage,
      changedById: session.user.id,
    },
  });

  await db.clientProfile.update({
    where: { id: clientProfileId },
    data: { onboardingStage: targetStage },
  });

  // Website approval: only when advancing FROM Registered TO Agreement Pending
  // (the "Approve & unlock Billing" click). This is the one transition that
  // should send the welcome/pay-setup-fee email.
  const isApproval =
    client.onboardingStage === "REGISTERED" &&
    targetStage === "AGREEMENT_PENDING";

  if (isApproval && client.user?.email) {
    try {
      await sendWelcomeEmail({
        to: client.user.email,
        name: client.user.name ?? "there",
        businessName: client.businessName,
      });
    } catch (err) {
      console.error("[advanceClientStage] welcome email failed:", err);
    }
  }

  return { success: true };
};
