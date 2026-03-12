import { getAdminOverview } from "@/actions/admin/getAdminOverview";
import { redirect } from "next/navigation";
import Link from "next/link";
import styles from "./AdminPage.module.css";

const stageLabels: Record<string, string> = {
  REGISTERED: "Registered",
  AGREEMENT_PENDING: "Agreement Pending",
  AGREEMENT_SIGNED: "Agreement Signed",
  QUESTIONNAIRE_PENDING: "Questionnaire Pending",
  QUESTIONNAIRE_SUBMITTED: "Questionnaire Submitted",
  ASSETS_PENDING: "Assets Pending",
  ASSETS_UPLOADED: "Assets Uploaded",
  DESIGN_REVIEW: "Design Review",
  SITE_LIVE: "Live",
};

const stageDotColor: Record<string, string> = {
  REGISTERED: "#979797",
  AGREEMENT_PENDING: "#ca8a04",
  AGREEMENT_SIGNED: "#16a34a",
  QUESTIONNAIRE_PENDING: "#ca8a04",
  QUESTIONNAIRE_SUBMITTED: "#16a34a",
  ASSETS_PENDING: "#ca8a04",
  ASSETS_UPLOADED: "#16a34a",
  DESIGN_REVIEW: "#2563eb",
  SITE_LIVE: "#ffc809",
};

function formatCents(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(cents / 100);
}

export default async function AdminPage() {
  const data = await getAdminOverview();
  if (!data) redirect("/login");

  const { clients, mrr, activeCount, openTickets, pendingRequests } = data;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.heading}>Overview</h1>
        <p className={styles.subheading}>
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      {/* Stats */}
      <div className={styles.stats}>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Monthly Recurring Revenue</span>
          <span className={styles.statValue}>{formatCents(mrr)}</span>
          <span className={styles.statSub}>{activeCount} active clients</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Total Clients</span>
          <span className={styles.statValue}>{clients.length}</span>
          <span className={styles.statSub}>All time</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Open Support Tickets</span>
          <span
            className={`${styles.statValue} ${openTickets > 0 ? styles.statAlert : ""}`}
          >
            {openTickets}
          </span>
          <Link href='/admin/support' className={styles.statLink}>
            View all →
          </Link>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Pending Change Requests</span>
          <span
            className={`${styles.statValue} ${pendingRequests > 0 ? styles.statAlert : ""}`}
          >
            {pendingRequests}
          </span>
          <Link href='/admin/change-requests' className={styles.statLink}>
            View all →
          </Link>
        </div>
      </div>

      {/* Client pipeline */}
      <div className={styles.pipelineCard}>
        <div className={styles.pipelineHeader}>
          <h2 className={styles.pipelineHeading}>Client Pipeline</h2>
          <Link href='/admin/clients' className={styles.viewAllLink}>
            View all clients →
          </Link>
        </div>

        {clients.length === 0 ? (
          <div className={styles.emptyState}>
            <p className={styles.emptyText}>No clients yet.</p>
          </div>
        ) : (
          <div className={styles.clientList}>
            {clients.map((client) => (
              <Link
                key={client.id}
                href={`/admin/clients/${client.id}`}
                className={styles.clientRow}
              >
                <div className={styles.clientLeft}>
                  <div className={styles.clientAvatar}>
                    {(client.user.name ?? "?")[0].toUpperCase()}
                  </div>
                  <div className={styles.clientInfo}>
                    <span className={styles.clientName}>
                      {client.businessName}
                    </span>
                    <span className={styles.clientEmail}>
                      {client.user.email}
                    </span>
                  </div>
                </div>

                <div className={styles.clientRight}>
                  <div className={styles.clientStage}>
                    <div
                      className={styles.stageDot}
                      style={{
                        backgroundColor:
                          stageDotColor[client.onboardingStage] ?? "#979797",
                      }}
                    />
                    <span className={styles.stageLabel}>
                      {stageLabels[client.onboardingStage]}
                    </span>
                  </div>

                  {client.subscription?.status === "ACTIVE" && (
                    <span className={styles.mrrBadge}>
                      {formatCents(client.subscription.planAmountCents)}/mo
                    </span>
                  )}

                  <svg
                    width='16'
                    height='16'
                    viewBox='0 0 24 24'
                    fill='none'
                    stroke='currentColor'
                    strokeWidth='2'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                  >
                    <line x1='5' y1='12' x2='19' y2='12' />
                    <polyline points='12 5 19 12 12 19' />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
