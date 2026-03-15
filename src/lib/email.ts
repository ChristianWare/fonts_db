import { Resend } from "resend";

if (!process.env.RESEND_API_KEY) {
  throw new Error("Missing RESEND_API_KEY environment variable");
}

const resend = new Resend(process.env.RESEND_API_KEY);

export const FROM_ADDRESS = "Fonts & Footers <noreply@fontsandfooters.com>";
export const ADMIN_EMAIL = "chris@fontsandfooters.com";
export const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "https://fontsandfooters.com";

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string | string[];
  subject: string;
  html: string;
}) {
  try {
    await resend.emails.send({
      from: FROM_ADDRESS,
      to,
      subject,
      html,
    });
  } catch (err) {
    // Never let email failures break the main action
    console.error("[sendEmail] Failed to send email:", err);
  }
}

// ── Branded HTML template ──────────────────────────────────────────────────
export function buildEmailHTML({
  preheader,
  heading,
  body,
  ctaLabel,
  ctaUrl,
  isAdmin = false,
}: {
  preheader: string;
  heading: string;
  body: string;
  ctaLabel?: string;
  ctaUrl?: string;
  isAdmin?: boolean;
}) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${heading}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      background-color: #f5f5f5;
      color: #0a0a0a;
      -webkit-font-smoothing: antialiased;
    }
  </style>
</head>
<body>
  <!-- Preheader (hidden preview text) -->
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${preheader}</div>

  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#f5f5f5;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:560px;background-color:#ffffff;">

          <!-- Header -->
          <tr>
            <td style="background-color:#0a0a0a;padding:28px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td>
                    <span style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:18px;font-weight:800;text-transform:uppercase;letter-spacing:-0.5px;color:#ffc809;">
                      FONTS &amp; FOOTERS
                    </span>
                  </td>
                  <td align="right">
                    ${isAdmin ? `<span style="font-family:'Courier New',Courier,monospace;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;color:#555;background-color:#1a1a1a;padding:4px 10px;">ADMIN</span>` : `<span style="font-family:'Courier New',Courier,monospace;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;color:#555;">CLIENT PORTAL</span>`}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Heading bar -->
          <tr>
            <td style="background-color:#ffc809;padding:24px 40px;">
              <p style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.12em;color:#0a0a0a;opacity:0.6;margin-bottom:8px;">
                ${isAdmin ? "Admin Notification" : "Fonts & Footers"}
              </p>
              <h1 style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:26px;font-weight:800;text-transform:uppercase;letter-spacing:-0.5px;color:#0a0a0a;line-height:1.1;">
                ${heading}
              </h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 32px;">
              ${body}
            </td>
          </tr>

          <!-- CTA -->
          ${
            ctaLabel && ctaUrl
              ? `
          <tr>
            <td style="padding:0 40px 40px;">
              <a href="${ctaUrl}" style="display:inline-block;padding:14px 32px;background-color:#0a0a0a;color:#ffc809;font-family:'Courier New',Courier,monospace;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;text-decoration:none;">
                ${ctaLabel}
              </a>
            </td>
          </tr>
          `
              : ""
          }

          <!-- Divider -->
          <tr>
            <td style="padding:0 40px;">
              <div style="height:1px;background-color:#e5e5e5;"></div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px 32px;">
              <p style="font-family:'Courier New',Courier,monospace;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#999;">
                Fonts &amp; Footers &nbsp;·&nbsp; Black Car Platform Agency &nbsp;·&nbsp; <a href="${APP_URL}" style="color:#999;text-decoration:none;">${APP_URL.replace("https://", "")}</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ── Reusable body blocks ───────────────────────────────────────────────────
export function bodyText(text: string) {
  return `<p style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:15px;color:#333;line-height:1.7;margin-bottom:16px;">${text}</p>`;
}

export function bodyDetail(label: string, value: string) {
  return `
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:2px;">
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
          <tr>
            <td style="font-family:'Courier New',Courier,monospace;font-size:11px;text-transform:uppercase;letter-spacing:0.07em;color:#888;width:40%;">${label}</td>
            <td style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:14px;color:#0a0a0a;text-align:right;">${value}</td>
          </tr>
        </table>
      </td>
    </tr>
  </table>`;
}
