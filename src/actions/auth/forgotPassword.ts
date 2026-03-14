"use server";

import { db } from "@/lib/db";
import { Resend } from "resend";
import crypto from "crypto";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function forgotPassword(email: string) {
  if (!email?.trim()) return { error: "Please enter your email address." };

  const user = await db.user.findUnique({
    where: { email: email.toLowerCase().trim() },
    select: { id: true, email: true, name: true },
  });

  // Always return success even if user not found — prevents email enumeration
  if (!user) return { success: true };

  // Delete any existing tokens for this email
  await db.passwordResetToken.deleteMany({
    where: { email: user.email },
  });

  // Generate a secure token
  const token = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

  await db.passwordResetToken.create({
    data: {
      email: user.email,
      token,
      expires,
    },
  });

  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`;

  await resend.emails.send({
    from: "Fonts & Footers <onboarding@resend.dev>",
    to: user.email,
    subject: "Reset your password",
    html: `
      <div style="font-family: monospace; max-width: 480px; margin: 0 auto; padding: 40px 24px; background: #ffffff;">
        <p style="font-size: 14px; text-transform: uppercase; letter-spacing: 0.1em; color: #555; margin: 0 0 32px;">
          Fonts & Footers
        </p>
        <h1 style="font-size: 28px; font-weight: 700; text-transform: uppercase; color: #0a0a0a; margin: 0 0 16px; letter-spacing: -1px;">
          Reset your password
        </h1>
        <p style="font-size: 14px; color: #555; line-height: 1.6; margin: 0 0 32px;">
          Hi ${user.name ?? "there"}, we received a request to reset your password.
          Click the button below to choose a new one. This link expires in 1 hour.
        </p>
        <a href="${resetUrl}"
          style="display: inline-block; padding: 14px 32px; background-color: #0a0a0a; color: #ffc809;
          font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em;
          text-decoration: none;">
          Reset password
        </a>
        <p style="font-size: 13px; color: #888; margin: 32px 0 0; line-height: 1.6;">
          If you didn't request this, you can safely ignore this email.
          Your password will not change.
        </p>
      </div>
    `,
  });

  return { success: true };
}
