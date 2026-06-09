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
  DESIGN_SELECTION: "Design Selection",
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
  DESIGN_SELECTION: "#2563eb",
  DESIGN_REVIEW: "#2563eb",
  SITE_LIVE: "#ffc809",
};

const LIVE_STATUSES = ["ACTIVE", "PAST_DUE"];

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

  const { clients, openTickets, pendingRequests } = data;

  // ── Multi-product rollups (computed from subscription rows so leads
  // revenue counts and beta subs at $0 don't) ──
  const now = new Date();

  let mrr = 0;
  let websiteCount = 0;
  let leadsCount = 0;

for (const client of clients) {
  // Skip admin/test accounts — their comped leads sub and test website
  // enrollment shouldn't count toward real revenue or sub counts.
  const clientIsAdmin = client.user.roles?.includes("ADMIN") ?? false;
  if (clientIsAdmin) continue;

  for (const sub of client.subscriptions) {
    if (!LIVE_STATUSES.includes(sub.status)) continue;
    if (sub.productType === "WEBSITE") websiteCount++;
    if (sub.productType === "LEADS") leadsCount++;
    if (sub.status === "ACTIVE") mrr += sub.planAmountCents;
  }
}

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className={styles.page}>
      {/* ── Hero header ── */}
      <div className={styles.hero}>
        <div className={styles.dot1} />
        <div className={styles.dot2} />
        <div className={styles.dot3} />
        <div className={styles.dot4} />
        <div className={styles.heroLeft}>
          <span className={styles.eyebrow}>Admin Dashboard</span>
          <h1 className={styles.mrrDisplay}>{formatCents(mrr)}</h1>
          <span className={styles.mrrLabel}>Monthly Recurring Revenue</span>
        </div>
        <div className={styles.heroRight}>
          <span className={styles.dateLabel}>{today}</span>
          <div className={styles.heroStats}>
            <div className={styles.heroStat}>
              <span className={styles.heroStatValue}>{websiteCount}</span>
              <span className={styles.heroStatLabel}>Website subs</span>
            </div>
            <div className={styles.heroStat}>
              <span className={styles.heroStatValue}>{leadsCount}</span>
              <span className={styles.heroStatLabel}>Leads subs</span>
            </div>
            <div className={styles.heroStat}>
              <span
                className={`${styles.heroStatValue} ${openTickets > 0 ? styles.alertValue : ""}`}
              >
                {openTickets}
              </span>
              <span className={styles.heroStatLabel}>Open tickets</span>
            </div>
            <div className={styles.heroStat}>
              <span
                className={`${styles.heroStatValue} ${pendingRequests > 0 ? styles.alertValue : ""}`}
              >
                {pendingRequests}
              </span>
              <span className={styles.heroStatLabel}>Pending requests</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Quick links strip ── */}
      <div className={styles.quickLinks}>
        <Link href='/admin/clients' className={styles.quickLink}>
          <span className={styles.quickLinkLabel}>All Clients</span>
          <span className={styles.quickLinkArrow}>→</span>
        </Link>
        <Link href='/admin/support' className={styles.quickLink}>
          <span className={styles.quickLinkLabel}>
            Support Tickets
            {openTickets > 0 && (
              <span className={styles.badge}>{openTickets}</span>
            )}
          </span>
          <span className={styles.quickLinkArrow}>→</span>
        </Link>
        <Link href='/admin/change-requests' className={styles.quickLink}>
          <span className={styles.quickLinkLabel}>
            Change Requests
            {pendingRequests > 0 && (
              <span className={styles.badge}>{pendingRequests}</span>
            )}
          </span>
          <span className={styles.quickLinkArrow}>→</span>
        </Link>
      </div>

      {/* ── Pipeline ── */}
      <div className={styles.pipeline}>
        <div className={styles.pipelineHeader}>
          <div className={styles.dot1} />
          <div className={styles.dot2} />
          <span className={styles.pipelineEyebrow}>Client Pipeline</span>
          <span className={styles.pipelineCount}>
            {String(clients.length).padStart(2, "0")} total
          </span>
        </div>

        {clients.length === 0 ? (
          <div className={styles.emptyState}>
            <p className={styles.emptyText}>No clients yet.</p>
          </div>
        ) : (
          <div className={styles.clientList}>
            {clients.map((client, index) => {
              const websiteSub =
                client.subscriptions.find((s) => s.productType === "WEBSITE") ??
                null;
              const leadsSub =
                client.subscriptions.find((s) => s.productType === "LEADS") ??
                null;

              // In the website flow = has a sub OR admin advanced their stage
              const websiteEngaged =
                !!websiteSub || client.onboardingStage !== "REGISTERED";

              const leadsLive =
                !!leadsSub && LIVE_STATUSES.includes(leadsSub.status);
              const leadsInTrial =
                leadsLive &&
                !!leadsSub?.trialEndsAt &&
                new Date(leadsSub.trialEndsAt) > now;

              const clientMrr = client.subscriptions
                .filter((s) => s.status === "ACTIVE")
                .reduce((sum, s) => sum + s.planAmountCents, 0);

              return (
                <Link
                  key={client.id}
                  href={`/admin/clients/${client.id}`}
                  className={styles.clientRow}
                >
                  <div className={styles.clientIndex}>
                    {String(index + 1).padStart(2, "0")}
                  </div>

                  <div className={styles.clientInfo}>
                    <span className={styles.clientName}>
                      {client.businessName}
                    </span>
                    <span className={styles.clientEmail}>
                      {client.user.email}
                    </span>
                  </div>

                  <div className={styles.clientProducts}>
                    {/* Product tags */}
                    <div className={styles.productTags}>
                      {websiteEngaged && (
                        <span
                          className={`${styles.productTag} ${
                            websiteSub?.status === "ACTIVE"
                              ? styles.tagGreen
                              : websiteSub?.status === "PAST_DUE"
                                ? styles.tagOrange
                                : styles.tagMuted
                          }`}
                        >
                          Web
                        </span>
                      )}
                      {leadsLive && (
                        <span
                          className={`${styles.productTag} ${
                            leadsInTrial
                              ? styles.tagBlue
                              : leadsSub?.status === "PAST_DUE"
                                ? styles.tagOrange
                                : styles.tagGreen
                          }`}
                        >
                          {leadsInTrial ? "Leads · Trial" : "Leads"}
                        </span>
                      )}
                      {!websiteEngaged && !leadsLive && (
                        <span
                          className={`${styles.productTag} ${styles.tagMuted}`}
                        >
                          No products
                        </span>
                      )}
                    </div>

                    {/* Website onboarding stage — only meaningful for
                        clients in the website flow */}
                    {websiteEngaged && (
                      <div className={styles.clientStage}>
                        <div
                          className={styles.stageDot}
                          style={{
                            backgroundColor:
                              stageDotColor[client.onboardingStage] ??
                              "#979797",
                          }}
                        />
                        <span className={styles.stageLabel}>
                          {stageLabels[client.onboardingStage]}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className={styles.clientRight}>
                    {clientMrr > 0 ? (
                      <span className={styles.mrrBadge}>
                        {formatCents(clientMrr)}/mo
                      </span>
                    ) : (
                      <span className={styles.mrrBadgeEmpty}>—</span>
                    )}
                    <span className={styles.arrow}>→</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
