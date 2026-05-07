import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "../../../../../../auth";
import { db } from "@/lib/db";
import { getProductAccess } from "@/lib/subscriptions";
import SavedLeadsHub from "./SavedLeadsHub";
import styles from "./SavedLeadsPage.module.css";

export const dynamic = "force-dynamic";

type LeadStatus =
  | "NEW"
  | "CONTACTED"
  | "NURTURING"
  | "SNOOZED"
  | "WON"
  | "DEAD";

function buildCounts(leads: { status: LeadStatus }[]) {
  return {
    all: leads.length,
    NEW: leads.filter((l) => l.status === "NEW").length,
    CONTACTED: leads.filter((l) => l.status === "CONTACTED").length,
    NURTURING: leads.filter((l) => l.status === "NURTURING").length,
    SNOOZED: leads.filter((l) => l.status === "SNOOZED").length,
    WON: leads.filter((l) => l.status === "WON").length,
    DEAD: leads.filter((l) => l.status === "DEAD").length,
  };
}

export default async function SavedLeadsPage() {
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

  const allLeads = await db.savedLead.findMany({
    where: {
      clientProfileId: profile.id,
      isDraft: false, // hide drafts
    },
    include: {
      _count: { select: { outreachScripts: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const leads = allLeads.map((l) => ({
    id: l.id,
    leadType: l.leadType,
    source: l.source,
    category: l.category,
    businessName: l.businessName,
    businessAddress: l.businessAddress,
    businessPhone: l.businessPhone,
    businessWebsite: l.businessWebsite,
    googlePlaceId: l.googlePlaceId,
    rating: l.rating,
    reviewCount: l.reviewCount,
    status: l.status,
    notes: l.notes,
    createdAt: l.createdAt.toISOString(),
    hasScripts: l._count.outreachScripts > 0,
    hasBrief: !!l.strategicBrief,
  }));

  const counts = buildCounts(leads);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <p className={styles.eyebrow}>Fonts &amp; Footers — Leads</p>
        <h1 className={styles.heading}>Saved Leads</h1>
      </div>

      <div className={styles.body}>
        {leads.length === 0 ? (
          <div className={styles.emptyState}>
            <p className={styles.emptyTitle}>No saved leads yet</p>
            <p className={styles.emptyDesc}>
              Head to search to find businesses in your market and save the ones
              you want to pursue.
            </p>
            <Link href='/dashboard/leads/search' className={styles.emptyCta}>
              Search for leads →
            </Link>
          </div>
        ) : (
          <SavedLeadsHub leads={leads} counts={counts} />
        )}
      </div>
    </div>
  );
}
