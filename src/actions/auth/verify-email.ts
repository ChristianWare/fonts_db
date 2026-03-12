"use server";

import { db } from "@/lib/db";

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

  return { success: true };
};
