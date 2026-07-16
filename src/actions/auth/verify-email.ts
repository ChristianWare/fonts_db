"use server";

import { db } from "@/lib/db";
import { generateServiceAgreement } from "@/lib/generateServiceAgreement";
import { sendAdminNewClientEmail } from "@/lib/emails";

export const verifyEmail = async (token: string) => {
  if (!token) return { error: "Token is required" };

  const existingToken = await db.emailVerificationToken.findUnique({
    where: { token },
  });

  if (!existingToken) return { error: "Invalid token" };

  const hasExpired = new Date(existingToken.expires) < new Date();
  if (hasExpired) return { error: "Token has expired" };

  const user = await db.user.findUnique({
    where: { email: existingToken.email },
  });

  if (!user) return { error: "User not found" };

  await db.user.update({
    where: { id: user.id },
    data: { emailVerified: new Date() },
  });

  await db.emailVerificationToken.delete({
    where: { id: existingToken.id },
  });

  // A verified email is the moment this becomes a real client — run the
  // onboarding side effects here instead of at registration, so bots never
  // trigger them. Tokens are single-use, so this can't fire twice.
  const profile = await db.clientProfile.findUnique({
    where: { userId: user.id },
    include: {
      documents: {
        where: { type: "SERVICE_AGREEMENT" },
        select: { id: true },
      },
    },
  });

  if (profile) {
    if (profile.documents.length === 0) {
      const agreementResult = await generateServiceAgreement(profile.id);
      if ("error" in agreementResult) {
        console.error(
          "[verify-email] Agreement generation failed:",
          agreementResult.error,
        );
      }
    }

    await sendAdminNewClientEmail({
      clientName: user.name ?? "New client",
      businessName: profile.businessName,
      email: user.email,
      clientProfileId: profile.id,
    });
  }

  return { success: true };
};
