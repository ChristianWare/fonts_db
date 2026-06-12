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
    subject: "You're approved — let's build your website",
    html: buildEmailHTML({
      preheader: "Pay your setup fee to activate your subscription and start.",
      heading: "You're approved.",
      body:
        bodyText(
          `Hi ${firstName}, good news — ${businessName} is approved for your custom website. We're ready to start building.`,
        ) +
        bodyText(
          "The first step is your one-time setup fee. Once that's paid, your monthly subscription activates and your build kicks off.",
        ) +
        bodyText("Here's the full path from here:") +
        bodyDetail("Step 1", "Pay your setup fee to activate") +
        bodyDetail("Step 2", "Sign your service agreement") +
        bodyDetail("Step 3", "Complete the intake questionnaire") +
        bodyDetail("Step 4", "Upload your brand assets") +
        bodyDetail("Step 5", "Select your design") +
        bodyText("Hit the button below to pay your setup fee and get started."),
      ctaLabel: "Pay setup fee →",
      ctaUrl: `${APP_URL}/dashboard/billing/website`,
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
    try {
      return new URL(url).hostname;
    } catch {
      return url;
    }
  })();

  const failingCount = categories
    .flatMap((c) => c.checks)
    .filter((c) => !c.passed).length;
  const highImpactCount = categories
    .flatMap((c) => c.checks)
    .filter((c) => !c.passed && c.impact === "high").length;

  // Plain Gmail-style HTML — no marketing wrappers, just clean readable text
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background-color:#fff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#fff;">
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

// ── LEADS EMAILS ───────────────────────────────────────────────────────────

type HotLeadAlertEvent = {
  eventbriteId: string;
  eventName: string;
  eventDate: Date;
  venueName: string | null;
  aiScore: number | null;
  daysUntil: number;
};

export async function sendHotLeadAlertEmail({
  to,
  firstName,
  marketCity,
  marketState,
  events,
}: {
  to: string;
  firstName: string;
  marketCity: string;
  marketState: string;
  events: HotLeadAlertEvent[];
}) {
  if (events.length === 0) return;

  const count = events.length;
  const subject =
    count === 1
      ? `🔥 1 hot event in ${marketCity} — respond now`
      : `🔥 ${count} hot events in ${marketCity} — respond now`;

  const eventBlocks = events
    .map((e) => {
      const dateStr = e.eventDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      const urgency =
        e.daysUntil === 0
          ? "Today"
          : e.daysUntil === 1
            ? "Tomorrow"
            : `${e.daysUntil} days away`;
      const venue = e.venueName ?? "Venue TBD";
      const score = e.aiScore != null ? ` · score ${e.aiScore}` : "";

      return `
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:12px;">
          <tr>
            <td style="padding:16px;background-color:#f9f9f9;border-left:3px solid #ef4444;">
              <p style="font-family:'Courier New',Courier,monospace;font-size:11px;color:#ef4444;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 6px;">
                ${urgency}${score}
              </p>
              <a href="${APP_URL}/dashboard/leads/hot/${e.eventbriteId}" style="display:block;color:#0a0a0a;text-decoration:none;">
                <p style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:15px;font-weight:700;color:#0a0a0a;margin:0 0 4px;line-height:1.3;">
                  ${e.eventName}
                </p>
                <p style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:13px;color:#555555;margin:0;">
                  ${dateStr} · ${venue}
                </p>
              </a>
            </td>
          </tr>
        </table>
      `;
    })
    .join("");

  const intro =
    count === 1
      ? `Hi ${firstName}, one event in <strong>${marketCity}, ${marketState}</strong> just hit the 14-day window. Respond before the organizer locks in transportation.`
      : `Hi ${firstName}, ${count} events in <strong>${marketCity}, ${marketState}</strong> just hit the 14-day window. Respond before the organizers lock in transportation.`;

  await sendEmail({
    to,
    subject,
    html: buildEmailHTML({
      preheader:
        count === 1
          ? `1 event in ${marketCity} needs your attention.`
          : `${count} events in ${marketCity} need your attention.`,
      heading: count === 1 ? "🔥 Hot lead alert." : "🔥 Hot lead alerts.",
      body: bodyText(intro) + eventBlocks,
      ctaLabel: "See all hot leads →",
      ctaUrl: `${APP_URL}/dashboard/leads/search`,
    }),
  });
}

type DailyDigestEvent = {
  eventbriteId: string;
  eventName: string;
  eventDate: Date;
  venueName: string | null;
  aiScore: number | null;
  daysOut: number;
};

export async function sendDailyDigestEmail({
  to,
  firstName,
  marketCity,
  marketState,
  events,
  totalNewCount,
}: {
  to: string;
  firstName: string;
  marketCity: string;
  marketState: string;
  events: DailyDigestEvent[];
  totalNewCount: number;
}) {
  if (events.length === 0) return;

  const count = totalNewCount;
  const subject =
    count === 1
      ? `1 new warm lead in ${marketCity}`
      : `${count} new warm leads in ${marketCity}`;

  const eventBlocks = events
    .map((e) => {
      const dateStr = e.eventDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      const venue = e.venueName ?? "Venue TBD";
      const scoreChip = e.aiScore != null ? `score ${e.aiScore} · ` : "";

      return `
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:12px;">
          <tr>
            <td style="padding:16px;background-color:#f9f9f9;border-left:3px solid #f97316;">
              <p style="font-family:'Courier New',Courier,monospace;font-size:11px;color:#f97316;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 6px;">
                ${scoreChip}${e.daysOut} days out
              </p>
              <a href="${APP_URL}/dashboard/leads/warm/${e.eventbriteId}" style="display:block;color:#0a0a0a;text-decoration:none;">
                <p style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:15px;font-weight:700;color:#0a0a0a;margin:0 0 4px;line-height:1.3;">
                  ${e.eventName}
                </p>
                <p style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:13px;color:#555555;margin:0;">
                  ${dateStr} · ${venue}
                </p>
              </a>
            </td>
          </tr>
        </table>
      `;
    })
    .join("");

  const intro =
    count === 1
      ? `Hi ${firstName}, one new event appeared in <strong>${marketCity}, ${marketState}</strong> overnight. Pitch the organizer before they finalize transportation.`
      : count <= MAX_DIGEST_EVENTS
        ? `Hi ${firstName}, ${count} new events appeared in <strong>${marketCity}, ${marketState}</strong> overnight. Pitch the organizers before they finalize transportation.`
        : `Hi ${firstName}, ${count} new events appeared in <strong>${marketCity}, ${marketState}</strong> overnight. Here are the top ${events.length} by score:`;

  await sendEmail({
    to,
    subject,
    html: buildEmailHTML({
      preheader:
        count === 1
          ? `1 new event in ${marketCity} this morning.`
          : `${count} new events in ${marketCity} this morning.`,
      heading: "Your daily lead digest.",
      body: bodyText(intro) + eventBlocks,
      ctaLabel: "See all warm leads →",
      ctaUrl: `${APP_URL}/dashboard/leads/search`,
    }),
  });
}

const MAX_DIGEST_EVENTS = 5;

function formatCentsPlain(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

function formatDate(d: Date) {
  return d.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

const BILLING_URL = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://fontsandfooters.com"}/dashboard/billing`;

// ── Trial ending (sent ~3 days before the leads trial converts) ──
export async function sendLeadsTrialEndingEmail({
  to,
  name,
  trialEndsAt,
  amountCents,
  savedLeadsCount,
}: {
  to: string;
  name: string;
  trialEndsAt: Date | null;
  amountCents: number;
  savedLeadsCount: number;
}) {
  const endText = trialEndsAt ? formatDate(trialEndsAt) : "in a few days";
  const amount = formatCentsPlain(amountCents);

  const subject = `Your leads trial ends ${endText}`;

  const html = `
    <p>Hey ${name},</p>
    <p>Quick heads up — your Fonts &amp; Footers leads trial ends on <strong>${endText}</strong>. If you don't do anything, your card gets charged ${amount} on that date and the tool keeps running.</p>
    ${
      savedLeadsCount > 0
        ? `<p>So far you've saved <strong>${savedLeadsCount} lead${savedLeadsCount === 1 ? "" : "s"}</strong> to your pipeline. If even one of those turns into a corporate account, the tool paid for itself for the year.</p>`
        : `<p>Looks like you haven't saved any leads yet. If you haven't had a chance to dig in, now's the time — you've still got a few days of free access.</p>`
    }
    <p>If it's working for you, there's nothing to do.</p>
    <p>If it's not, cancelling takes one click from your <a href="${BILLING_URL}">billing page</a> — you keep access through the end of the trial and your card is never charged. No hoops, no hard feelings.</p>
    <p>Questions? Just reply to this email.</p>
    <p>— Chris<br/>Fonts &amp; Footers</p>
  `;

  // Use the same transport as sendBillingConfirmedEmail:
  return sendEmail({ to, subject, html });
}

// ── Payment failed (dunning) ──
export async function sendPaymentFailedEmail({
  to,
  name,
  productLabel,
  amountCents,
  nextRetryAt,
}: {
  to: string;
  name: string;
  productLabel: string;
  amountCents: number;
  nextRetryAt: Date | null;
}) {
  const amount = formatCentsPlain(amountCents);
  const subject = `Payment issue on your Fonts & Footers account`;

  const html = `
    <p>Hey ${name},</p>
    <p>The ${amount} charge for your <strong>${productLabel}</strong> subscription didn't go through. This is usually an expired card or a bank decline — nothing dramatic.</p>
    <p>Your access is still active for now. To fix it, update your card on your <a href="${BILLING_URL}">billing page</a> — takes about a minute.</p>
    ${
      nextRetryAt
        ? `<p>If you don't update it, we'll automatically retry the charge around ${formatDate(nextRetryAt)}.</p>`
        : ""
    }
    <p>If something looks off or you have questions, just reply.</p>
    <p>— Chris<br/>Fonts &amp; Footers</p>
  `;

  return sendEmail({ to, subject, html });
}

// ── Cancellation confirmed (sub has actually ended) ──
export async function sendCancellationConfirmedEmail({
  to,
  name,
  productLabel,
}: {
  to: string;
  name: string;
  productLabel: string;
}) {
  const subject = `Your ${productLabel} subscription is cancelled`;

  const html = `
    <p>Hey ${name},</p>
    <p>Confirming your <strong>${productLabel}</strong> subscription is cancelled. No further charges.</p>
    <p>Your account and settings are still here, so if you ever want to come back, re-enrolling takes about a minute from your <a href="${BILLING_URL}">billing page</a>.</p>
    <p>If anything about the product didn't work for you, I'd genuinely like to know — just reply and tell me. It's a one-person shop and that feedback goes straight into the build.</p>
    <p>— Chris<br/>Fonts &amp; Footers</p>
  `;

  return sendEmail({ to, subject, html });
}

// ── Leads welcome (sent right after enrollment) ──
export async function sendLeadsWelcomeEmail({
  to,
  name,
  trialEndsAt,
  amountCents,
  cardBrand,
  cardLast4,
  billingDay,
}: {
  to: string;
  name: string;
  trialEndsAt: Date | null;
  amountCents: number;
  cardBrand: string | null;
  cardLast4: string | null;
  billingDay: number | null;
}) {
  const firstName = name.split(" ")[0];
  const amount = formatCentsPlain(amountCents);
  const trialEndText = trialEndsAt ? formatDate(trialEndsAt) : "in 7 days";
  const cardText =
    cardBrand && cardLast4
      ? `${cardBrand.charAt(0).toUpperCase() + cardBrand.slice(1)} ending ${cardLast4}`
      : "the card you used at signup";
  const billingDayText = billingDay
    ? `Day ${billingDay} of each month`
    : "Monthly";

  await sendEmail({
    to,
    subject: "You're in — your leads trial has started",
    html: buildEmailHTML({
      preheader: `Your 7-day free trial is live. First charge ${trialEndText}.`,
      heading: "Welcome to the leads tool.",
      body:
        bodyText(
          `Hi ${firstName}, you're enrolled and your 7-day free trial is live — no charge yet.`,
        ) +
        bodyText("Here's what you've got:") +
        bodyText(
          "<strong>Hot leads</strong> — events in your market within 14 days, before the organizer books transportation. <strong>Warm leads</strong> — galas, conferences, and weddings 15–90 days out. <strong>Cold leads</strong> — hotels, venues, corporate offices, and clubs in your service area for repeat business.",
        ) +
        bodyText(
          "Every lead is AI-scored 0–100 and enriched with verified organizer and venue contacts, plus a strategic brief and outreach script you can send.",
        ) +
        bodyText(
          "<strong>Getting started:</strong> open your leads settings, set your primary city and service radius (5–75 miles) so we only show events you can actually serve. Then check your dashboard each morning for the day's highest-scoring prospects.",
        ) +
        bodyText("<strong>Your billing, plainly:</strong>") +
        bodyDetail("Free trial through", trialEndText) +
        bodyDetail("First charge", `${amount} on ${trialEndText}`) +
        bodyDetail("Card on file", cardText) +
        bodyDetail("Then billed", billingDayText) +
        bodyText(
          `Cancel anytime before ${trialEndText} from your billing page and you won't be charged a cent.`,
        ),
      ctaLabel: "Set your market →",
      ctaUrl: `${APP_URL}/dashboard/leads/settings`,
    }),
  });
}

// ── Payment receipt (sent on every successful charge, both products) ──
export async function sendPaymentReceiptEmail({
  to,
  name,
  productLabel,
  invoiceNumber,
  amountCents,
  paidAt,
  periodStart,
  periodEnd,
  hostedInvoiceUrl,
  pdfBuffer,
  pdfFilename,
}: {
  to: string;
  name: string;
  productLabel: string;
  invoiceNumber: string;
  amountCents: number;
  paidAt: Date;
  periodStart: Date | null;
  periodEnd: Date | null;
  hostedInvoiceUrl: string | null;
  pdfBuffer: Buffer | null;
  pdfFilename: string;
}) {
  const firstName = name.split(" ")[0];
  const amount = formatCentsPlain(amountCents);
  const paidText = formatDate(paidAt);
  const periodText =
    periodStart && periodEnd
      ? `${periodStart.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        })} – ${formatDate(periodEnd)}`
      : null;

  await sendEmail({
    to,
    subject: `Payment received — ${productLabel} (${invoiceNumber})`,
    html: buildEmailHTML({
      preheader: `Thanks — we received your ${amount} payment.`,
      heading: "Payment received.",
      body:
        bodyText(
          `Hi ${firstName}, thanks — your payment went through and your ${productLabel} subscription is paid and active. Your full receipt is attached as a PDF.`,
        ) +
        bodyDetail("Product", productLabel) +
        bodyDetail("Invoice", invoiceNumber) +
        bodyDetail("Amount paid", amount) +
        bodyDetail("Date paid", paidText) +
        (periodText ? bodyDetail("Billing period", periodText) : "") +
        bodyText(
          "No action needed — this is just your record of the charge. Questions about a payment? Just reply to this email.",
        ),
      ctaLabel: hostedInvoiceUrl ? "View invoice online →" : undefined,
      ctaUrl: hostedInvoiceUrl ?? undefined,
    }),
    attachments: pdfBuffer
      ? [{ filename: pdfFilename, content: pdfBuffer }]
      : undefined,
  });
}