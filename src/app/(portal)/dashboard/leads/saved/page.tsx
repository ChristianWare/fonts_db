import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "../../../../../../auth";
import { db } from "@/lib/db";
import { getProductAccess } from "@/lib/subscriptions";
import { computeLeadPriority } from "@/lib/leadPriority";
import { computeColdScore } from "@/lib/leads/coldScore";
import SavedLeadsHub from "./SavedLeadsHub";
import styles from "./SavedLeadsPage.module.css";

export const dynamic = "force-dynamic";

type EventSignalData = {
  eventbriteId?: string;
  eventName?: string;
  eventDate?: string;
  venueName?: string;
  venueAddress?: string;
  expectedAttendance?: number | null;
  ticketPriceMin?: string | null;
  ticketPriceMax?: string | null;
  organizerName?: string;
  category?: string;
};

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

  const [allLeads, settings] = await Promise.all([
    db.savedLead.findMany({
      where: {
        clientProfileId: profile.id,
        isDraft: false,
      },
      include: {
        _count: { select: { outreachScripts: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    db.leadsSettings.findUnique({
      where: { clientProfileId: profile.id },
    }),
  ]);

  const leads = allLeads.map((l) => {
    const priority = computeLeadPriority({
      category: l.category,
      rating: l.rating,
      reviewCount: l.reviewCount,
    });

    const signal = (l.signalData ?? null) as EventSignalData | null;

    // Lead score: stored on warm/hot (from event), computed on the fly for cold
    let aiScore: number | null = l.aiScore;
    if (aiScore === null && l.leadType === "COLD") {
      const breakdown = computeColdScore({
        rating: l.rating,
        reviewCount: l.reviewCount,
        phone: l.businessPhone,
        website: l.businessWebsite,
        address: l.businessAddress,
        name: l.businessName,
        businessLat: l.businessLat,
        businessLng: l.businessLng,
        primaryLat: settings?.primaryLat ?? null,
        primaryLng: settings?.primaryLng ?? null,
        serviceRadiusMiles: settings?.serviceRadiusMiles ?? null,
      });
      aiScore = breakdown.total;
    }

    return {
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
      priority: priority.priority,
      aiScore,
      createdAt: l.createdAt.toISOString(),
      hasScripts: l._count.outreachScripts > 0,
      hasBrief: !!l.strategicBrief,
      eventbriteId: signal?.eventbriteId ?? null,
      eventName: signal?.eventName ?? null,
      eventDate: signal?.eventDate ?? null,
      venueName: signal?.venueName ?? null,
      expectedAttendance: signal?.expectedAttendance ?? null,
      organizerName: signal?.organizerName ?? null,
    };
  });

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <p className={styles.eyebrow}>Fonts &amp; Footers — Leads</p>
        <h1 className={`${styles.heading} h2`}>Saved Leads</h1>
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
          <SavedLeadsHub leads={leads} />
        )}
      </div>
    </div>
  );
}
