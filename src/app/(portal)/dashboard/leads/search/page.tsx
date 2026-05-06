import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "../../../../../../auth";
import { db } from "@/lib/db";
import { getProductAccess } from "@/lib/subscriptions";
import ColdLeadSearchForm from "./ColdLeadSearchForm";
import styles from "./SearchPage.module.css";

export const dynamic = "force-dynamic";

export default async function ColdLeadSearchPage() {
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

  const settings = await db.leadsSettings.findUnique({
    where: { clientProfileId: profile.id },
  });

  // Block search if onboarding never happened or geocoding failed.
  // Either way, send them to settings to fix it.
  const hasMarket =
    !!settings?.primaryLat && !!settings?.primaryLng && !!settings?.primaryCity;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <p className={styles.eyebrow}>Fonts &amp; Footers — Leads</p>
        <h1 className={styles.heading}>Cold Lead Search</h1>
      </div>

      {!hasMarket ? (
        <div className={styles.body}>
          <div className={styles.warningCard}>
            <p className={styles.warningTitle}>Set up your market first</p>
            <p className={styles.warningDesc}>
              We need your primary city and state (with valid coordinates) to
              search for leads in your area. Head to settings and save your
              market info — geocoding runs automatically.
            </p>
            <Link
              href='/dashboard/leads/settings'
              className={styles.warningCta}
            >
              Go to settings →
            </Link>
          </div>
        </div>
      ) : (
        <ColdLeadSearchForm
          defaultCity={settings.primaryCity ?? ""}
          defaultState={settings.primaryState ?? ""}
          defaultRadius={settings.serviceRadiusMiles ?? 50}
        />
      )}
    </div>
  );
}
