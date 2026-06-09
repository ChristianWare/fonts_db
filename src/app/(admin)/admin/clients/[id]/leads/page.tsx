import { getClientById } from "@/actions/admin/getClientById";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import styles from "../ClientDetailClient.module.css";

const LEADS_PRICE_CENTS = 12500;
const LEADS_TRIAL_DAYS = 7;

function formatCents(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

export default async function ClientLeadsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const client = await getClientById(id);
  if (!client) notFound();

  const leadsSettings = await db.leadsSettings.findUnique({
    where: { clientProfileId: id },
  });

  const sub =
    client.subscriptions.find((s) => s.productType === "LEADS") ?? null;
  const invoices = client.invoices.filter(
    (inv) => inv.productType === "LEADS",
  );

  const now = new Date();
  const inTrial = !!sub?.trialEndsAt && new Date(sub.trialEndsAt) > now;
  const isActive = sub?.status === "ACTIVE";
  const isPastDue = sub?.status === "PAST_DUE";
  const isCancelled = sub?.status === "CANCELLED";
  const isPaid = (sub?.planAmountCents ?? 0) > 0;

  const trialStart = sub?.trialEndsAt
    ? new Date(
        new Date(sub.trialEndsAt).getTime() - LEADS_TRIAL_DAYS * 86400000,
      )
    : null;
  const chargeDay =
    sub?.billingAnchorDate ??
    (sub?.trialEndsAt ? new Date(sub.trialEndsAt).getDate() : null);

  const statusText = !sub
    ? "Not Enrolled"
    : inTrial
      ? "Free Trial"
      : isActive
        ? "Active"
        : isPastDue
          ? "Past Due"
          : isCancelled
            ? "Cancelled"
            : sub.status === "PAUSED"
              ? "Paused"
              : sub.status;

 const priceText = !sub
   ? `${formatCents(LEADS_PRICE_CENTS)}/mo`
   : sub.planAmountCents === 0
     ? "Complimentary"
     : `${formatCents(sub.planAmountCents)}/mo`;

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <Link
            href={`/admin/clients/${client.id}`}
            className={styles.backBtn}
          >
            ← Products
          </Link>
          <div className={styles.clientMeta}>
            <div className={styles.clientAvatar}>
              {(client.user.name ?? "?")[0].toUpperCase()}
            </div>
            <div>
              <h1 className='h2'>{client.businessName}</h1>
              <p className={styles.clientEmail}>Leads Tool</p>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.tabContent}>
        {/* Subscription */}
        <div className={styles.card}>
          <h3 className={styles.cardHeading}>Subscription</h3>
          <div className={styles.infoGrid}>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Status</span>
              <span className={styles.infoValue}>
                {statusText}
                {sub?.cancelAtPeriodEnd ? " (cancelling)" : ""}
              </span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Plan</span>
              <span className={styles.infoValue}>{priceText}</span>
            </div>

            {!sub ? (
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Enrollment</span>
                <span className={styles.infoValue}>
                  Not enrolled in the leads tool
                </span>
              </div>
            ) : (
              <>
                {inTrial && sub.trialEndsAt && (
                  <>
                    {trialStart && (
                      <div className={styles.infoRow}>
                        <span className={styles.infoLabel}>Trial started</span>
                        <span className={styles.infoValue}>
                          {format(trialStart, "MMMM d, yyyy")}
                        </span>
                      </div>
                    )}
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Trial ends</span>
                      <span className={styles.infoValue}>
                        {format(new Date(sub.trialEndsAt), "MMMM d, yyyy")}
                      </span>
                    </div>
                    {isPaid && !sub.cancelAtPeriodEnd && (
                      <>
                        <div className={styles.infoRow}>
                          <span className={styles.infoLabel}>
                            First payment
                          </span>
                          <span className={styles.infoValue}>
                            {formatCents(sub.planAmountCents)} on{" "}
                            {format(new Date(sub.trialEndsAt), "MMMM d, yyyy")}
                          </span>
                        </div>
                        {chargeDay && (
                          <div className={styles.infoRow}>
                            <span className={styles.infoLabel}>Billing</span>
                            <span className={styles.infoValue}>
                              Monthly — day {chargeDay} of each month
                            </span>
                          </div>
                        )}
                      </>
                    )}
                  </>
                )}

                {sub.cancelAtPeriodEnd && (
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Access until</span>
                    <span className={styles.infoValue}>
                      {format(
                        new Date(
                          (inTrial ? sub.trialEndsAt : sub.currentPeriodEnd) ??
                            now,
                        ),
                        "MMMM d, yyyy",
                      )}
                    </span>
                  </div>
                )}

                {!sub.cancelAtPeriodEnd && !inTrial && sub.currentPeriodEnd && (
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>
                      {isActive ? "Next billing date" : "Period ended"}
                    </span>
                    <span className={styles.infoValue}>
                      {format(new Date(sub.currentPeriodEnd), "MMMM d, yyyy")}
                    </span>
                  </div>
                )}

                {sub.billingAnchorDate &&
                  !inTrial &&
                  !isCancelled &&
                  !sub.cancelAtPeriodEnd && (
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Billing day</span>
                      <span className={styles.infoValue}>
                        Day {sub.billingAnchorDate} of each month
                      </span>
                    </div>
                  )}

                {isCancelled && sub.cancelledAt && (
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Cancelled on</span>
                    <span className={styles.infoValue}>
                      {format(new Date(sub.cancelledAt), "MMMM d, yyyy")}
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Leads settings */}
        <div className={styles.card}>
          <h3 className={styles.cardHeading}>Market &amp; Notifications</h3>
          {!leadsSettings ? (
            <p className={styles.emptyText}>
              Client hasn&apos;t configured their leads settings yet.
            </p>
          ) : (
            <div className={styles.infoGrid}>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Primary city</span>
                <span className={styles.infoValue}>
                  {leadsSettings.primaryCity || "—"}
                </span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>State</span>
                <span className={styles.infoValue}>
                  {leadsSettings.primaryState || "—"}
                </span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Service radius</span>
                <span className={styles.infoValue}>
                  {leadsSettings.serviceRadiusMiles
                    ? `${leadsSettings.serviceRadiusMiles} miles`
                    : "—"}
                </span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Email alerts</span>
                <span className={styles.infoValue}>
                  {leadsSettings.emailEnabled ? "On" : "Off"}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Leads invoices */}
        <div className={styles.card}>
          <h3 className={styles.cardHeading}>
            Leads Invoices ({invoices.length})
          </h3>
          {invoices.length === 0 ? (
            <p className={styles.emptyText}>No leads invoices yet.</p>
          ) : (
            <div className={styles.invoiceList}>
              {invoices.map((invoice) => (
                <div key={invoice.id} className={styles.invoiceRow}>
                  <div className={styles.invoiceLeft}>
                    <span className={styles.invoiceNumber}>
                      {invoice.invoiceNumber}
                    </span>
                    <span className={styles.invoiceMeta}>
                      {invoice.description ??
                        (invoice.periodStart && invoice.periodEnd
                          ? `${format(new Date(invoice.periodStart), "MMM d")} – ${format(new Date(invoice.periodEnd), "MMM d, yyyy")}`
                          : "Subscription")}
                    </span>
                  </div>
                  <div className={styles.invoiceRight}>
                    <span className={styles.invoiceAmount}>
                      {formatCents(invoice.amountCents)}
                    </span>
                    <span
                      className={`${styles.invoiceStatus} ${
                        invoice.status === "PAID"
                          ? styles.invoiceStatusPaid
                          : invoice.status === "OPEN"
                            ? styles.invoiceStatusOpen
                            : styles.invoiceStatusOther
                      }`}
                    >
                      {invoice.status === "PAID"
                        ? "Paid"
                        : invoice.status === "OPEN"
                          ? "Due"
                          : invoice.status}
                    </span>
                    {invoice.pdfUrl && (
                      <a
                        href={invoice.pdfUrl}
                        target='_blank'
                        rel='noopener noreferrer'
                        className={styles.invoiceDownload}
                      >
                        ↓ PDF
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}