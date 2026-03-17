import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = "hello@fontsandfooters.com";
const TO = "hello@fontsandfooters.com";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      firstName,
      lastName,
      email,
      company,
      siteUrl,
      projectDescription,
      services,
    } = body;

    // Basic validation
    if (!firstName || !lastName || !email || !projectDescription) {
      return NextResponse.json(
        { error: "Missing required fields." },
        { status: 400 },
      );
    }

    const sentAt = new Date().toLocaleString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZoneName: "short",
    });

    const { data, error } = await resend.emails.send({
      from: FROM,
      to: TO,
      replyTo: email,
      subject: `New inquiry from ${firstName} ${lastName}${company ? ` — ${company}` : ""}`,
      html: `
        <!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <title>New Contact Form Submission</title>
          </head>
          <body style="margin:0;padding:0;background-color:#f2f2f2;font-family:monospace;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f2f2f2;padding:40px 0;">
              <tr>
                <td align="center">
                  <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#0f0f0f;">

                    <!-- Header -->
                    <tr>
                      <td style="padding:40px 40px 32px;border-bottom:1px solid rgba(255,255,255,0.08);">
                        <p style="margin:0 0 8px;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:rgba(255,255,255,0.35);font-family:monospace;">
                          Fonts &amp; Footers
                        </p>
                        <h1 style="margin:0;font-size:26px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;font-family:monospace;">
                          New inquiry
                        </h1>
                      </td>
                    </tr>

                    <!-- Sender details -->
                    <tr>
                      <td style="padding:32px 40px;border-bottom:1px solid rgba(255,255,255,0.08);">
                        <table width="100%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td style="padding-bottom:16px;">
                              <p style="margin:0 0 4px;font-size:10px;letter-spacing:0.1em;text-transform:uppercase;color:rgba(255,255,255,0.35);font-family:monospace;">Name</p>
                              <p style="margin:0;font-size:16px;color:#ffffff;font-family:monospace;">${firstName} ${lastName}</p>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding-bottom:16px;">
                              <p style="margin:0 0 4px;font-size:10px;letter-spacing:0.1em;text-transform:uppercase;color:rgba(255,255,255,0.35);font-family:monospace;">Email</p>
                              <p style="margin:0;font-size:16px;font-family:monospace;">
                                <a href="mailto:${email}" style="color:#ffc809;text-decoration:none;">${email}</a>
                              </p>
                            </td>
                          </tr>
                          ${
                            company
                              ? `<tr>
                            <td style="padding-bottom:16px;">
                              <p style="margin:0 0 4px;font-size:10px;letter-spacing:0.1em;text-transform:uppercase;color:rgba(255,255,255,0.35);font-family:monospace;">Company</p>
                              <p style="margin:0;font-size:16px;color:#ffffff;font-family:monospace;">${company}</p>
                            </td>
                          </tr>`
                              : ""
                          }
                          ${
                            siteUrl
                              ? `<tr>
                            <td>
                              <p style="margin:0 0 4px;font-size:10px;letter-spacing:0.1em;text-transform:uppercase;color:rgba(255,255,255,0.35);font-family:monospace;">Current Website</p>
                              <p style="margin:0;font-size:16px;font-family:monospace;">
                                <a href="${siteUrl}" style="color:#ffc809;text-decoration:none;" target="_blank">${siteUrl}</a>
                              </p>
                            </td>
                          </tr>`
                              : ""
                          }
                        </table>
                      </td>
                    </tr>

                    <!-- Project description -->
                    <tr>
                      <td style="padding:32px 40px;border-bottom:1px solid rgba(255,255,255,0.08);">
                        <p style="margin:0 0 12px;font-size:10px;letter-spacing:0.1em;text-transform:uppercase;color:rgba(255,255,255,0.35);font-family:monospace;">Project Description</p>
                        <p style="margin:0;font-size:15px;color:rgba(255,255,255,0.85);line-height:1.7;font-family:monospace;white-space:pre-wrap;">${projectDescription}</p>
                      </td>
                    </tr>

                    <!-- Services (only if any selected) -->
                    ${
                      services && services.length > 0
                        ? `<tr>
                      <td style="padding:32px 40px;border-bottom:1px solid rgba(255,255,255,0.08);">
                        <p style="margin:0 0 16px;font-size:10px;letter-spacing:0.1em;text-transform:uppercase;color:rgba(255,255,255,0.35);font-family:monospace;">Interested In</p>
                        ${services
                          .map(
                            (s: string) =>
                              `<p style="margin:0 0 8px;font-size:14px;color:#ffc809;font-family:monospace;">→ ${s}</p>`,
                          )
                          .join("")}
                      </td>
                    </tr>`
                        : ""
                    }

                    <!-- Reply CTA -->
                    <tr>
                      <td style="padding:32px 40px;border-bottom:1px solid rgba(255,255,255,0.08);">
                        <a
                          href="mailto:${email}?subject=Re: Your inquiry — Fonts %26 Footers&body=%0A%0A%0A----%0AOn ${encodeURIComponent(sentAt)}, ${firstName} ${lastName} wrote:%0A%0AName: ${firstName} ${lastName}%0AEmail: ${email}${company ? `%0ACompany: ${company}` : ""}${siteUrl ? `%0AWebsite: ${siteUrl}` : ""}%0A%0A${encodeURIComponent(projectDescription)}"
                          style="display:inline-block;padding:14px 28px;background-color:#ffc809;color:#0f0f0f;font-size:12px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;text-decoration:none;font-family:monospace;"
                        >
                          Reply to ${firstName} →
                        </a>
                      </td>
                    </tr>

                    <!-- Quoted original message -->
                    <tr>
                      <td style="padding:24px 40px;">
                        <p style="margin:0 0 12px;font-size:10px;letter-spacing:0.1em;text-transform:uppercase;color:rgba(255,255,255,0.2);font-family:monospace;">
                          Original message — ${sentAt}
                        </p>
                        <table width="100%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td style="border-left:3px solid rgba(255,255,255,0.12);padding-left:16px;">
                              <p style="margin:0 0 6px;font-size:12px;color:rgba(255,255,255,0.25);font-family:monospace;">From: ${firstName} ${lastName} &lt;${email}&gt;</p>
                              ${company ? `<p style="margin:0 0 6px;font-size:12px;color:rgba(255,255,255,0.25);font-family:monospace;">Company: ${company}</p>` : ""}
                              ${siteUrl ? `<p style="margin:0 0 6px;font-size:12px;color:rgba(255,255,255,0.25);font-family:monospace;">Website: ${siteUrl}</p>` : ""}
                              <p style="margin:12px 0 0;font-size:12px;color:rgba(255,255,255,0.25);font-family:monospace;line-height:1.7;white-space:pre-wrap;">${projectDescription}</p>
                              ${
                                services && services.length > 0
                                  ? `<p style="margin:10px 0 0;font-size:12px;color:rgba(255,255,255,0.25);font-family:monospace;">Interested in: ${services.join(", ")}</p>`
                                  : ""
                              }
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                      <td style="padding:16px 40px;border-top:1px solid rgba(255,255,255,0.06);">
                        <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.15);font-family:monospace;text-transform:uppercase;letter-spacing:0.06em;">
                          Sent via fontsandfooters.com contact form
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

    if (error) {
      console.error("[Resend error]", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ messageId: data?.id }, { status: 200 });
  } catch (err) {
    console.error("[Contact route error]", err);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 },
    );
  }
}
