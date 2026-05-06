import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "../../../../../../auth";
import { db } from "@/lib/db";
import { getProductAccess } from "@/lib/subscriptions";
import LeadDetailClient from "./LeadDetailClient";
import styles from "./LeadDetailPage.module.css";

export const dynamic = "force-dynamic";

const EARTH_RADIUS_MILES = 3958.8;

function distanceMiles(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_MILES * c;
}

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
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
  if (!access.hasLeads && !isAdmin) {
    redirect("/dashboard/enroll/leads");
  }

  const { id } = await params;

  const [lead, settings] = await Promise.all([
    db.savedLead.findUnique({
      where: { id },
      include: {
        outreachScripts: { orderBy: { format: "asc" } },
        activities: { orderBy: { createdAt: "desc" }, take: 50 },
      },
    }),
    db.leadsSettings.findUnique({
      where: { clientProfileId: profile.id },
    }),
  ]);

  if (!lead || lead.clientProfileId !== profile.id) {
    notFound();
  }

  // Distance calculation
  let distance: number | null = null;
  if (
    settings?.primaryLat != null &&
    settings.primaryLng != null &&
    lead.businessLat != null &&
    lead.businessLng != null
  ) {
    distance = distanceMiles(
      settings.primaryLat,
      settings.primaryLng,
      lead.businessLat,
      lead.businessLng,
    );
  }

  // Parse decision-maker JSON if present
  let decisionMaker: {
    primary: { title: string; why: string };
    secondary: { title: string; why: string };
    linkedinSearch: string;
  } | null = null;
  if (lead.decisionMakerHypothesis) {
    try {
      decisionMaker = JSON.parse(lead.decisionMakerHypothesis);
    } catch {
      decisionMaker = null;
    }
  }

  const serialized = {
    id: lead.id,
    leadType: lead.leadType,
    source: lead.source,
    category: lead.category,
    businessName: lead.businessName,
    businessAddress: lead.businessAddress,
    businessPhone: lead.businessPhone,
    businessWebsite: lead.businessWebsite,
    rating: lead.rating,
    reviewCount: lead.reviewCount,
    status: lead.status,
    notes: lead.notes,
    isFavorite: lead.isFavorite,
    strategicBrief: lead.strategicBrief,
    reviewIntelligence: lead.reviewIntelligence,
    decisionMaker,
    distanceMiles: distance,
    primaryMarket: settings?.primaryCity
      ? `${settings.primaryCity}, ${settings.primaryState}`
      : null,
    serviceRadiusMiles: settings?.serviceRadiusMiles ?? null,
    snoozeUntil: lead.snoozeUntil?.toISOString() ?? null,
    lastContactedAt: lead.lastContactedAt?.toISOString() ?? null,
    createdAt: lead.createdAt.toISOString(),
    outreachScripts: lead.outreachScripts.map((s) => ({
      id: s.id,
      format: s.format,
      subject: s.subject,
      body: s.body,
      generatedAt: s.generatedAt.toISOString(),
    })),
    activities: lead.activities.map((a) => ({
      id: a.id,
      activityType: a.activityType,
      description: a.description,
      createdAt: a.createdAt.toISOString(),
    })),
  };

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <Link
          href={
            lead.isFavorite
              ? "/dashboard/leads/favorites"
              : "/dashboard/leads/saved"
          }
          className={styles.backLink}
        >
          ← Back to {lead.isFavorite ? "favorites" : "saved leads"}
        </Link>
      </div>
      <LeadDetailClient lead={serialized} />
    </div>
  );
}
