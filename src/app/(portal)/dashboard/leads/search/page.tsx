import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "../../../../../../auth";
import { db } from "@/lib/db";
import { getProductAccess } from "@/lib/subscriptions";
import LeadSearchForm from "@/components/dashboard/leads/search/LeadSearchForm";
import QuotaIndicator from "@/components/dashboard/leads/search/QuotaIndicator/QuotaIndicator";
import styles from "./SearchPage.module.css";
import Button from "@/components/shared/Button/Button";

export const dynamic = "force-dynamic";

export default async function LeadSearchPage() {
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

  const hasMarket =
    !!settings?.primaryLat && !!settings?.primaryLng && !!settings?.primaryCity;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <p className={styles.eyebrow}>Fonts &amp; Footers — Leads</p>
        {hasMarket ? (
          <div className={styles.introWithQuota}>
            <h1 className={`${styles.heading} h2`}>
              Find Leads in <br /> {settings!.primaryCity},{" "}
              {settings!.primaryState}
            </h1>
            <p className={styles.subhead}>
              Hot, warm, and cold leads in your market.{" "}
            </p>
            <Link
              href='/dashboard/leads/settings'
              className={styles.subheadLink}
            >
              Change market →
            </Link>
            {hasMarket && <QuotaIndicator />}
          </div>
        ) : (
          <>
            <h1 className={`${styles.heading} h2`}>Find Leads</h1>
            <p className={styles.subhead}>
              Set your market to start searching.
            </p>
          </>
        )}
      </div>

      {!hasMarket ? (
        <div className={styles.body}>
          <div className={styles.warningCard}>
            <div className={`${styles.warningTitle} sectionHeading`}>
              Set up your market first
            </div>
            <p className={styles.warningDesc}>
              We need your primary city and state (with valid coordinates) to
              search for leads in your area. Head to settings and save your
              market info — geocoding runs automatically.
            </p>

            <div className={styles.btnContainer}>
              <Button
                href='/dashboard/leads/settings'
                text='Go to settings'
                btnType='accent'
                arrow
              />
            </div>
          </div>
        </div>
      ) : (
        <LeadSearchForm />
      )}
    </div>
  );
}
