import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "../../../../../../auth";
import { db } from "@/lib/db";
import { getProductAccess, getSubscription } from "@/lib/subscriptions";
import LeadsSettingsForm from "./LeadsSettingsForm";
import CancelSubscriptionButton from "./CancelSubscriptionButton";
import styles from "./LeadsSettingsPage.module.css";

export const dynamic = "force-dynamic";

export default async function LeadsSettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const profile = await db.clientProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!profile) redirect("/dashboard");

  const access = await getProductAccess(profile.id);
  const isAdmin = session.user.roles?.includes("ADMIN") ?? false;

  if (!access.hasLeads && !isAdmin) {
    redirect("/dashboard/enroll/leads");
  }

  const [settings, subscription] = await Promise.all([
    db.leadsSettings.findUnique({
      where: { clientProfileId: profile.id },
    }),
    getSubscription(profile.id, "LEADS"),
  ]);

  // Beta access = subscription exists but no Stripe ID (created via beta path)
  const isBeta = !!subscription && !subscription.stripeSubscriptionId;
  const statusLabel = subscription?.status ?? "INACTIVE";

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <p className={styles.eyebrow}>Fonts &amp; Footers — Leads</p>
        <h1 className={styles.heading}>Lead Settings</h1>
      </div>

      <div className={styles.body}>
        {/* Subscription status */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Subscription</h2>
          <div className={styles.statusCard}>
            <div className={styles.statusRow}>
              <div>
                <p className={styles.statusLabel}>Status</p>
                <p className={styles.statusValue}>{statusLabel}</p>
              </div>
              <div className={styles.badges}>
                {isBeta && <span className={styles.badge}>Beta Access</span>}
                {access.leadsInTrial && access.leadsTrialEndsAt && (
                  <span className={styles.badge}>
                    Trial ends {access.leadsTrialEndsAt.toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Edit settings */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Market &amp; Notifications</h2>
          <LeadsSettingsForm
            initial={{
              primaryCity: settings?.primaryCity ?? "",
              primaryState: settings?.primaryState ?? "",
              serviceRadiusMiles: settings?.serviceRadiusMiles ?? 50,
              phoneNumber: settings?.phoneNumber ?? "",
              smsEnabled: settings?.smsEnabled ?? true,
              emailEnabled: settings?.emailEnabled ?? true,
            }}
          />
        </section>

        {/* Cancel section — hidden for admin (no real sub to cancel) */}
        {access.hasLeads && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Cancel Subscription</h2>
            <div className={styles.dangerCard}>
              <p className={styles.dangerDesc}>
                Cancelling immediately removes your access to the leads tool.
                Your saved settings stick around in case you decide to re-enroll
                later.
              </p>
              <CancelSubscriptionButton />
            </div>
          </section>
        )}

        <div className={styles.footer}>
          <Link href='/dashboard/leads' className={styles.backLink}>
            ← Back to lead feed
          </Link>
        </div>
      </div>
    </div>
  );
}
