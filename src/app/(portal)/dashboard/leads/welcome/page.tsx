import { redirect } from "next/navigation";
import { auth } from "../../../../../../auth";
import { db } from "@/lib/db";
import { getProductAccess, effectiveHasLeads } from "@/lib/subscriptions";
import WelcomeClient from "./WelcomeClient";
import styles from "./WelcomePage.module.css";

export const dynamic = "force-dynamic";

export default async function LeadsWelcomePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const profile = await db.clientProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!profile) redirect("/dashboard");

  const access = await getProductAccess(profile.id);
  const isAdmin = session.user.roles?.includes("ADMIN") ?? false;
  if (!effectiveHasLeads(access, isAdmin)) {
    redirect("/dashboard/enroll/leads");
  }

  const settings = await db.leadsSettings.findUnique({
    where: { clientProfileId: profile.id },
    select: { primaryCity: true, primaryState: true },
  });

  // No market configured yet — kick to settings to do that first.
  if (!settings?.primaryCity || !settings?.primaryState) {
    redirect("/dashboard/leads/settings?welcome=1");
  }

  // Find the most recent scrape job for this market, plus the current event
  // count. The job tells us "is something running" — the count tells us
  // "is there data ready" when no job is running (re-enrollment with cached
  // events). Either can be null/zero; the client component renders the
  // right state for each combination.
  const [recentJob, eventCount] = await Promise.all([
    db.scrapeJob.findFirst({
      where: {
        clientProfileId: profile.id,
        marketCity: settings.primaryCity,
        marketState: settings.primaryState,
      },
      orderBy: { startedAt: "desc" },
      select: {
        id: true,
        status: true,
        stage: true,
        progressPct: true,
        eventCount: true,
      },
    }),
    db.eventbriteEvent.count({
      where: {
        marketCity: { equals: settings.primaryCity, mode: "insensitive" },
        marketState: { equals: settings.primaryState, mode: "insensitive" },
      },
    }),
  ]);

  return (
    <div className={styles.page}>
      <WelcomeClient
        jobId={recentJob?.id ?? null}
        initialStatus={recentJob?.status ?? "COMPLETE"}
        initialStage={recentJob?.stage ?? "Complete"}
        initialProgressPct={recentJob?.progressPct ?? 100}
        initialEventCount={recentJob?.eventCount ?? eventCount}
        marketCity={settings.primaryCity}
        marketState={settings.primaryState}
      />
    </div>
  );
}
