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
