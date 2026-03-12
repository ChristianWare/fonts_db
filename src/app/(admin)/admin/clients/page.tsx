import { getAdminOverview } from "@/actions/admin/getAdminOverview";
import { redirect } from "next/navigation";
import Link from "next/link";
import styles from "./ClientsPage.module.css";

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

export default async function ClientsPage() {
  const data = await getAdminOverview();
  if (!data) redirect("/login");

  const { clients } = data;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.heading}>Clients</h1>
        <p className={styles.subheading}>{clients.length} total clients</p>
      </div>

      <div className={styles.clientList}>
        {clients.length === 0 ? (
          <div className={styles.emptyState}>
            <p className={styles.emptyText}>No clients yet.</p>
          </div>
        ) : (
          clients.map((client) => (
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
                <div className={styles.stageChip}>
                  <div
                    className={styles.stageDot}
                    style={{
                      backgroundColor:
                        stageDotColor[client.onboardingStage] ?? "#979797",
                    }}
                  />
                  <span>{stageLabels[client.onboardingStage]}</span>
                </div>
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
          ))
        )}
      </div>
    </div>
  );
}
