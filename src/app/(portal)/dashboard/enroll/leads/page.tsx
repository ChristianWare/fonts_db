import { redirect } from "next/navigation";
import { auth } from "../../../../../../auth";
import { db } from "@/lib/db";
import { getProductAccess } from "@/lib/subscriptions";
import EnrollLeadsButton from "./EnrollLeadsButton";
import styles from "./EnrollLeadsPage.module.css";

export const dynamic = "force-dynamic";

const PAYWALL_ENABLED = process.env.LEADS_PAYWALL_ENABLED === "true";

export default async function EnrollLeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ cancelled?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const profile = await db.clientProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });

  if (!profile) redirect("/dashboard");

  const access = await getProductAccess(profile.id);

  // Already subscribed — bounce them to the leads dashboard
  if (access.hasLeads) redirect("/dashboard/leads");

  const { cancelled } = await searchParams;

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <p className={styles.eyebrow}>
          Fonts &amp; Footers — Leads
          {!PAYWALL_ENABLED && <span className={styles.betaTag}> · Beta</span>}
        </p>
        <h1 className={styles.headline}>
          Stop chasing leads. <span>Start receiving them.</span>
        </h1>
        <p className={styles.subhead}>
          Hot, warm, and cold leads delivered to your dashboard every day — plus
          AI outreach scripts and a built-in pipeline.
          {PAYWALL_ENABLED
            ? " Try it free for 7 days."
            : " Free during private beta."}
        </p>

        {PAYWALL_ENABLED ? (
          <div className={styles.priceRow}>
            <span className={styles.price}>$125</span>
            <span className={styles.priceMeta}>/month after trial</span>
          </div>
        ) : (
          <div className={styles.priceRow}>
            <span className={styles.price}>Free</span>
            <span className={styles.priceMeta}>during beta · no card</span>
          </div>
        )}

        <ul className={styles.features}>
          <li>Hot leads from Facebook, Nextdoor, Eventbrite</li>
          <li>Warm leads — new hotels, corporate events, venue signals</li>
          <li>Cold lead search — any city, any category</li>
          <li>AI-generated email, call, and LinkedIn scripts</li>
          <li>Pipeline kanban with snooze, reminders, won/lost tracking</li>
          <li>SMS alerts on new hot leads in your market</li>
        </ul>

        {cancelled && (
          <p className={styles.notice}>
            Checkout was cancelled. No charge has been made.
          </p>
        )}

        <EnrollLeadsButton paywallEnabled={PAYWALL_ENABLED} />

        <p className={styles.fineprint}>
          {PAYWALL_ENABLED
            ? "7-day free trial. Cancel anytime before day 7 and you won't be charged. Card required to start."
            : "Free access during the private beta. We'll give you 30 days notice before any pricing changes apply."}
        </p>
      </div>
    </div>
  );
}
