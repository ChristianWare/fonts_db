"use server";

import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function resetPassword({
  token,
  password,
}: {
  token: string;
  password: string;
}) {
  if (!token) return { error: "Invalid or missing token." };
  if (!password || password.length < 8)
    return { error: "Password must be at least 8 characters." };

  const resetToken = await db.passwordResetToken.findUnique({
    where: { token },
  });

  if (!resetToken) return { error: "This reset link is invalid." };

  if (new Date() > resetToken.expires) {
    await db.passwordResetToken.delete({ where: { token } });
    return { error: "This reset link has expired. Please request a new one." };
  }

  const hashed = await bcrypt.hash(password, 12);

  await db.user.update({
    where: { email: resetToken.email },
    data: { password: hashed },
  });

  await db.passwordResetToken.delete({ where: { token } });

  return { success: true };
}
