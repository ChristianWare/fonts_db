export function buildAgreementHTML({
  clientName,
  businessName,
  date,
  signedDate,
}: {
  clientName: string;
  businessName: string;
  date: string;
  signedDate?: string; // If provided, renders the signed state
}): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Web Services Agreement — ${businessName}</title>
  <style>
    * {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

@page {
  margin: 48px 0;
}
    body {
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 11pt;
  color: #111;
  background: #fff;
  padding: 24px 80px;
  line-height: 1.6;
}

    /* ── HEADER ── */
    .header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      margin-bottom: 48px;
      padding-bottom: 32px;
      border-bottom: 2px solid #111;
    }

    .brand {
      font-size: 18pt;
      font-weight: 800;
      letter-spacing: -0.03em;
      text-transform: uppercase;
      color: #111;
    }

    .brand-sub {
      font-size: 9pt;
      color: #666;
      margin-top: 4px;
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }

    .doc-meta {
      text-align: right;
      font-size: 9pt;
      color: #666;
      line-height: 1.8;
    }

    /* ── TITLE ── */
    .doc-title {
      font-size: 22pt;
      font-weight: 800;
      letter-spacing: -0.03em;
      text-transform: uppercase;
      color: #111;
      margin-bottom: 8px;
    }

    .doc-subtitle {
      font-size: 11pt;
      color: #444;
      margin-bottom: 40px;
    }

    /* ── PARTIES ── */
    .parties {
      display: flex;
      gap: 32px;
      margin-bottom: 40px;
      background: #f5f5f5;
      border-radius: 6px;
      padding: 24px;
    }

    .party {
      flex: 1;
    }

    .party-label {
      font-size: 8pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #888;
      margin-bottom: 6px;
    }

    .party-name {
      font-size: 13pt;
      font-weight: 700;
      color: #111;
    }

    .party-detail {
      font-size: 9.5pt;
      color: #555;
      margin-top: 2px;
    }

    /* ── SECTIONS ── */
    .section {
      margin-bottom: 28px;
      page-break-inside: avoid;
      break-inside: avoid;
    }

    .section-title {
  font-size: 11pt;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #111;
  margin-bottom: 10px;
  margin-top: 8px;
  padding-bottom: 6px;
  border-bottom: 1px solid #e5e5e5;
  page-break-after: avoid;
  break-after: avoid;
  page-break-before: auto;
  break-before: auto;
}

    .section p {
      margin-bottom: 10px;
      color: #333;
    }

    .section ul {
      padding-left: 20px;
      margin-bottom: 10px;
    }

    .section ul li {
      margin-bottom: 6px;
      color: #333;
    }

    /* ── HIGHLIGHT BOX ── */
    .highlight {
      background: #f5f5f5;
      border-left: 3px solid #111;
      padding: 14px 18px;
      border-radius: 0 4px 4px 0;
      margin: 12px 0;
      font-size: 10.5pt;
    }

    .highlight strong {
      display: block;
      font-size: 9pt;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #888;
      margin-bottom: 4px;
    }

    /* ── SIGNATURE BLOCK ── */
    .signature-section {
      margin-top: 48px;
      padding-top: 32px;
      border-top: 2px solid #111;
    }

    .signature-title {
      font-size: 11pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      margin-bottom: 24px;
    }

    .signature-grid {
      display: flex;
      gap: 48px;
    }

    .signature-block {
      flex: 1;
    }

    .signature-label {
      font-size: 8.5pt;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #888;
      margin-bottom: 4px;
    }

    .signature-party {
      font-size: 10pt;
      font-weight: 700;
      color: #111;
      margin-bottom: 36px;
    }

    .signature-line {
      border-bottom: 1.5px solid #111;
      margin-bottom: 6px;
    }

    .signature-field-label {
      font-size: 8pt;
      color: #888;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .signature-signed {
      font-family: Georgia, 'Times New Roman', serif;
      font-size: 22pt;
      font-style: italic;
      color: #111;
      padding: 4px 0 8px;
      border-bottom: 1.5px solid #111;
      margin-bottom: 6px;
    }

    .signature-signed-date {
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      font-size: 11pt;
      color: #111;
      padding: 4px 0 8px;
      border-bottom: 1.5px solid #111;
      margin-bottom: 6px;
      margin-top: 20px;
    }

    /* ── FOOTER ── */
    .footer {
      margin-top: 48px;
      padding-top: 16px;
      border-top: 1px solid #e5e5e5;
      font-size: 8pt;
      color: #999;
      text-align: center;
    }
  </style>
</head>
<body>

  <!-- Header -->
  <div class="header">
    <div>
      <div class="brand">Fonts &amp; Footers</div>
      <div class="brand-sub">Web Development Agency</div>
    </div>
    <div class="doc-meta">
      <div>Web Services Agreement</div>
      <div>Date: ${date}</div>
      <div>Client: ${businessName}</div>
    </div>
  </div>

  <!-- Title -->
  <div class="doc-title">Web Services Agreement</div>
  <div class="doc-subtitle">
    This agreement governs the web development services provided by Fonts &amp; Footers to the Client.
  </div>

  <!-- Parties -->
  <div class="parties">
    <div class="party">
      <div class="party-label">Service Provider</div>
      <div class="party-name">Fonts &amp; Footers</div>
      <div class="party-detail">Web Development Agency</div>
    </div>
    <div class="party">
      <div class="party-label">Client</div>
      <div class="party-name">${businessName}</div>
      <div class="party-detail">Represented by ${clientName}</div>
    </div>
  </div>

  <!-- 1. Services -->
  <div class="section">
    <div class="section-title">1. Services</div>
    <p>
      Fonts &amp; Footers agrees to design, develop, and deliver a custom direct booking website
      for the Client's black car service or private transportation business. The deliverable
      includes a fully functional booking platform with real-time quoting, vehicle selection,
      airport pickup configuration, and integrated payment processing.
    </p>
    <p>The following services are included:</p>
    <ul>
      <li>Custom website design tailored to the Client's brand</li>
      <li>Direct booking engine with real-time pricing</li>
      <li>Vehicle fleet management and selection interface</li>
      <li>Airport pickup scheduling and zone configuration</li>
      <li>Payment processing integration</li>
      <li>Mobile-responsive design across all devices</li>
      <li>Initial content setup based on Client-provided materials</li>
    </ul>
  </div>

  <!-- 2. Payment Terms -->
  <div class="section">
    <div class="section-title">2. Payment Terms</div>
    <p>
      The Client agrees to a monthly subscription billed automatically via the payment method
      on file. Subscription billing begins upon activation of the Client's account.
    </p>
    <div class="highlight">
      <strong>Billing</strong>
      Monthly subscription — billed automatically. Subscription continues until cancelled in writing
      with 30 days notice.
    </div>
    <p>
      All payments are non-refundable once work on the current billing cycle has commenced.
      Fonts &amp; Footers reserves the right to suspend access to the platform for accounts
      with overdue balances.
    </p>
  </div>

  <!-- 3. Client Responsibilities -->
  <div class="section">
    <div class="section-title">3. Client Responsibilities</div>
    <p>The Client agrees to provide in a timely manner:</p>
    <ul>
      <li>Completed intake questionnaire with business details and service offerings</li>
      <li>Brand assets including logo files, photography, and brand guidelines</li>
      <li>Content review and approvals within 5 business days of submission</li>
      <li>A designated point of contact authorized to provide approvals</li>
    </ul>
    <p>
      Delays caused by the Client's failure to provide required materials may result in
      corresponding delays to the project timeline without liability to Fonts &amp; Footers.
    </p>
  </div>

  <!-- 4. Intellectual Property -->
  <div class="section">
    <div class="section-title">4. Intellectual Property</div>
    <p>
      Upon full payment of all amounts due, the Client shall own all custom design elements
      and content created specifically for the project. Fonts &amp; Footers retains ownership
      of all underlying frameworks, templates, code libraries, and development methodologies
      used in the build.
    </p>
    <p>
      The Client grants Fonts &amp; Footers the right to display the completed project in
      its portfolio and marketing materials unless the Client requests otherwise in writing.
    </p>
  </div>

  <!-- 5. Revisions & Changes -->
  <div class="section">
    <div class="section-title">5. Revisions &amp; Change Requests</div>
    <p>
      The project includes one round of revisions following the design review phase.
      Additional revision rounds or scope changes requested after approval will be quoted
      separately and billed accordingly.
    </p>
    <p>
      Change requests must be submitted through the Client portal's change request system.
      Verbal or informal change requests will not be actioned until submitted in writing.
    </p>
  </div>

  <!-- 6. Confidentiality -->
  <div class="section">
    <div class="section-title">6. Confidentiality</div>
    <p>
      Both parties agree to keep confidential any proprietary information, pricing, business
      strategies, and technical details shared during the engagement. This obligation survives
      termination of this agreement.
    </p>
  </div>

  <!-- 7. Limitation of Liability -->
  <div class="section">
    <div class="section-title">7. Limitation of Liability</div>
    <p>
      Fonts &amp; Footers shall not be liable for any indirect, incidental, or consequential
      damages arising from the use or inability to use the delivered platform. Total liability
      shall not exceed the total fees paid by the Client in the three months preceding the claim.
    </p>
  </div>

  <!-- 8. Termination -->
  <div class="section">
    <div class="section-title">8. Termination</div>
    <p>
      Either party may terminate this agreement with 30 days written notice. Upon termination,
      the Client is responsible for all fees accrued through the end of the notice period.
      Fonts &amp; Footers will provide a data export of all Client content upon request within
      30 days of termination.
    </p>
  </div>

  <!-- 9. Governing Law -->
  <div class="section">
    <div class="section-title">9. Governing Law</div>
    <p>
      This agreement shall be governed by the laws of the jurisdiction in which Fonts &amp; Footers
      operates. Any disputes shall be resolved through binding arbitration before resorting to
      litigation.
    </p>
  </div>

  <!-- Signature Block -->
  <div class="signature-section">
    <div class="signature-title">Signatures</div>
    <div class="signature-grid">
      <div class="signature-block">
        <div class="signature-label">Service Provider</div>
        <div class="signature-party">Fonts &amp; Footers</div>
        <div class="signature-signed">Fonts &amp; Footers</div>
        <div class="signature-field-label">Authorized Signature — Fonts &amp; Footers</div>
        <br />
        <div class="signature-signed-date">${date}</div>
        <div class="signature-field-label">Date signed</div>
      </div>
      <div class="signature-block">
        <div class="signature-label">Client</div>
        <div class="signature-party">${businessName}</div>
        ${
          signedDate
            ? `
        <div class="signature-signed">${clientName}</div>
        <div class="signature-field-label">Electronically signed by ${clientName}</div>
        <br />
        <div class="signature-signed-date">${signedDate}</div>
        <div class="signature-field-label">Date signed</div>
        `
            : `
        <div class="signature-line"></div>
        <div class="signature-field-label">Authorized Signature — ${clientName}</div>
        <br />
        <div class="signature-line" style="margin-top: 20px;"></div>
        <div class="signature-field-label">Date</div>
        `
        }
      </div>
    </div>
  </div>

  <!-- Footer -->
  <div class="footer">
    Fonts &amp; Footers · Web Services Agreement · Generated ${date} · Confidential
  </div>

</body>
</html>`;
}
