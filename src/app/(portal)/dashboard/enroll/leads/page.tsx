import { redirect } from "next/navigation";
import { auth } from "../../../../../../auth";
import { db } from "@/lib/db";
import { getProductAccess } from "@/lib/subscriptions";
import EnrollLeadsButton from "./EnrollLeadsButton";
import styles from "./EnrollLeadsPage.module.css";
import Arrow from "@/components/shared/icons/Arrow/Arrow";
import LeadsEnrollCheckout from "@/components/client/LeadsEnrollCheckout/LeadsEnrollCheckout";

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

  // Already subscribed — send them to search (the main leads workspace),
  // never to the bare /dashboard/leads route.
  if (access.hasLeads) redirect("/dashboard/leads/search");

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
          Events happening in your market, the venues planning them, and the
          corporate accounts most worth your time — all AI-scored and enriched
          with verified contacts. Built for ground transportation operators.
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
          <li>
            <Arrow className={styles.arrow} />
            Hot leads — events happening in your market within 14 days. The
            organizer hasn&apos;t booked ground transportation yet.
          </li>
          <li>
            <Arrow className={styles.arrow} />
            Warm leads — galas, conferences, and weddings 15-90 days out. Time
            to build the relationship before logistics get locked in.
          </li>
          <li>
            <Arrow className={styles.arrow} />
            Cold leads — hotels, wedding venues, corporate offices, country
            clubs, and resort spas in your service area. The repeat-business
            accounts.
          </li>
          <li>
            <Arrow className={styles.arrow} />
            Every lead AI-scored 0-100 and enriched with verified organizer and
            venue contacts from Google Places.
          </li>
          <li>
            <Arrow className={styles.arrow} />
            Strategic briefs and outreach scripts generated for every lead you
            save — who to call, what to lead with, when to follow up.
          </li>
          <li>
            <Arrow className={styles.arrow} />
            Pipeline tracking — NEW → CONTACTED → NURTURING → WON, with notes,
            snooze, and a built-in spreadsheet view.
          </li>
          <li>
            <Arrow className={styles.arrow} />
            Set your service radius (5-75 miles) and your market. We only show
            leads you can actually serve.
          </li>
        </ul>

        {cancelled && (
          <p className={styles.notice}>
            Checkout was cancelled. No charge has been made.
          </p>
        )}

        {PAYWALL_ENABLED ? (
          <LeadsEnrollCheckout />
        ) : (
          <EnrollLeadsButton paywallEnabled={false} />
        )}

        <p className={styles.fineprint}>
          {PAYWALL_ENABLED
            ? "7-day free trial. Cancel anytime before day 7 and you won't be charged. Card required to start."
            : "Free access during the private beta. We'll give you 30 days notice before any pricing changes apply."}
        </p>
      </div>
    </div>
  );
}
