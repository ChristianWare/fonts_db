import { redirect } from "next/navigation";
import { auth } from "../../../../../../auth";
import { db } from "@/lib/db";
import { getProductAccess } from "@/lib/subscriptions";
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
  if (!access.hasLeads && !isAdmin) {
    redirect("/dashboard/enroll/leads");
  }

  const settings = await db.leadsSettings.findUnique({
    where: { clientProfileId: profile.id },
    select: { primaryCity: true, primaryState: true },
  });

  // If they reach this page without having set up a market, kick them
  // back to settings to do that first.
  if (!settings?.primaryCity || !settings?.primaryState) {
    redirect("/dashboard/leads/settings");
  }

  // Find the most recent scrape job for this market. Could be in flight
  // (PENDING / SCRAPING / ENRICHING) or already complete. We use whatever
  // we find as the starting state for the client polling loop.
  const recentJob = await db.scrapeJob.findFirst({
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
  });

  // No scrape job exists for this market — either they navigated here
  // manually with stale settings, or something fell through. Send them
  // to search, which will trigger its own scrape if needed.
  if (!recentJob) {
    redirect("/dashboard/leads/search");
  }

  return (
    <div className={styles.page}>
      <WelcomeClient
        jobId={recentJob.id}
        initialStatus={recentJob.status}
        initialStage={recentJob.stage ?? "Starting up"}
        initialProgressPct={recentJob.progressPct}
        initialEventCount={recentJob.eventCount}
        marketCity={settings.primaryCity}
        marketState={settings.primaryState}
      />
    </div>
  );
}
