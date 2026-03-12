import { db } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";
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
  const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${token}`;

  try {
    await resend.emails.send({
      from: "Fonts & Footers <onboarding@resend.dev>",
      to: email,
      subject: "Verify your email — Fonts & Footers",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
          </head>
          <body style="margin:0;padding:0;background-color:#242422;font-family:sans-serif;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#242422;padding:40px 20px;">
              <tr>
                <td align="center">
                  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">

                    <!-- Header -->
                    <tr>
                      <td style="padding-bottom:32px;">
                        <p style="margin:0;font-size:13px;text-transform:uppercase;letter-spacing:0.08em;color:#ffc809;font-weight:600;">
                          Fonts & Footers — Client Portal
                        </p>
                      </td>
                    </tr>

                    <!-- Card -->
                    <tr>
                      <td style="background-color:#ffffff;border-radius:12px;padding:40px;">

                        <h1 style="margin:0 0 12px;font-size:32px;font-weight:700;color:#242422;text-transform:uppercase;letter-spacing:-0.02em;line-height:1;">
                          Verify your email
                        </h1>

                        <p style="margin:0 0 32px;font-size:16px;color:#5a5d61;line-height:1.5;">
                          Click the button below to verify your email address and access your client portal. This link expires in 1 hour.
                        </p>

                        
                          href="${verifyUrl}"
                          style="display:inline-block;padding:16px 32px;background-color:#242422;color:#ffc809;font-size:15px;font-weight:700;text-decoration:none;border-radius:8px;text-transform:uppercase;letter-spacing:0.02em;"
                        >
                          Verify email
                        </a>

                        <p style="margin:32px 0 0;font-size:13px;color:#979797;line-height:1.5;">
                          If you didn&apos;t create an account with Fonts &amp; Footers, you can safely ignore this email.
                        </p>

                      </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                      <td style="padding-top:24px;">
                        <p style="margin:0;font-size:12px;color:#5a5d61;text-align:center;">
                          © 2026 Fonts & Footers. All rights reserved.
                        </p>
                      </td>
                    </tr>

                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `,
    });

    return { success: true };
  } catch (error) {
    console.error("Email send error:", error);
    return { error: "Failed to send verification email" };
  }
};
