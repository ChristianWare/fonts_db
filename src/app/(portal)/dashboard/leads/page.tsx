import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "../../../../../auth";
import { db } from "@/lib/db";
import { getProductAccess } from "@/lib/subscriptions";
import OnboardingModal from "./OnboardingModal";
import styles from "./LeadsPage.module.css";

export const dynamic = "force-dynamic";

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ welcome?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const profile = await db.clientProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!profile) redirect("/dashboard");

  const access = await getProductAccess(profile.id);
  const isAdmin = session.user.roles?.includes("ADMIN") ?? false;

  // Gate: must have leads access (real or admin) to be on this page
  if (!access.hasLeads && !isAdmin) {
    redirect("/dashboard/enroll/leads");
  }

  // Read settings to determine onboarding state
  const settings = await db.leadsSettings.findUnique({
    where: { clientProfileId: profile.id },
  });

  const onboardingComplete = !!settings?.onboardingCompletedAt;
  const { welcome } = await searchParams;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <p className={styles.eyebrow}>Fonts &amp; Footers — Leads</p>
        <h1 className={styles.heading}>Lead Feed</h1>
      </div>

      {!onboardingComplete && <OnboardingModal welcomeFlow={!!welcome} />}

      {onboardingComplete && (
        <div className={styles.placeholder}>
          <p className={styles.placeholderTag}>You&apos;re all set.</p>
          <h2 className={styles.placeholderTitle}>
            Your tool is being prepared.
          </h2>
          <p className={styles.placeholderDesc}>
            We&apos;ve got you configured for{" "}
            <strong>
              {settings?.primaryCity}
              {settings?.primaryState ? `, ${settings.primaryState}` : ""}
            </strong>{" "}
            with a <strong>{settings?.serviceRadiusMiles}-mile radius</strong>.
            Lead feeds will start populating within 24 hours. We&apos;ll text you at{" "}
            <strong>{settings?.phoneNumber}</strong> the moment your first hot
            lead drops.
          </p>
          <div className={styles.placeholderActions}>
            <Link
              href='/dashboard/leads/settings'
              className={styles.placeholderCta}
            >
              Manage settings →
            </Link>
            <Link href='/dashboard' className={styles.placeholderCtaSecondary}>
              Back to dashboard
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
