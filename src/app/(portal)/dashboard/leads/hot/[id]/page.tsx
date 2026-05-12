import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "../../../../../../../auth";
import { db } from "@/lib/db";
import { getProductAccess } from "@/lib/subscriptions";
import {
  countOutreachAttempts,
  daysSinceLastContact,
} from "@/lib/leadNextMove";
import { computeOutreachWindow } from "@/lib/warmLeadIntelligence";
import EventDetailClient from "../../warm/[id]/EventDetailClient";
import styles from "../../warm/[id]/EventDetailPage.module.css";

export const dynamic = "force-dynamic";

const EARTH_RADIUS_MILES = 3958.8;
const HOT_THRESHOLD_DAYS = 14;

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

export default async function HotLeadPage({
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

  const { id: eventbriteId } = await params;
  const eventUrl = `https://www.eventbrite.com/e/${eventbriteId}`;

  const event = await db.eventbriteEvent.findUnique({
    where: { eventbriteId },
  });
  if (!event) notFound();

  // === Validate hot window (chunk 7) ===
  const outreachWindow = computeOutreachWindow(
    event.eventDate.toISOString(),
    event.category,
    event.eventName,
  );
  const daysUntilEvent = outreachWindow.daysUntilEvent;

  // If event already passed, 404.
  if (daysUntilEvent < 0) notFound();

  // If event is outside the hot window, redirect to /warm/[id] —
  // this lead is technically still warm, not urgent. Avoids accidental
  // visits to the hot route inflating leadType=HOT in the DB for non-urgent events.
  if (daysUntilEvent > HOT_THRESHOLD_DAYS) {
    redirect(`/dashboard/leads/warm/${eventbriteId}`);
  }

  let lead = await db.savedLead.findFirst({
    where: {
      clientProfileId: profile.id,
      source: "eventbrite",
      sourceUrl: eventUrl,
    },
    include: {
      outreachScripts: { orderBy: { format: "asc" } },
      activities: { orderBy: { createdAt: "desc" }, take: 50 },
    },
  });

  if (!lead) {
    lead = await db.savedLead.create({
      data: {
        clientProfileId: profile.id,
        // === Stored as HOT (chunk 7) ===
        // Existing leads keep whatever leadType they were saved as
        // (findFirst above doesn't filter on leadType, so warm leads
        // saved earlier still load here when they enter the hot window).
        leadType: "HOT",
        source: "eventbrite",
        category: event.category ?? "Event",
        businessName: event.organizerName,
        businessAddress: event.venueAddress,
        businessLat: event.venueLat,
        businessLng: event.venueLng,
        sourceUrl: eventUrl,
        signalType: "CORPORATE_EVENT",
        signalData: {
          eventbriteId: event.eventbriteId,
          eventName: event.eventName,
          eventDate: event.eventDate.toISOString(),
          venueName: event.venueName,
          venueAddress: event.venueAddress,
          ticketPriceMin: event.ticketPriceMin?.toString() ?? null,
          ticketPriceMax: event.ticketPriceMax?.toString() ?? null,
          expectedAttendance: event.expectedAttendance,
          organizerName: event.organizerName,
          category: event.category,
          isCorporate: event.isCorporate,
          aiCategory: event.aiCategory,
          venuePhone: event.venuePhone,
          venueWebsite: event.venueWebsite,
          venueRating: event.venueRating,
          organizerWebsite: event.organizerWebsite,
          organizerDomain: event.organizerDomain,
        },
        aiScore: event.aiScore,
        status: "NEW",
        isFavorite: false,
        isDraft: true,
      },
      include: {
        outreachScripts: { orderBy: { format: "asc" } },
        activities: { orderBy: { createdAt: "desc" }, take: 50 },
      },
    });
  }

  const settings = await db.leadsSettings.findUnique({
    where: { clientProfileId: profile.id },
  });

  const outreachAttempts = countOutreachAttempts(lead.activities);
  const lastContactDays = daysSinceLastContact(lead.activities);

  let distance: number | null = null;
  if (
    settings?.primaryLat != null &&
    settings.primaryLng != null &&
    event.venueLat != null &&
    event.venueLng != null
  ) {
    distance = distanceMiles(
      settings.primaryLat,
      settings.primaryLng,
      event.venueLat,
      event.venueLng,
    );
  }

  let recurringEvents: Array<{
    eventbriteId: string;
    eventName: string;
    eventDateIso: string;
  }> = [];
  if (event.organizerName) {
    const others = await db.eventbriteEvent.findMany({
      where: {
        organizerName: event.organizerName,
        eventbriteId: { not: event.eventbriteId },
      },
      orderBy: { eventDate: "desc" },
      take: 5,
      select: { eventbriteId: true, eventName: true, eventDate: true },
    });
    recurringEvents = others.map((o) => ({
      eventbriteId: o.eventbriteId,
      eventName: o.eventName,
      eventDateIso: o.eventDate.toISOString(),
    }));
  }

  // Parse decision-maker JSON
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
    leadId: lead.id,
    leadType: "WARM" as const, // EventDetailClient expects WARM (shape is identical)
    isDraft: lead.isDraft,
    isHot: true, // ALWAYS true on /hot/[id]
    daysUntilEvent,
    status: lead.status,
    notes: lead.notes,
    snoozeUntil: lead.snoozeUntil?.toISOString() ?? null,
    nextActionAt: lead.nextActionAt?.toISOString() ?? null,
    nextActionNote: lead.nextActionNote,
    lastContactedAt: lead.lastContactedAt?.toISOString() ?? null,
    createdAt: lead.createdAt.toISOString(),
    activities: lead.activities.map((a) => ({
      id: a.id,
      activityType: a.activityType,
      description: a.description,
      createdAt: a.createdAt.toISOString(),
    })),
    strategicBrief: lead.strategicBrief,
    decisionMaker,
    apolloEnrichment: lead.apolloEnrichment as
      | {
          enabled: true;
          persons: Array<{
            name: string;
            title: string;
            email: string | null;
            linkedinUrl: string | null;
            emailStatus: "verified" | "guessed" | "unavailable";
          }>;
          lastEnrichedAt: string;
          matchedDomain?: string;
        }
      | { enabled: false; reason: string }
      | null,
    outreachScripts: lead.outreachScripts.map((s) => ({
      id: s.id,
      format: s.format,
      subject: s.subject,
      body: s.body,
      generatedAt: s.generatedAt.toISOString(),
    })),
    event: {
      eventbriteId: event.eventbriteId,
      eventName: event.eventName,
      eventDateIso: event.eventDate.toISOString(),
      description: event.description,
      imageUrl: event.imageUrl,
      tags: event.tags ?? [],
      venueName: event.venueName,
      venueAddress: event.venueAddress,
      venueLat: event.venueLat,
      venueLng: event.venueLng,
      ticketPriceMin: event.ticketPriceMin?.toString() ?? null,
      ticketPriceMax: event.ticketPriceMax?.toString() ?? null,
      expectedAttendance: event.expectedAttendance,
      organizerName: event.organizerName,
      organizerEmail: event.organizerEmail,
      organizerPhone: event.organizerPhone,
      category: event.category,
      aiScore: event.aiScore,
      url: event.eventbriteUrl ?? eventUrl,
      isCorporate: event.isCorporate,
      aiCategory: event.aiCategory,
      venuePhone: event.venuePhone,
      venueWebsite: event.venueWebsite,
      venueRating: event.venueRating,
      venueReviewCount: event.venueReviewCount,
      organizerWebsite: event.organizerWebsite,
      organizerDomain: event.organizerDomain,
    },
    distanceMiles: distance,
    primaryMarket: settings?.primaryCity
      ? `${settings.primaryCity}, ${settings.primaryState}`
      : null,
    primaryLat: settings?.primaryLat ?? null,
    primaryLng: settings?.primaryLng ?? null,
    serviceRadiusMiles: settings?.serviceRadiusMiles ?? null,
    outreachWindow,
    recurringEvents,
  };

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <Link
          href={
            lead.isDraft ? "/dashboard/leads/search" : "/dashboard/leads/saved"
          }
          className={styles.backLink}
        >
          ← Back to {lead.isDraft ? "search" : "saved leads"}
        </Link>
      </div>
      <EventDetailClient
        lead={serialized}
        outreachAttempts={outreachAttempts}
        lastContactDays={lastContactDays}
      />
    </div>
  );
}
