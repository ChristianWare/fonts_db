import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "../../../../../../../auth";
import { db } from "@/lib/db";
import { getProductAccess } from "@/lib/subscriptions";
import {
  computeNextMove,
  countOutreachAttempts,
  daysSinceLastContact,
} from "@/lib/leadNextMove";
import { computeLeadPriority } from "@/lib/leadPriority";
import { getSeasonalGuidance } from "@/lib/leadSeasonality";
import { computeColdScore } from "@/lib/leads/coldScore";
import { generateColdScoreReasoning } from "@/lib/leads/coldScoreReasoning";
import PlacePageClient from "./PlacePageClient";
import styles from "./PlacePage.module.css";

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

async function fetchPlaceBasics(placeId: string) {
  const apiKey = process.env.GOOGLE_MAPS_SERVER_KEY;
  if (!apiKey) {
    console.error("[place page] GOOGLE_MAPS_SERVER_KEY not set");
    return null;
  }

  const url = `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`;
  const fieldMask = [
    "displayName",
    "formattedAddress",
    "location",
    "nationalPhoneNumber",
    "internationalPhoneNumber",
    "websiteUri",
    "rating",
    "userRatingCount",
    "priceLevel",
  ].join(",");

  try {
    const res = await fetch(url, {
      headers: {
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": fieldMask,
      },
    });
    if (!res.ok) {
      console.error(
        "[place page] Google Places fetch failed:",
        res.status,
        await res.text(),
      );
      return null;
    }
    const data = await res.json();
    return {
      name: data.displayName?.text ?? "Unknown business",
      address: data.formattedAddress ?? null,
      lat: data.location?.latitude ?? null,
      lng: data.location?.longitude ?? null,
      phone: data.nationalPhoneNumber ?? data.internationalPhoneNumber ?? null,
      website: data.websiteUri ?? null,
      rating: data.rating ?? null,
      reviewCount: data.userRatingCount ?? null,
      priceLevel: data.priceLevel ?? null,
    };
  } catch (err) {
    console.error("[place page] Place fetch threw:", err);
    return null;
  }
}

export default async function PlacePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ category?: string }>;
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

  const { id: placeId } = await params;
  const { category } = await searchParams;

  let lead = await db.savedLead.findFirst({
    where: {
      clientProfileId: profile.id,
      googlePlaceId: placeId,
    },
    include: {
      outreachScripts: { orderBy: { format: "asc" } },
      activities: { orderBy: { createdAt: "desc" }, take: 50 },
    },
  });

  if (!lead) {
    const basics = await fetchPlaceBasics(placeId);
    if (!basics) {
      notFound();
    }
    lead = await db.savedLead.create({
      data: {
        clientProfileId: profile.id,
        leadType: "COLD",
        source: "google_places",
        category: category ?? "uncategorized",
        businessName: basics.name,
        businessAddress: basics.address,
        businessLat: basics.lat,
        businessLng: basics.lng,
        businessPhone: basics.phone,
        businessWebsite: basics.website,
        googlePlaceId: placeId,
        rating: basics.rating,
        reviewCount: basics.reviewCount,
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

  const nextMove = computeNextMove(lead);
  const outreachAttempts = countOutreachAttempts(lead.activities);
  const lastContactDays = daysSinceLastContact(lead.activities);

  const priorityResult = computeLeadPriority({
    category: lead.category,
    rating: lead.rating,
    reviewCount: lead.reviewCount,
  });
  const seasonality = getSeasonalGuidance(lead.category);

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

  // Cold lead score — deterministic, recomputed every page load
  const scoreBreakdown = computeColdScore({
    rating: lead.rating,
    reviewCount: lead.reviewCount,
    phone: lead.businessPhone,
    website: lead.businessWebsite,
    address: lead.businessAddress,
    name: lead.businessName,
    businessLat: lead.businessLat,
    businessLng: lead.businessLng,
    primaryLat: settings?.primaryLat ?? null,
    primaryLng: settings?.primaryLng ?? null,
    serviceRadiusMiles: settings?.serviceRadiusMiles ?? null,
  });

  const aiScoreReasoning = generateColdScoreReasoning(scoreBreakdown);

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
    businessLat: lead.businessLat,
    businessLng: lead.businessLng,
    googlePlaceId: lead.googlePlaceId,
    rating: lead.rating,
    reviewCount: lead.reviewCount,
    status: lead.status,
    estimatedValue: lead.estimatedValue,
    notes: lead.notes,
    isDraft: lead.isDraft,
    strategicBrief: lead.strategicBrief,
    reviewIntelligence: lead.reviewIntelligence,
    aiScore: scoreBreakdown.total,
    aiScoreReasoning,
    decisionMaker,
    competitiveAnalysis: lead.competitiveAnalysis as
      | {
          analyzed: true;
          hasExistingPartner: boolean;
          partnerName: string | null;
          evidence: string | null;
          recommendation: string;
        }
      | { analyzed: false; reason: string }
      | null,
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
        }
      | { enabled: false; reason: string }
      | null,
    distanceMiles: distance,
    primaryMarket: settings?.primaryCity
      ? `${settings.primaryCity}, ${settings.primaryState}`
      : null,
    primaryLat: settings?.primaryLat ?? null,
    primaryLng: settings?.primaryLng ?? null,
    serviceRadiusMiles: settings?.serviceRadiusMiles ?? null,
    snoozeUntil: lead.snoozeUntil?.toISOString() ?? null,
    lastContactedAt: lead.lastContactedAt?.toISOString() ?? null,
    nextActionAt: lead.nextActionAt?.toISOString() ?? null,
    nextActionNote: lead.nextActionNote,
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
            lead.isDraft ? "/dashboard/leads/search" : "/dashboard/leads/saved"
          }
          className={styles.backLink}
        >
          ← Back to {lead.isDraft ? "search" : "saved leads"}
        </Link>
      </div>
      <PlacePageClient
        lead={serialized}
        nextMove={nextMove}
        outreachAttempts={outreachAttempts}
        lastContactDays={lastContactDays}
        priorityResult={priorityResult}
        seasonality={seasonality}
      />
    </div>
  );
}
