"use server";

import { db } from "@/lib/db";
import { getUserByEmail } from "@/lib/user";
import { RegisterSchema, RegisterSchemaType } from "@/schemas/RegisterSchema";
import {
  generateEmailVerificationToken,
  sendEmailVerificationToken,
} from "@/lib/emailVerification";
import { generateServiceAgreement } from "@/lib/generateServiceAgreement";
import { sendWelcomeEmail, sendAdminNewClientEmail } from "@/lib/emails";
import bcrypt from "bcryptjs";

export const register = async (values: RegisterSchemaType) => {
  const validated = RegisterSchema.safeParse(values);
  if (!validated.success) return { error: "Invalid fields" };

  const { name, businessName, email, password, website } = validated.data;

  // Honeypot — bots fill hidden fields, humans don't
  if (website)
    return { success: "Account created! Please check your email to verify." };

  const existing = await getUserByEmail(email);
  if (existing) return { error: "Email already in use" };

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await db.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      roles: ["CLIENT"],
      clientProfile: {
        create: { businessName },
      },
    },
    include: { clientProfile: true },
  });

  if (user.clientProfile?.id) {
    const agreementResult = await generateServiceAgreement(
      user.clientProfile.id,
    );
    if ("error" in agreementResult) {
      console.error(
        "[register] Agreement generation failed:",
        agreementResult.error,
      );
    }
  }

  const token = await generateEmailVerificationToken(email);
  const emailResult = await sendEmailVerificationToken(
    token.email,
    token.token,
  );

  if (emailResult.error) {
    return {
      error:
        "Account created but failed to send verification email. Try logging in to resend.",
    };
  }

  // Welcome email to client
  await sendWelcomeEmail({ to: email, name, businessName });

  // Notify admin
  if (user.clientProfile?.id) {
    await sendAdminNewClientEmail({
      clientName: name,
      businessName,
      email,
      clientProfileId: user.clientProfile.id,
    });
  }

  return { success: "Account created! Please check your email to verify." };
};
