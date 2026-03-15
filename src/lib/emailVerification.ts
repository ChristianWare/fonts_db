import { db } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";
import { buildEmailHTML, bodyText, FROM_ADDRESS, APP_URL } from "@/lib/email";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const generateEmailVerificationToken = async (email: string) => {
  const token = uuidv4();
  const expires = new Date(new Date().getTime() + 3600 * 1000); // 1 hour

  const existing = await db.emailVerificationToken.findFirst({
    where: { email },
  });

  if (existing) {
    await db.emailVerificationToken.delete({
      where: { id: existing.id },
    });
  }

  return await db.emailVerificationToken.create({
    data: { email, token, expires },
  });
};

export const sendEmailVerificationToken = async (
  email: string,
  token: string,
) => {
  const verifyUrl = `${APP_URL}/verify-email?token=${token}`;

  try {
    await resend.emails.send({
      from: FROM_ADDRESS,
      to: email,
      subject: "Verify your email — Fonts & Footers",
      html: buildEmailHTML({
        preheader:
          "Verify your email to access your Fonts & Footers client portal.",
        heading: "Verify your email.",
        body:
          bodyText(
            "Click the button below to verify your email address and access your client portal. This link expires in 1 hour.",
          ) +
          bodyText(
            "If you didn't create an account with Fonts & Footers, you can safely ignore this email.",
          ),
        ctaLabel: "Verify email →",
        ctaUrl: verifyUrl,
      }),
    });

    return { success: true };
  } catch (error) {
    console.error("Email send error:", error);
    return { error: "Failed to send verification email" };
  }
};
