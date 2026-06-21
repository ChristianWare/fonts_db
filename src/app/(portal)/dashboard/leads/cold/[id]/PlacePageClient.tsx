/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState, useEffect, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import previewStyles from "../../preview/[placeId]/PreviewPage.module.css";
import detailStyles from "../../[id]/LeadDetailPage.module.css";
import placeStyles from "./PlacePage.module.css";
import LeadSourceBar from "../../[id]/_components/LeadSourceBar";
import RecommendedMoveCard from "../../[id]/_components/RecommendedMoveCard";
import NotesActivityFeed from "../../[id]/_components/NotesActivityFeed";
import NextActionCard from "../../[id]/_components/NextActionCard";
import OutreachQuickLog from "../../[id]/_components/OutreachQuickLog";
import type { NextMoveSuggestion } from "@/lib/leadNextMove";
import PriorityBadge from "../../[id]/_components/PriorityBadge";
import type { LeadPriorityResult } from "@/lib/leadPriority";
import type { SeasonalGuidance } from "@/lib/leadSeasonality";
import Modal from "@/components/shared/Modal/Modal";
import Arrow from "@/components/shared/icons/Arrow/Arrow";
import MarkWonButton from "./MarkWonButton";

type LeadStatus =
  | "NEW"
  | "CONTACTED"
  | "NURTURING"
  | "SNOOZED"
  | "WON"
  | "DEAD";

type ScriptFormat = "EMAIL" | "CALL" | "LINKEDIN" | "SMS";

type SerializedScript = {
  id: string;
  format: ScriptFormat;
  subject: string | null;
  body: string;
  generatedAt: string;
};

type SerializedActivity = {
  id: string;
  activityType: string;
  description: string | null;
  createdAt: string;
};

type DecisionMaker = {
  primary: { title: string; why: string };
  secondary: { title: string; why: string };
  linkedinSearch: string;
};

type FailureCategory =
  | "BLOCKED"
  | "JS_RENDERED"
  | "NOT_HTML"
  | "NO_WEBSITE"
  | "BAD_URL"
  | "TRANSIENT"
  | "UNKNOWN";

type CompetitiveAnalysis =
  | {
      analyzed: true;
      hasExistingPartner: boolean;
      partnerName: string | null;
      evidence: string | null;
      recommendation: string;
    }
  | {
      analyzed: false;
      reason: string;
      category?: FailureCategory; // optional — old DB records won't have it
    };

type ApolloEnrichment =
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
  | { enabled: false; reason: string };

type SerializedLead = {
  id: string;
  leadType: string;
  source: string;
  category: string;
  businessName: string | null;
  businessAddress: string | null;
  businessPhone: string | null;
  businessWebsite: string | null;
  businessLat: number | null;
  businessLng: number | null;
  googlePlaceId: string | null;
  rating: number | null;
  reviewCount: number | null;
  status: LeadStatus;
  estimatedValue: number | null;
  notes: string | null;
  isDraft: boolean;
  strategicBrief: string | null;
  reviewIntelligence: string | null;
  aiScore: number | null;
  aiScoreReasoning: string | null;
  decisionMaker: DecisionMaker | null;
  competitiveAnalysis: CompetitiveAnalysis | null;
  apolloEnrichment: ApolloEnrichment | null;

  distanceMiles: number | null;
  primaryMarket: string | null;
  primaryLat: number | null;
  primaryLng: number | null;
  serviceRadiusMiles: number | null;
  snoozeUntil: string | null;
  lastContactedAt: string | null;
  nextActionAt: string | null;
  nextActionNote: string | null;
  createdAt: string;
  outreachScripts: SerializedScript[];
  activities: SerializedActivity[];
};

type Photo = { name: string; widthPx: number; heightPx: number };

type Review = {
  name: string;
  rating: number;
  text: string | null;
  relativeTime: string | null;
  publishTime: string | null;
  authorName: string | null;
  authorPhotoUri: string | null;
};

type ParkingOptions = {
  freeParkingLot?: boolean;
  paidParkingLot?: boolean;
  freeStreetParking?: boolean;
  paidStreetParking?: boolean;
  valetParking?: boolean;
  freeGarageParking?: boolean;
  paidGarageParking?: boolean;
};

type PlacePreview = {
  hours?: string[] | null;
  openNow?: boolean | null;
  priceLevel?: string | null;
  businessStatus?: string | null;
  editorialSummary?: string | null;
  generativeSummary?: string | null;
  photos?: Photo[] | null;
  parkingOptions?: ParkingOptions | null;
  reservable?: boolean | null;
  goodForGroups?: boolean | null;
  outdoorSeating?: boolean | null;
  liveMusic?: boolean | null;
  allowsDogs?: boolean | null;
  goodForChildren?: boolean | null;
  servesCocktails?: boolean | null;
  servesWine?: boolean | null;
  servesBeer?: boolean | null;
  takeout?: boolean | null;
  delivery?: boolean | null;
  dineIn?: boolean | null;
  reviews?: Review[] | null;
};

type Props = {
  lead: SerializedLead;
  nextMove: NextMoveSuggestion;
  outreachAttempts: number;
  lastContactDays: number | null;
  priorityResult: LeadPriorityResult;
  seasonality: SeasonalGuidance;
};

const STATUS_OPTIONS: LeadStatus[] = [
  "NEW",
  "CONTACTED",
  "NURTURING",
  "SNOOZED",
  "WON",
  "DEAD",
];

const FORMAT_LABELS: Record<ScriptFormat, string> = {
  EMAIL: "Email",
  CALL: "Cold call opener",
  LINKEDIN: "LinkedIn DM",
  SMS: "SMS",
};

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

function formatDriveTime(seconds: number): string {
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder > 0 ? `${hours}h ${remainder}m` : `${hours}h`;
}

function formatAddressLines(address: string): string[] {
  const parts = address
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (parts.length <= 2) return parts;

  // Standard US format: "street, city, state zip, country"
  // Index-from-end so suite numbers / multi-part street addresses still work:
  // "123 Main St, Suite 5, Mesa, AZ 85204, USA" → 5 parts, last 3 are city/state/country.
  const last = parts[parts.length - 1];
  const looksLikeCountry = /^(USA|US|United States)$/i.test(last);

  if (looksLikeCountry && parts.length >= 4) {
    const country = parts[parts.length - 1];
    const stateZip = parts[parts.length - 2];
    const city = parts[parts.length - 3];
    const street = parts.slice(0, -3).join(", ");
    return [street, `${city}, ${stateZip}`, country];
  }

  // No country detected — assume last two are city / state-zip
  const stateZip = parts[parts.length - 1];
  const city = parts[parts.length - 2];
  const street = parts.slice(0, -2).join(", ");
  return [street, `${city}, ${stateZip}`];
}

function buildAtmosphereChips(p: PlacePreview): string[] {
  const chips: string[] = [];
  if (p.reservable === true) chips.push("Reservable");
  if (p.goodForGroups === true) chips.push("Good for groups");
  if (p.liveMusic === true) chips.push("Live music");
  if (p.outdoorSeating === true) chips.push("Outdoor seating");
  if (p.goodForChildren === true) chips.push("Family friendly");
  if (p.allowsDogs === true) chips.push("Dog friendly");
  if (p.servesCocktails === true) chips.push("Cocktails");
  if (p.servesWine === true) chips.push("Wine");
  if (p.servesBeer === true) chips.push("Beer");
  if (p.dineIn === true) chips.push("Dine-in");
  if (p.takeout === true) chips.push("Takeout");
  if (p.delivery === true) chips.push("Delivery");
  return chips;
}

function buildParkingChips(o: ParkingOptions | null | undefined): string[] {
  if (!o) return [];
  const c: string[] = [];
  if (o.valetParking) c.push("Valet parking");
  if (o.freeParkingLot) c.push("Free lot");
  if (o.paidParkingLot) c.push("Paid lot");
  if (o.freeGarageParking) c.push("Free garage");
  if (o.paidGarageParking) c.push("Paid garage");
  if (o.freeStreetParking) c.push("Free street parking");
  if (o.paidStreetParking) c.push("Paid street parking");
  return c;
}

function StarRating({ rating }: { rating: number }) {
  const filled = Math.max(0, Math.min(5, Math.round(rating)));
  return (
    <span className={previewStyles.stars}>
      {"★".repeat(filled)}
      <span className={previewStyles.starsEmpty}>{"★".repeat(5 - filled)}</span>
    </span>
  );
}

// === Accordion section wrapper — matches the FAQ pattern ===
type AccordionSectionProps = {
  sectionKey: string;
  title: string;
  isOpen: boolean;
  onToggle: (key: string) => void;
  children: React.ReactNode;
};

function AccordionSection({
  sectionKey,
  title,
  isOpen,
  onToggle,
  children,
}: AccordionSectionProps) {
  return (
    <div className={placeStyles.accordionSection}>
      <div
        className={placeStyles.accordionHeader}
        onClick={() => onToggle(sectionKey)}
        role='button'
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onToggle(sectionKey);
          }
        }}
      >
        <h2 className={placeStyles.accordionTitle}>{title}</h2>
        <div className={placeStyles.accordionArrow}>
          <Arrow className={isOpen ? placeStyles.iconFlip : placeStyles.icon} />
        </div>
      </div>
      <div
        className={`${placeStyles.accordionBody} ${
          isOpen ? placeStyles.accordionBodyOpen : ""
        }`}
      >
        <div className={placeStyles.accordionBodyInner}>{children}</div>
      </div>
    </div>
  );
}

function getFailureActions(category: FailureCategory | undefined): {
  showRetry: boolean;
  showSiteLink: boolean;
  showGoogleSearch: boolean;
  headerText: string;
} {
  const cat = category ?? "UNKNOWN";

  switch (cat) {
    case "NO_WEBSITE":
      return {
        showRetry: false,
        showSiteLink: false,
        showGoogleSearch: true,
        headerText: "⚠ Manual lookup needed",
      };
    case "BLOCKED":
    case "JS_RENDERED":
    case "NOT_HTML":
      return {
        showRetry: false,
        showSiteLink: true,
        showGoogleSearch: false,
        headerText: "⚠ Manual check needed",
      };
    case "BAD_URL":
      return {
        showRetry: false,
        showSiteLink: true,
        showGoogleSearch: true,
        headerText: "⚠ Website URL may be stale",
      };
    case "TRANSIENT":
      return {
        showRetry: true,
        showSiteLink: true,
        showGoogleSearch: false,
        headerText: "⚠ Temporary issue",
      };
    case "UNKNOWN":
    default:
      return {
        showRetry: true,
        showSiteLink: true,
        showGoogleSearch: false,
        headerText: "⚠ Could not analyze",
      };
  }
}

function CompetitiveFailureCard({
  analysis,
  websiteUrl,
  businessName,
  onRetry,
}: {
  analysis: { analyzed: false; reason: string; category?: FailureCategory };
  websiteUrl: string | null;
  businessName: string | null;
  onRetry: () => void;
}) {
  const actions = getFailureActions(analysis.category);

  return (
    <div
      className={`${placeStyles.competitiveCard} ${placeStyles.competitiveCardError}`}
    >
      <span className={placeStyles.competitiveStatus}>
        {actions.headerText}
      </span>
      <p className={placeStyles.competitiveError}>{analysis.reason}</p>
      <div className={placeStyles.competitiveActions}>
        {actions.showSiteLink && websiteUrl && (
          <a
            href={websiteUrl}
            target='_blank'
            rel='noopener noreferrer'
            className={detailStyles.generateBtn}
          >
            Open live site ↗
          </a>
        )}
        {actions.showGoogleSearch && businessName && (
          <a
            href={`https://www.google.com/search?q=${encodeURIComponent(businessName)}`}
            target='_blank'
            rel='noopener noreferrer'
            className={detailStyles.generateBtn}
          >
            Search Google ↗
          </a>
        )}
        {actions.showRetry && (
          <button
            type='button'
            onClick={onRetry}
            className={detailStyles.regenerateBtn}
          >
            Try again
          </button>
        )}
      </div>
    </div>
  );
}

export default function PlacePageClient({
  lead: initialLead,
  nextMove,
  outreachAttempts,
  lastContactDays,
  priorityResult,
  seasonality,
}: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [lead, setLead] = useState(initialLead);

  // Re-sync from props after router.refresh() returns new server data
  useEffect(() => {
    setLead(initialLead);
  }, [initialLead]);

  // Google Places preview (photos, hours, reviews — fetched client-side)
  const [preview, setPreview] = useState<PlacePreview | null>(null);
  const [mapFailed, setMapFailed] = useState(false);
  const [driveTime, setDriveTime] = useState<{
    seconds: number;
    staticSeconds: number | null;
  } | null>(null);

  // AI generation flags
  const [generatingBrief, setGeneratingBrief] = useState(!lead.strategicBrief);
  const [generatingReviews, setGeneratingReviews] = useState(
    !lead.reviewIntelligence,
  );
  const [generatingDM, setGeneratingDM] = useState(!lead.decisionMaker);
  const [generatingScripts, setGeneratingScripts] = useState(false);
  const [generatingCompetitive, setGeneratingCompetitive] = useState(
    !lead.competitiveAnalysis,
  );
  const [generatingApollo, setGeneratingApollo] = useState(
    !lead.apolloEnrichment || lead.apolloEnrichment.enabled === false,
  );

  const [statusUpdating, setStatusUpdating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [snoozeDate, setSnoozeDate] = useState(
    lead.snoozeUntil?.split("T")[0] ?? "",
  );
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Accordion state — only one section open at a time, all closed by default
  const [openSection, setOpenSection] = useState<string | null>(null);

  function toggleSection(key: string) {
    setOpenSection((prev) => (prev === key ? null : key));
  }

  const aiKickedOff = useRef(false);

  useEffect(() => {
    if (!lead.googlePlaceId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `/api/leads/place-details/${encodeURIComponent(lead.googlePlaceId!)}`,
        );
        if (!res.ok) return;
        const data = (await res.json()) as PlacePreview;
        if (!cancelled) setPreview(data);
      } catch (err) {
        console.warn("[place page] preview fetch failed", err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [lead.googlePlaceId]);

  useEffect(() => {
    if (
      lead.primaryLat == null ||
      lead.primaryLng == null ||
      lead.businessLat == null ||
      lead.businessLng == null
    ) {
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `/api/leads/drive-time?fromLat=${lead.primaryLat}&fromLng=${lead.primaryLng}&toLat=${lead.businessLat}&toLng=${lead.businessLng}`,
        );
        if (!res.ok) return;
        const body = await res.json();
        if (!cancelled && body.driveTimeSeconds) {
          setDriveTime({
            seconds: body.driveTimeSeconds,
            staticSeconds: body.driveTimeStaticSeconds ?? null,
          });
        }
      } catch (err) {
        console.warn("[place page] drive-time failed", err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [lead.primaryLat, lead.primaryLng, lead.businessLat, lead.businessLng]);

  useEffect(() => {
    if (aiKickedOff.current) return;
    aiKickedOff.current = true;

    if (!lead.strategicBrief) generateAi("strategic-brief", "brief");
    if (!lead.reviewIntelligence) generateAi("review-intelligence", "reviews");
    if (!lead.decisionMaker) generateAi("decision-maker", "dm");
    if (!lead.competitiveAnalysis)
      generateAi("competitive-check", "competitive");
    if (!lead.isDraft && lead.outreachScripts.length === 0) {
      generateAi("generate-scripts", "scripts");
    }
    if (!lead.apolloEnrichment || lead.apolloEnrichment.enabled === false) {
      generateAi("apollo-enrich", "apollo");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (lead.strategicBrief) setGeneratingBrief(false);
  }, [lead.strategicBrief]);

  useEffect(() => {
    if (lead.reviewIntelligence) setGeneratingReviews(false);
  }, [lead.reviewIntelligence]);

  useEffect(() => {
    if (lead.decisionMaker) setGeneratingDM(false);
  }, [lead.decisionMaker]);

  useEffect(() => {
    if (lead.outreachScripts.length > 0) setGeneratingScripts(false);
  }, [lead.outreachScripts.length]);

  useEffect(() => {
    if (lead.competitiveAnalysis) setGeneratingCompetitive(false);
  }, [lead.competitiveAnalysis]);

  async function generateAi(
    endpoint: string,
    field: "brief" | "reviews" | "dm" | "scripts" | "competitive" | "apollo",
    force = false,
  ) {
    const setLoading = {
      brief: setGeneratingBrief,
      reviews: setGeneratingReviews,
      dm: setGeneratingDM,
      scripts: setGeneratingScripts,
      competitive: setGeneratingCompetitive,
      apollo: setGeneratingApollo,
    }[field];
    setLoading(true);
    try {
      const res = await fetch(
        `/api/leads/${lead.id}/${endpoint}${force ? "?force=true" : ""}`,
        { method: "POST" },
      );
      if (!res.ok) {
        console.error(`${endpoint} failed`, await res.text());
        setLoading(false);
        return;
      }
      startTransition(() => router.refresh());
    } catch (err) {
      setLoading(false);
      console.error(`${endpoint} threw`, err);
    }
  }

  useEffect(() => {
    if (lead.apolloEnrichment) setGeneratingApollo(false);
  }, [lead.apolloEnrichment]);

  async function patchLead(patch: Record<string, unknown>) {
    const res = await fetch(`/api/leads/${lead.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (!res.ok) {
      console.error("Update failed", await res.text());
      return false;
    }
    startTransition(() => router.refresh());
    return true;
  }

  async function saveLead() {
    if (!lead.isDraft) return;
    setSaving(true);
    try {
      const ok = await patchLead({ isDraft: false });
      if (ok) {
        setLead((prev) => ({ ...prev, isDraft: false }));
        generateAi("generate-scripts", "scripts", true);
        generateAi("apollo-enrich", "apollo");
      }
    } finally {
      setSaving(false);
    }
  }

  async function updateStatus(newStatus: LeadStatus) {
    setStatusUpdating(true);
    try {
      await patchLead({ status: newStatus });
    } finally {
      setStatusUpdating(false);
    }
  }

  async function markContacted() {
    if (lead.status === "CONTACTED") return;
    setStatusUpdating(true);
    try {
      await patchLead({ status: "CONTACTED" });
    } finally {
      setStatusUpdating(false);
    }
  }

  async function snoozeLead() {
    if (!snoozeDate) return;
    setStatusUpdating(true);
    try {
      await patchLead({
        status: "SNOOZED",
        snoozeUntil: new Date(snoozeDate).toISOString(),
      });
    } finally {
      setStatusUpdating(false);
    }
  }

  function requestDelete() {
    setShowDeleteModal(true);
  }

  async function confirmDelete() {
    setShowDeleteModal(false);
    setSaving(true);
    try {
      const res = await fetch(`/api/leads/${lead.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        console.error("Delete failed", await res.text());
        window.alert("Failed to delete. Try again.");
        return;
      }
      router.push("/dashboard/leads/saved");
    } finally {
      setSaving(false);
    }
  }

  async function copyToClipboard(text: string, scriptId: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(scriptId);
      setTimeout(() => setCopiedId(null), 1500);
    } catch (err) {
      console.error("Copy failed", err);
    }
  }

  function openLightbox(idx: number) {
    setLightboxIndex(idx);
    setLightboxOpen(true);
  }

  function closeLightbox() {
    setLightboxOpen(false);
  }

  function prevPhoto() {
    setLightboxIndex((prev) =>
      prev === 0 ? displayedPhotos.length - 1 : prev - 1,
    );
  }

  function nextPhoto() {
    setLightboxIndex((prev) => (prev + 1) % displayedPhotos.length);
  }

  const todayName = DAY_NAMES[new Date().getDay()];
  const todayHoursIndex =
    preview?.hours?.findIndex((h) => h.startsWith(todayName)) ?? -1;
  const atmosphereChips = preview ? buildAtmosphereChips(preview) : [];
  const parkingChips = buildParkingChips(preview?.parkingOptions);
  const allChips = [...atmosphereChips, ...parkingChips];
  const sortedReviews = preview?.reviews
    ? [...preview.reviews].sort((a, b) =>
        (b.publishTime ?? "").localeCompare(a.publishTime ?? ""),
      )
    : null;
  const mapsUrl = lead.googlePlaceId
    ? `https://www.google.com/maps/place/?q=place_id:${encodeURIComponent(lead.googlePlaceId)}`
    : null;

  const emailScript = lead.outreachScripts.find((s) => s.format === "EMAIL");
  const mailtoUrl = emailScript
    ? `mailto:?subject=${encodeURIComponent(emailScript.subject ?? "")}&body=${encodeURIComponent(emailScript.body)}`
    : null;

  const displayedPhotos = preview?.photos?.slice(0, 6) ?? [];

  useEffect(() => {
    if (!lightboxOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox();
      else if (e.key === "ArrowLeft") prevPhoto();
      else if (e.key === "ArrowRight") nextPhoto();
    };
    window.addEventListener("keydown", handleKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handleKey);
      document.body.style.overflow = prevOverflow;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lightboxOpen, displayedPhotos.length]);

  return (
    <div className={detailStyles.layout}>
      <div className={detailStyles.body}>
        <LeadSourceBar
          leadType={lead.leadType as "HOT" | "WARM" | "COLD"}
          category={lead.category}
          source={lead.source}
          createdAt={lead.createdAt}
          outreachAttempts={outreachAttempts}
          daysSinceLastContact={lastContactDays}
        />
        <h1 className={previewStyles.heroName}>
          {lead.businessName ?? "Unnamed"}
        </h1>

        <div className={placeStyles.priorityRow}>
          <PriorityBadge priority={priorityResult.priority} />
          <span className={placeStyles.priorityReasoning}>
            {priorityResult.reasoning}
          </span>
          {priorityResult.estimatedAnnualVolume && (
            <span className={placeStyles.priorityVolume}>
              ≈ {priorityResult.estimatedAnnualVolume}
            </span>
          )}
          {!lead.isDraft && (
            <p className={previewStyles.eyebrow}>
              <span
                className={`${detailStyles.statusBadge} ${detailStyles[`status_${lead.status}`]}`}
              >
                {lead.status}
              </span>
            </p>
          )}
          {lead.isDraft && (
            <p className={previewStyles.eyebrow}>Preview · not yet saved</p>
          )}
          {lead.aiScore != null && (
            <div className={placeStyles.scoreReasoningCard}>
              <div className={placeStyles.scoreReasoningHeader}>
                <div className={placeStyles.scoreReasoningHeaderLeft}>
                  <p className={placeStyles.scoreReasoningLabel}>Lead score</p>
                  <p className={placeStyles.scoreReasoningScore}>
                    {lead.aiScore}
                    <span className={placeStyles.scoreReasoningOutOf}>
                      /100
                    </span>
                  </p>
                </div>
              </div>
              {lead.aiScoreReasoning && (
                <p className={placeStyles.scoreReasoningBody}>
                  {lead.aiScoreReasoning}
                </p>
              )}
            </div>
          )}
        </div>

        <div className={previewStyles.heroDetails}>
          {lead.rating !== null && (
            <span className={previewStyles.heroRating}>
              ★ {lead.rating.toFixed(1)} ({lead.reviewCount ?? 0} reviews)
            </span>
          )}
          {preview?.openNow === true && (
            <span className={previewStyles.openBadge}>● Open now</span>
          )}
          {preview?.openNow === false && (
            <span className={previewStyles.closedBadge}>● Closed</span>
          )}
        </div>
        {lead.businessAddress && (
          <p className={previewStyles.heroAddress}>
            {formatAddressLines(lead.businessAddress).map((line, i, arr) => (
              <span key={i}>
                {line}
                {i < arr.length - 1 && <br />}
              </span>
            ))}
          </p>
        )}

        {lead.distanceMiles !== null &&
          lead.primaryMarket &&
          lead.businessLat &&
          lead.businessLng && (
            <section
              className={`${previewStyles.locationCard} ${mapFailed ? previewStyles.locationCardNoMap : ""}`}
            >
              {!mapFailed && (
                <div className={previewStyles.locationMap}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/api/leads/static-map?lat=${lead.businessLat}&lng=${lead.businessLng}&zoom=14&width=600&height=300`}
                    alt={`Map of ${lead.businessName}`}
                    className={previewStyles.mapImage}
                    onError={() => setMapFailed(true)}
                  />
                </div>
              )}
              <div className={previewStyles.locationStats}>
                <div className={previewStyles.locationStatRow}>
                  <div className={previewStyles.locationStat}>
                    <p className={previewStyles.locationStatValue}>
                      {lead.distanceMiles.toFixed(1)} mi
                    </p>
                    <p className={previewStyles.locationStatLabel}>distance</p>
                  </div>
                  {driveTime && (
                    <div className={previewStyles.locationStat}>
                      <p className={previewStyles.locationStatValue}>
                        {formatDriveTime(driveTime.seconds)}
                      </p>
                      <p className={previewStyles.locationStatLabel}>
                        drive time
                      </p>
                    </div>
                  )}
                </div>
                <p className={previewStyles.locationDesc}>
                  from your base in {lead.primaryMarket}
                  {lead.serviceRadiusMiles &&
                  lead.distanceMiles > lead.serviceRadiusMiles
                    ? ` — outside your ${lead.serviceRadiusMiles}-mile service radius`
                    : lead.serviceRadiusMiles
                      ? ` — within your ${lead.serviceRadiusMiles}-mile service radius`
                      : ""}
                </p>
              </div>
            </section>
          )}

        {/* HERO — photos, hours, links, location only. Everything below is accordionized. */}
        <section className={previewStyles.hero}>
          {displayedPhotos.length > 0 && (
            <section className={previewStyles.photosSection}>
              <div className={previewStyles.photosRow}>
                {displayedPhotos.map((photo, i) => (
                  <div
                    key={photo.name}
                    className={previewStyles.photoWrap}
                    onClick={() => openLightbox(i)}
                    role='button'
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        openLightbox(i);
                      }
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`/api/leads/place-photo?name=${encodeURIComponent(photo.name)}&maxWidth=600`}
                      alt={`${lead.businessName ?? "Place"} photo ${i + 1}`}
                      loading='lazy'
                      className={previewStyles.photoThumb}
                    />
                  </div>
                ))}
              </div>
            </section>
          )}
          <br />
          {preview?.hours && preview.hours.length > 0 && (
            <section className={detailStyles.section}>
              <h2 className={detailStyles.sectionTitle}>Hours</h2>
              <ul className={previewStyles.hoursList}>
                {preview.hours.map((h, i) => (
                  <li
                    key={i}
                    className={
                      i === todayHoursIndex
                        ? previewStyles.hoursItemToday
                        : previewStyles.hoursItem
                    }
                  >
                    {h}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <div className={previewStyles.heroLinks}>
            {lead.businessPhone && (
              <a
                href={`tel:${lead.businessPhone}`}
                className={previewStyles.heroLink}
              >
                {lead.businessPhone}
              </a>
            )}
            {lead.businessWebsite && (
              <a
                href={lead.businessWebsite}
                target='_blank'
                rel='noopener noreferrer'
                className={previewStyles.heroLink}
              >
                Live Site ↗
                {/* {lead.businessWebsite.replace(/^https?:\/\//, "")} ↗ */}
              </a>
            )}
            {mapsUrl && (
              <a
                href={mapsUrl}
                target='_blank'
                rel='noopener noreferrer'
                className={previewStyles.heroLink}
              >
                Open in Google Maps ↗
              </a>
            )}
          </div>
          {/* ABOUT */}
          <br />
          {(preview?.editorialSummary || preview?.generativeSummary) && (
            <>
              <h2 className={detailStyles.sectionTitle}>About</h2>
              <p className={previewStyles.editorialBody}>
                {preview.generativeSummary ?? preview.editorialSummary}
              </p>
            </>
          )}
          <br />

          <div className={previewStyles.competetiveLandscapeSection}>
            <h2 className={detailStyles.sectionTitle}>Competitive Landscape</h2>
            <br />
            {lead.competitiveAnalysis &&
              lead.competitiveAnalysis.analyzed === true &&
              !generatingCompetitive && (
                <div
                  className={placeStyles.accordionBodyActions}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                    gap: "2rem",
                  }}
                >
                  <button
                    type='button'
                    onClick={() =>
                      generateAi("competitive-check", "competitive", true)
                    }
                    className={detailStyles.regenerateBtn}
                    style={{ marginTop: "2rem" }}
                  >
                    Regenerate
                  </button>
                </div>
              )}

            {generatingCompetitive ? (
              <div className={detailStyles.emptyBlock}>
                <p className={detailStyles.emptyDesc}>
                  ✨ Scanning website for existing transportation partners…
                </p>
              </div>
            ) : !lead.competitiveAnalysis ? (
              /* ...rest unchanged... */
              <div className={detailStyles.emptyBlock}>
                <p className={detailStyles.emptyDesc}>
                  Competitive analysis failed. Try again.
                </p>
                <button
                  type='button'
                  onClick={() =>
                    generateAi("competitive-check", "competitive", true)
                  }
                  className={detailStyles.generateBtn}
                >
                  Retry
                </button>
              </div>
            ) : lead.competitiveAnalysis.analyzed === false ? (
              <CompetitiveFailureCard
                analysis={lead.competitiveAnalysis}
                websiteUrl={lead.businessWebsite}
                businessName={lead.businessName}
                onRetry={() =>
                  generateAi("competitive-check", "competitive", true)
                }
              />
            ) : lead.competitiveAnalysis.hasExistingPartner ? (
              <div
                className={`${placeStyles.competitiveCard} ${placeStyles.competitiveCardWarn}`}
              >
                <span className={placeStyles.competitiveStatus}>
                  ⚠ Existing partner detected
                </span>
                {lead.competitiveAnalysis.partnerName && (
                  <p className={placeStyles.competitivePartner}>
                    {lead.competitiveAnalysis.partnerName}
                  </p>
                )}
                {lead.competitiveAnalysis.evidence && (
                  <p className={placeStyles.competitiveEvidence}>
                    &ldquo;{lead.competitiveAnalysis.evidence}&rdquo;
                  </p>
                )}
                <p className={placeStyles.competitiveRec}>
                  {lead.competitiveAnalysis.recommendation}
                </p>
              </div>
            ) : (
              <div
                className={`${placeStyles.competitiveCard} ${placeStyles.competitiveCardClear}`}
              >
                <span className={placeStyles.competitiveStatus}>
                  ✓ No existing partnership detected
                </span>
                <p className={placeStyles.competitiveRec}>
                  {lead.competitiveAnalysis.recommendation}
                </p>
              </div>
            )}
          </div>
          <br />
          <br />
          <div className={previewStyles.competetiveLandscapeSection}>
            <h2 className={detailStyles.sectionTitle}>Strategic Brief</h2>
            {/* {lead.reviewIntelligence && !generatingReviews && (
              <div
                className={placeStyles.accordionBodyActions}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  gap: "2rem",
                }}
              >
                <button
                  type='button'
                  onClick={() =>
                    generateAi("review-intelligence", "reviews", true)
                  }
                  className={detailStyles.regenerateBtn}
                  style={{ marginTop: "2rem" }}
                >
                  Regenerate
                </button>
              </div>
            )}

            {generatingReviews ? (
              <div className={detailStyles.emptyBlock}>
                <p className={detailStyles.emptyDesc}>✨ Analyzing reviews…</p>
              </div>
            ) : lead.reviewIntelligence ? (
              <div className={detailStyles.reviewBody}>
                {lead.reviewIntelligence.split("\n\n").map((para, i) => (
                  <p key={i} className={detailStyles.briefParagraph}>
                    {para}
                  </p>
                ))}
              </div>
            ) : (
              <div className={detailStyles.emptyBlock}>
                <p className={detailStyles.emptyDesc}>
                  Review analysis failed. Try again.
                </p>
                <button
                  type='button'
                  onClick={() =>
                    generateAi("review-intelligence", "reviews", true)
                  }
                  className={detailStyles.generateBtn}
                >
                  Retry
                </button>
              </div>
            )} */}
            {lead.strategicBrief && !generatingBrief && (
              <div
                className={placeStyles.accordionBodyActions}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  gap: "2rem",
                }}
              >
                <button
                  type='button'
                  onClick={() => generateAi("strategic-brief", "brief", true)}
                  disabled={generatingBrief}
                  className={detailStyles.regenerateBtn}
                  style={{
                    marginTop: "2rem",
                  }}
                >
                  Regenerate
                </button>
              </div>
            )}

            {generatingBrief ? (
              <div className={detailStyles.emptyBlock}>
                <p className={detailStyles.emptyDesc}>
                  ✨ Generating strategic brief…
                </p>
              </div>
            ) : lead.strategicBrief ? (
              <div className={detailStyles.briefBody}>
                {lead.strategicBrief.split("\n\n").map((para, i) => (
                  <p key={i} className={detailStyles.briefParagraph}>
                    {para}
                  </p>
                ))}
              </div>
            ) : (
              <div className={detailStyles.emptyBlock}>
                <p className={detailStyles.emptyDesc}>
                  Brief generation failed. Try again.
                </p>
                <button
                  type='button'
                  onClick={() => generateAi("strategic-brief", "brief", true)}
                  className={detailStyles.generateBtn}
                >
                  Retry
                </button>
              </div>
            )}
          </div>
        </section>

        {/* === ACCORDION GROUP — About through Notes & Activity === */}
        <div className={placeStyles.accordionGroup}>
          {/* SEASONAL CONTEXT */}
          {seasonality.applicable && (
            <AccordionSection
              sectionKey='seasonality'
              title='Seasonal Context'
              isOpen={openSection === "seasonality"}
              onToggle={toggleSection}
            >
              <div className={placeStyles.accordionBodyActions}>
                <span
                  className={`${placeStyles.seasonStatus} ${
                    seasonality.currentSeason === "peak"
                      ? placeStyles.seasonStatusPeak
                      : seasonality.currentSeason === "approaching_peak"
                        ? placeStyles.seasonStatusApproaching
                        : seasonality.currentSeason === "off_season"
                          ? placeStyles.seasonStatusOff
                          : placeStyles.seasonStatusNeutral
                  }`}
                >
                  {seasonality.currentSeason.replace(/_/g, " ")}
                </span>
              </div>
              <p className={placeStyles.seasonWindow}>
                Peak: {seasonality.peakBookingWindow}
              </p>
              <p className={placeStyles.seasonRec}>
                {seasonality.recommendation}
              </p>
            </AccordionSection>
          )}

          {/* RECOMMENDED MOVE */}
          <AccordionSection
            sectionKey='recommendedMove'
            title='Recommended Move'
            isOpen={openSection === "recommendedMove"}
            onToggle={toggleSection}
          >
            <RecommendedMoveCard suggestion={nextMove} />
          </AccordionSection>

          {/* WHO TO CONTACT */}
          <AccordionSection
            sectionKey='whoToContact'
            title='Who to Contact'
            isOpen={openSection === "whoToContact"}
            onToggle={toggleSection}
          >
            {lead.decisionMaker && !generatingDM && (
              <div className={placeStyles.accordionBodyActions}>
                <button
                  type='button'
                  onClick={() => generateAi("decision-maker", "dm", true)}
                  className={detailStyles.regenerateBtn}
                >
                  Regenerate
                </button>
              </div>
            )}

            {generatingDM ? (
              <div className={detailStyles.emptyBlock}>
                <p className={detailStyles.emptyDesc}>
                  ✨ Identifying decision-makers…
                </p>
              </div>
            ) : lead.decisionMaker ? (
              <div className={detailStyles.dmBody}>
                <div className={detailStyles.dmRow}>
                  <p className={detailStyles.dmLabel}>Primary target</p>
                  <p className={detailStyles.dmTitle}>
                    {lead.decisionMaker.primary.title}
                  </p>
                  <p className={detailStyles.dmWhy}>
                    {lead.decisionMaker.primary.why}
                  </p>
                </div>
                <div className={detailStyles.dmRow}>
                  <p className={detailStyles.dmLabel}>Fallback contact</p>
                  <p className={detailStyles.dmTitle}>
                    {lead.decisionMaker.secondary.title}
                  </p>
                  <p className={detailStyles.dmWhy}>
                    {lead.decisionMaker.secondary.why}
                  </p>
                </div>
                <div className={detailStyles.dmRow}>
                  <p className={detailStyles.dmLabel}>LinkedIn search</p>
                  <a
                    href={`https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(lead.decisionMaker.linkedinSearch)}`}
                    target='_blank'
                    rel='noopener noreferrer'
                    className={detailStyles.dmLink}
                  >
                    Search: {lead.decisionMaker.linkedinSearch} ↗
                  </a>
                </div>
              </div>
            ) : (
              <div className={detailStyles.emptyBlock}>
                <p className={detailStyles.emptyDesc}>
                  Decision-maker analysis failed. Try again.
                </p>
                <button
                  type='button'
                  onClick={() => generateAi("decision-maker", "dm", true)}
                  className={detailStyles.generateBtn}
                >
                  Retry
                </button>
              </div>
            )}
          </AccordionSection>

          {/* VERIFIED CONTACTS */}
          <AccordionSection
            sectionKey='verifiedContacts'
            title='Verified Contacts'
            isOpen={openSection === "verifiedContacts"}
            onToggle={toggleSection}
          >
            {lead.isDraft ? (
              <div className={placeStyles.apolloPending}>
                <span className={placeStyles.apolloIcon}>🔒</span>
                <p className={placeStyles.apolloTitle}>
                  Save this lead to unlock verified contacts
                </p>
                <p className={placeStyles.apolloDesc}>
                  We&apos;ll look up verified email addresses for{" "}
                  {lead.decisionMaker?.primary?.title ?? "the decision-maker"}{" "}
                  and related titles the moment you save.
                </p>
              </div>
            ) : generatingApollo ? (
              <div className={detailStyles.emptyBlock}>
                <p className={detailStyles.emptyDesc}>
                  ✨ Looking up verified contacts…
                </p>
              </div>
            ) : !lead.apolloEnrichment ||
              lead.apolloEnrichment.enabled === false ? (
              <div className={detailStyles.emptyBlock}>
                <p className={detailStyles.emptyDesc}>
                  {lead.apolloEnrichment?.enabled === false
                    ? lead.apolloEnrichment.reason
                    : "Could not look up verified contacts."}
                </p>
                <button
                  type='button'
                  onClick={() => generateAi("apollo-enrich", "apollo", true)}
                  className={detailStyles.generateBtn}
                >
                  Retry
                </button>
              </div>
            ) : lead.apolloEnrichment.persons.length === 0 ? (
              <div className={detailStyles.emptyBlock}>
                <p className={detailStyles.emptyDesc}>
                  No verified contacts found at this business for the target
                  titles.
                </p>
              </div>
            ) : (
              <div className={placeStyles.apolloPersonsList}>
                {lead.apolloEnrichment.persons.map((person) => (
                  <div
                    key={person.email ?? person.name}
                    className={placeStyles.apolloPersonCard}
                  >
                    <p className={placeStyles.apolloPersonName}>
                      {person.name}
                    </p>
                    <p className={placeStyles.apolloPersonTitle}>
                      {person.title}
                    </p>
                    {person.email && (
                      <a
                        href={`mailto:${person.email}`}
                        className={placeStyles.apolloPersonEmail}
                      >
                        {person.email} ↗
                      </a>
                    )}
                    {person.linkedinUrl && (
                      <a
                        href={person.linkedinUrl}
                        target='_blank'
                        rel='noopener noreferrer'
                        className={placeStyles.apolloPersonLink}
                      >
                        LinkedIn ↗
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </AccordionSection>

          {/* OUTREACH SCRIPTS */}
          <AccordionSection
            sectionKey='outreachScripts'
            title='Outreach Scripts'
            isOpen={openSection === "outreachScripts"}
            onToggle={toggleSection}
          >
            {!lead.isDraft &&
              lead.outreachScripts.length > 0 &&
              !generatingScripts && (
                <div className={placeStyles.accordionBodyActions}>
                  <button
                    type='button'
                    onClick={() =>
                      generateAi("generate-scripts", "scripts", true)
                    }
                    className={detailStyles.regenerateBtn}
                  >
                    Regenerate
                  </button>
                </div>
              )}

            {lead.isDraft ? (
              <div className={placeStyles.scriptsGated}>
                <p className={placeStyles.scriptsGatedTitle}>
                  🔒 Save this lead to unlock outreach scripts
                </p>
                <p className={placeStyles.scriptsGatedDesc}>
                  We&apos;ll generate personalized email, cold call, LinkedIn,
                  and SMS scripts the moment you save. The other AI sections
                  above are free to browse.
                </p>
              </div>
            ) : generatingScripts ? (
              <div className={detailStyles.emptyBlock}>
                <p className={detailStyles.emptyDesc}>
                  ✨ Writing personalized outreach scripts…
                </p>
              </div>
            ) : lead.outreachScripts.length > 0 ? (
              <div className={detailStyles.scriptsList}>
                {lead.outreachScripts.map((script) => (
                  <div key={script.id} className={detailStyles.scriptCard}>
                    <div className={detailStyles.scriptHeader}>
                      <span className={detailStyles.scriptFormat}>
                        {FORMAT_LABELS[script.format]}
                      </span>
                      <button
                        type='button'
                        onClick={() =>
                          copyToClipboard(
                            script.subject
                              ? `Subject: ${script.subject}\n\n${script.body}`
                              : script.body,
                            script.id,
                          )
                        }
                        className={detailStyles.copyBtn}
                      >
                        {copiedId === script.id ? "Copied ✓" : "Copy"}
                      </button>
                    </div>
                    {script.subject && (
                      <p className={detailStyles.scriptSubject}>
                        <strong>Subject:</strong> {script.subject}
                      </p>
                    )}
                    <p className={detailStyles.scriptBody}>{script.body}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className={detailStyles.emptyBlock}>
                <p className={detailStyles.emptyDesc}>
                  Script generation failed. Try again.
                </p>
                <button
                  type='button'
                  onClick={() =>
                    generateAi("generate-scripts", "scripts", true)
                  }
                  className={detailStyles.generateBtn}
                >
                  Retry
                </button>
              </div>
            )}
          </AccordionSection>

          {/* RECENT REVIEWS */}
          {sortedReviews && sortedReviews.length > 0 && (
            <AccordionSection
              sectionKey='recentReviews'
              title='Recent Reviews'
              isOpen={openSection === "recentReviews"}
              onToggle={toggleSection}
            >
              <div className={previewStyles.reviewsList}>
                {sortedReviews.slice(0, 2).map((r) => (
                  <article key={r.name} className={previewStyles.reviewCard}>
                    <header className={previewStyles.reviewHeader}>
                      <span className={previewStyles.reviewAuthor}>
                        {r.authorName ?? "Anonymous"}
                      </span>
                      <span className={previewStyles.reviewMeta}>
                        <StarRating rating={r.rating} />
                        {r.relativeTime && (
                          <span className={previewStyles.reviewTime}>
                            · {r.relativeTime}
                          </span>
                        )}
                      </span>
                    </header>
                    {r.text && (
                      <p className={previewStyles.reviewText}>{r.text}</p>
                    )}
                  </article>
                ))}
              </div>
            </AccordionSection>
          )}

          {/* NOTES & ACTIVITY */}
          {/* <AccordionSection
            sectionKey='notesActivity'
            title='Notes & Activity'
            isOpen={openSection === "notesActivity"}
            onToggle={toggleSection}
          >
            <NotesActivityFeed leadId={lead.id} activities={lead.activities} />
          </AccordionSection> */}
        </div>
        <br />
        <h2 className={detailStyles.sectionTitle}>Notes & Activity</h2>
        <NotesActivityFeed leadId={lead.id} activities={lead.activities} />
      </div>

      {/* SIDEBAR — unchanged */}
      <aside className={detailStyles.sidebar}>
        <div className={detailStyles.sidebarSticky}>
          {lead.isDraft ? (
            <div className={placeStyles.saveCtaCard}>
              <h3 className={placeStyles.saveCtaTitle}>Save this lead</h3>
              <p className={placeStyles.saveCtaDesc}>
                Saving moves this lead into your pipeline and unlocks
                personalized outreach scripts. Your notes stay attached.
              </p>
              <button
                type='button'
                onClick={saveLead}
                disabled={saving}
                className={placeStyles.saveCtaBtn}
              >
                {saving ? "Saving..." : "+ Save lead"}
              </button>
            </div>
          ) : (
            <>
              <h3 className={detailStyles.sidebarTitle}>Quick Actions</h3>

              <div className={detailStyles.sidebarGroup}>
                <label className={detailStyles.sidebarLabel}>Status</label>
                <select
                  value={lead.status}
                  disabled={statusUpdating}
                  onChange={(e) => updateStatus(e.target.value as LeadStatus)}
                  className={detailStyles.statusSelect}
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              {lead.status !== "CONTACTED" && (
                <button
                  type='button'
                  onClick={markContacted}
                  disabled={statusUpdating}
                  className={detailStyles.sidebarBtn}
                >
                  Mark contacted
                </button>
              )}

              <div className={detailStyles.sidebarGroup}>
                <MarkWonButton
                  leadId={lead.id}
                  initialValue={lead.estimatedValue ?? null}
                  alreadyWon={lead.status === "WON"}
                />
              </div>

              <div className={detailStyles.sidebarGroup}>
                <label className={detailStyles.sidebarLabel}>
                  Snooze until
                </label>
                <input
                  type='date'
                  value={snoozeDate}
                  onChange={(e) => setSnoozeDate(e.target.value)}
                  className={detailStyles.dateInput}
                />
                <button
                  type='button'
                  onClick={snoozeLead}
                  disabled={statusUpdating || !snoozeDate}
                  className={detailStyles.sidebarBtn}
                >
                  Snooze
                </button>
              </div>

              <NextActionCard
                leadId={lead.id}
                nextActionAt={lead.nextActionAt}
                nextActionNote={lead.nextActionNote}
              />

              <OutreachQuickLog leadId={lead.id} />

              {mailtoUrl && (
                <a href={mailtoUrl} className={detailStyles.sidebarBtnPrimary}>
                  📧 Open in mail app
                </a>
              )}

              {lead.lastContactedAt && (
                <p className={detailStyles.sidebarMeta}>
                  Last contacted{" "}
                  {new Date(lead.lastContactedAt).toLocaleDateString()}
                </p>
              )}
              <div className={detailStyles.sidebarDangerZone}>
                <button
                  type='button'
                  onClick={requestDelete}
                  disabled={saving}
                  className={detailStyles.sidebarBtnDanger}
                >
                  Delete lead
                </button>
              </div>
            </>
          )}
        </div>
      </aside>

      {lightboxOpen && displayedPhotos[lightboxIndex] && (
        <div
          className={previewStyles.lightboxOverlay}
          onClick={closeLightbox}
          role='dialog'
          aria-modal='true'
        >
          <button
            type='button'
            onClick={(e) => {
              e.stopPropagation();
              closeLightbox();
            }}
            className={previewStyles.lightboxClose}
            aria-label='Close'
          >
            ×
          </button>
          <button
            type='button'
            onClick={(e) => {
              e.stopPropagation();
              prevPhoto();
            }}
            className={previewStyles.lightboxPrev}
            aria-label='Previous photo'
          >
            <Arrow style={{ transform: "rotate(-90deg)" }} />
          </button>
          <div
            className={previewStyles.lightboxImageWrap}
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/api/leads/place-photo?name=${encodeURIComponent(
                displayedPhotos[lightboxIndex].name,
              )}&maxWidth=1600`}
              alt={`${lead.businessName ?? "Place"} photo ${lightboxIndex + 1}`}
              className={previewStyles.lightboxImage}
            />
          </div>
          <button
            type='button'
            onClick={(e) => {
              e.stopPropagation();
              nextPhoto();
            }}
            className={previewStyles.lightboxNext}
            aria-label='Next photo'
          >
            <Arrow style={{ transform: "rotate(90deg)" }} />
          </button>
        </div>
      )}

      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)}>
        <div className={placeStyles.deleteModalContent}>
          <p className={placeStyles.deleteModalTitle}>Delete this lead?</p>
          <p className={placeStyles.deleteModalDesc}>
            <strong>{lead.businessName ?? "This lead"}</strong> will be
            permanently removed along with all notes, activities, and outreach
            scripts. This cannot be undone.
          </p>
          <div className={placeStyles.deleteModalActions}>
            <button
              type='button'
              onClick={() => setShowDeleteModal(false)}
              className={placeStyles.deleteModalCancel}
            >
              Cancel
            </button>
            <button
              type='button'
              onClick={confirmDelete}
              className={placeStyles.deleteModalConfirm}
            >
              Delete permanently
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
