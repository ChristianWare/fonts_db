/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  sendEmail,
  buildEmailHTML,
  bodyText,
  bodyDetail,
  ADMIN_EMAIL,
  APP_URL,
} from "@/lib/email";

// ── CLIENT EMAILS ──────────────────────────────────────────────────────────

export async function sendWelcomeEmail({
  to,
  name,
  businessName,
}: {
  to: string;
  name: string;
  businessName: string;
}) {
  const firstName = name.split(" ")[0];
  await sendEmail({
    to,
    subject: "Welcome to Fonts & Footers — your portal is ready",
    html: buildEmailHTML({
      preheader: "Your client portal is ready. Let's get started.",
      heading: "Welcome aboard.",
      body:
        bodyText(
          `Hi ${firstName}, your Fonts & Footers client portal is now active.`,
        ) +
        bodyText("Here's what to do next to get your platform built:") +
        bodyDetail("Step 1", "Sign your service agreement") +
        bodyDetail("Step 2", "Set up billing") +
        bodyDetail("Step 3", "Complete the intake questionnaire") +
        bodyDetail("Step 4", "Upload your brand assets") +
        bodyDetail("Step 5", "Select your design"),
      ctaLabel: "Go to your portal →",
      ctaUrl: `${APP_URL}/dashboard`,
    }),
  });
}

export async function sendDocumentReadyEmail({
  to,
  name,
  documentTitle,
  documentId,
}: {
  to: string;
  name: string;
  documentTitle: string;
  documentId: string;
}) {
  const firstName = name.split(" ")[0];
  await sendEmail({
    to,
    subject: `Action required: ${documentTitle} is ready for your signature`,
    html: buildEmailHTML({
      preheader: `${documentTitle} is ready for your signature.`,
      heading: "Document ready to sign.",
      body:
        bodyText(
          `Hi ${firstName}, a document has been added to your portal and requires your signature.`,
        ) + bodyDetail("Document", documentTitle),
      ctaLabel: "Sign document →",
      ctaUrl: `${APP_URL}/dashboard/documents/${documentId}/sign`,
    }),
  });
}

export async function sendBillingConfirmedEmail({
  to,
  name,
  setupFeeCents,
  monthlyCents,
}: {
  to: string;
  name: string;
  setupFeeCents: number;
  monthlyCents: number;
}) {
  const firstName = name.split(" ")[0];
  const fmt = (cents: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(cents / 100);

  const now = new Date();
  const firstOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const nextBilling = firstOfNextMonth.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  await sendEmail({
    to,
    subject: "Billing confirmed — your account is active",
    html: buildEmailHTML({
      preheader:
        "Your setup fee has been charged and your subscription is active.",
      heading: "Billing activated.",
      body:
        bodyText(
          `Hi ${firstName}, your payment has been processed and your account is now active.`,
        ) +
        bodyDetail("Setup fee charged", fmt(setupFeeCents)) +
        bodyDetail("Monthly rate", `${fmt(monthlyCents)}/month`) +
        bodyDetail("First monthly charge", nextBilling) +
        bodyDetail("Billing day", "1st of each month"),
      ctaLabel: "View billing →",
      ctaUrl: `${APP_URL}/dashboard/billing`,
    }),
  });
}

export async function sendSupportTicketConfirmationEmail({
  to,
  name,
  subject: ticketSubject,
}: {
  to: string;
  name: string;
  subject: string;
}) {
  const firstName = name.split(" ")[0];
  await sendEmail({
    to,
    subject: "We received your support request",
    html: buildEmailHTML({
      preheader: "Your support request has been received.",
      heading: "Support request received.",
      body:
        bodyText(
          `Hi ${firstName}, we've received your support request and will get back to you shortly.`,
        ) +
        bodyDetail("Subject", ticketSubject) +
        bodyText("You can track the status of your request in your portal."),
      ctaLabel: "View support →",
      ctaUrl: `${APP_URL}/dashboard/support`,
    }),
  });
}

export async function sendChangeRequestConfirmationEmail({
  to,
  name,
  title,
}: {
  to: string;
  name: string;
  title: string;
}) {
  const firstName = name.split(" ")[0];
  await sendEmail({
    to,
    subject: "Change request received",
    html: buildEmailHTML({
      preheader: "Your change request has been received.",
      heading: "Change request received.",
      body:
        bodyText(
          `Hi ${firstName}, your change request has been logged and we'll review it shortly.`,
        ) +
        bodyDetail("Request", title) +
        bodyText("You can track its progress in your portal."),
      ctaLabel: "View change requests →",
      ctaUrl: `${APP_URL}/dashboard/change-requests`,
    }),
  });
}

// ── ADMIN EMAILS ───────────────────────────────────────────────────────────

export async function sendAdminNewClientEmail({
  clientName,
  businessName,
  email,
  clientProfileId,
}: {
  clientName: string;
  businessName: string;
  email: string;
  clientProfileId: string;
}) {
  await sendEmail({
    to: ADMIN_EMAIL,
    subject: `New client registered — ${businessName}`,
    html: buildEmailHTML({
      preheader: `${businessName} just registered.`,
      heading: "New client registered.",
      body:
        bodyDetail("Name", clientName) +
        bodyDetail("Business", businessName) +
        bodyDetail("Email", email),
      ctaLabel: "View client →",
      ctaUrl: `${APP_URL}/admin/clients/${clientProfileId}`,
      isAdmin: true,
    }),
  });
}

export async function sendAdminDocumentSignedEmail({
  clientName,
  businessName,
  documentTitle,
  clientProfileId,
}: {
  clientName: string;
  businessName: string;
  documentTitle: string;
  clientProfileId: string;
}) {
  await sendEmail({
    to: ADMIN_EMAIL,
    subject: `Document signed — ${businessName}`,
    html: buildEmailHTML({
      preheader: `${clientName} signed ${documentTitle}.`,
      heading: "Document signed.",
      body:
        bodyDetail("Client", clientName) +
        bodyDetail("Business", businessName) +
        bodyDetail("Document", documentTitle),
      ctaLabel: "View client →",
      ctaUrl: `${APP_URL}/admin/clients/${clientProfileId}`,
      isAdmin: true,
    }),
  });
}

export async function sendAdminQuestionnaireSubmittedEmail({
  clientName,
  businessName,
  clientProfileId,
}: {
  clientName: string;
  businessName: string;
  clientProfileId: string;
}) {
  await sendEmail({
    to: ADMIN_EMAIL,
    subject: `Questionnaire submitted — ${businessName}`,
    html: buildEmailHTML({
      preheader: `${clientName} submitted their intake questionnaire.`,
      heading: "Questionnaire submitted.",
      body:
        bodyDetail("Client", clientName) + bodyDetail("Business", businessName),
      ctaLabel: "View responses →",
      ctaUrl: `${APP_URL}/admin/clients/${clientProfileId}`,
      isAdmin: true,
    }),
  });
}

export async function sendAdminAssetsUploadedEmail({
  clientName,
  businessName,
  fileName,
  clientProfileId,
}: {
  clientName: string;
  businessName: string;
  fileName: string;
  clientProfileId: string;
}) {
  await sendEmail({
    to: ADMIN_EMAIL,
    subject: `Brand assets uploaded — ${businessName}`,
    html: buildEmailHTML({
      preheader: `${clientName} uploaded brand assets.`,
      heading: "Brand assets uploaded.",
      body:
        bodyDetail("Client", clientName) +
        bodyDetail("Business", businessName) +
        bodyDetail("File", fileName),
      ctaLabel: "View assets →",
      ctaUrl: `${APP_URL}/admin/clients/${clientProfileId}`,
      isAdmin: true,
    }),
  });
}

export async function sendAdminDesignSelectedEmail({
  clientName,
  businessName,
  templateName,
  clientProfileId,
}: {
  clientName: string;
  businessName: string;
  templateName: string;
  clientProfileId: string;
}) {
  await sendEmail({
    to: ADMIN_EMAIL,
    subject: `Design selected — ${businessName}`,
    html: buildEmailHTML({
      preheader: `${clientName} selected their design.`,
      heading: "Design selected.",
      body:
        bodyDetail("Client", clientName) +
        bodyDetail("Business", businessName) +
        bodyDetail("Template", templateName),
      ctaLabel: "View selection →",
      ctaUrl: `${APP_URL}/admin/clients/${clientProfileId}`,
      isAdmin: true,
    }),
  });
}

export async function sendAdminSupportTicketEmail({
  clientName,
  businessName,
  subject: ticketSubject,
  message,
  clientProfileId,
}: {
  clientName: string;
  businessName: string;
  subject: string;
  message: string;
  clientProfileId: string;
}) {
  await sendEmail({
    to: ADMIN_EMAIL,
    subject: `Support ticket — ${businessName}`,
    html: buildEmailHTML({
      preheader: `${clientName} submitted a support ticket.`,
      heading: "Support ticket submitted.",
      body:
        bodyDetail("Client", clientName) +
        bodyDetail("Business", businessName) +
        bodyDetail("Subject", ticketSubject) +
        `<div style="margin-top:16px;padding:16px;background-color:#f5f5f5;border-left:3px solid #0a0a0a;">
          <p style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:14px;color:#333;line-height:1.7;">${message}</p>
        </div>`,
      ctaLabel: "View ticket →",
      ctaUrl: `${APP_URL}/admin/support`,
      isAdmin: true,
    }),
  });
}

export async function sendAdminChangeRequestEmail({
  clientName,
  businessName,
  title,
  description,
  clientProfileId,
}: {
  clientName: string;
  businessName: string;
  title: string;
  description: string;
  clientProfileId: string;
}) {
  await sendEmail({
    to: ADMIN_EMAIL,
    subject: `Change request — ${businessName}`,
    html: buildEmailHTML({
      preheader: `${clientName} submitted a change request.`,
      heading: "Change request submitted.",
      body:
        bodyDetail("Client", clientName) +
        bodyDetail("Business", businessName) +
        bodyDetail("Title", title) +
        `<div style="margin-top:16px;padding:16px;background-color:#f5f5f5;border-left:3px solid #0a0a0a;">
          <p style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:14px;color:#333;line-height:1.7;">${description}</p>
        </div>`,
      ctaLabel: "View request →",
      ctaUrl: `${APP_URL}/admin/change-requests`,
      isAdmin: true,
    }),
  });
}

// ── REPLACE your existing sendAuditReportEmail in lib/emails.ts with this ──

export async function sendAuditReportEmail({
  to,
  firstName,
  url,
  score,
  grade,
  summary,
  monthlyVisitors,
  keywordsRanking,
  estimatedLostBookings,
  categories,
  pdfBuffer,
}: {
  to: string;
  firstName: string;
  url: string;
  score: number;
  grade: string;
  summary: string;
  monthlyVisitors: number;
  keywordsRanking: number;
  estimatedLostBookings: number;
  categories: Array<{
    label: string;
    grade: string;
    score: number;
    checks: Array<{
      label: string;
      passed: boolean;
      message: string;
      fix?: string;
      impact: "high" | "medium" | "low";
    }>;
  }>;
  pdfBuffer: Buffer;
}) {
  const domain = (() => {
    try { return new URL(url).hostname; } catch { return url; }
  })();

  const failingCount = categories.flatMap(c => c.checks).filter(c => !c.passed).length;
  const highImpactCount = categories.flatMap(c => c.checks).filter(c => !c.passed && c.impact === "high").length;

  // Plain Gmail-style HTML — no marketing wrappers, just clean readable text
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background-color:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#ffffff;">
    <tr>
      <td style="padding:32px 40px;max-width:600px;">

        <!-- Body text — plain, readable, personal -->
        <p style="margin:0 0 20px;font-size:15px;color:#1a1a1a;line-height:1.6;">Hey ${firstName},</p>

        <p style="margin:0 0 20px;font-size:15px;color:#1a1a1a;line-height:1.6;">
          I just ran a full audit on <strong>${domain}</strong> — your complete report is attached as a PDF.
        </p>

        <p style="margin:0 0 20px;font-size:15px;color:#1a1a1a;line-height:1.6;">
          Your site scored a <strong>${grade} (${score}/100)</strong>. ${summary}
        </p>

        <p style="margin:0 0 8px;font-size:15px;color:#1a1a1a;line-height:1.6;">
          Here's the quick summary:
        </p>

        <ul style="margin:0 0 20px;padding-left:20px;">
          <li style="font-size:15px;color:#1a1a1a;line-height:1.8;">~ ${monthlyVisitors} estimated monthly organic visitors</li>
          <li style="font-size:15px;color:#1a1a1a;line-height:1.8;">${keywordsRanking} keywords currently ranking on Google</li>
          <li style="font-size:15px;color:#1a1a1a;line-height:1.8;color:#cc0000;">~ ${estimatedLostBookings} estimated bookings lost per month</li>
          <li style="font-size:15px;color:#1a1a1a;line-height:1.8;">${failingCount} issues found across all categories${highImpactCount > 0 ? ` — ${highImpactCount} are high impact` : ""}</li>
        </ul>

        <p style="margin:0 0 20px;font-size:15px;color:#1a1a1a;line-height:1.6;">
          The PDF has the full breakdown with a specific fix for every issue. If you want to talk through it, grab a free 15-minute call below — I'll show you the 2–3 things that would make the biggest difference for your operation.
        </p>

        <!-- CTA button -->
        <table cellpadding="0" cellspacing="0" style="margin:0 0 32px;">
          <tr>
            <td style="background-color:#ffbe00;padding:0;">
              <a href="https://calendly.com/chris-fontsandfooters/30min"
                style="display:inline-block;padding:14px 28px;background-color:#ffbe00;color:#0f0f0f;font-size:13px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;text-decoration:none;font-family:monospace;">
                Book Free 15-Min Call →
              </a>
            </td>
          </tr>
        </table>

        <!-- Sign off -->
        <p style="margin:0 0 32px;font-size:15px;color:#1a1a1a;line-height:1.6;">
          Talk soon,<br />
          Chris
        </p>

        <!-- Signature divider -->
        <hr style="border:none;border-top:1px solid #e8e8e8;margin:0 0 20px;" />

        <!-- Signature block -->
        <table cellpadding="0" cellspacing="0">
          <tr>
            <td style="vertical-align:middle;padding-right:16px;">
              <img
                src="https://fontsandfooters.com/logos/fnf_logo_black.png"
                alt="Fonts &amp; Footers"
                width="32"
                height="32"
                style="display:block;width:32px;height:32px;object-fit:contain;"
              />
            </td>
            <td style="vertical-align:middle;">
              <p style="margin:0;font-size:14px;font-weight:700;color:#0f0f0f;line-height:1.4;">Chris Ware</p>
              <p style="margin:0;font-size:13px;color:#666666;line-height:1.4;">Founder, Fonts &amp; Footers</p>
            </td>
          </tr>
          <tr>
            <td colspan="2" style="padding-top:8px;">
              <p style="margin:0;font-size:13px;color:#666666;line-height:1.8;">
                <a href="mailto:chris@fontsandfooters.com" style="color:#666666;text-decoration:none;">chris@fontsandfooters.com</a><br />
                <a href="https://fontsandfooters.com" style="color:#666666;text-decoration:none;">fontsandfooters.com</a><br />
                <a href="https://www.linkedin.com/in/christian-ware/" style="color:#666666;text-decoration:none;">LinkedIn</a>
                &nbsp;·&nbsp;
                <a href="https://www.instagram.com/fontsandfooters/" style="color:#666666;text-decoration:none;">Instagram</a>
              </p>
            </td>
          </tr>
        </table>

      </td>
    </tr>
  </table>
</body>
</html>`;

  const filename = `audit-${domain.replace(/\./g, "-")}.pdf`;

  await sendEmail({
    to,
    subject: `Your website audit — ${domain}`,
    html,
    // Pass PDF as attachment — matches the Resend pattern in sendEstimateEmail
    attachments: [
      {
        filename,
        content: pdfBuffer,
      },
    ],
  });
}