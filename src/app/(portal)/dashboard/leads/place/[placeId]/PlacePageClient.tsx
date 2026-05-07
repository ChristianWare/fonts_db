"use client";

import { useState, useEffect, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
// import Link from "next/link";
import previewStyles from "../../preview/[placeId]/PreviewPage.module.css";
import detailStyles from "../../[id]/LeadDetailPage.module.css";
import placeStyles from "./PlacePage.module.css";
import LeadSourceBar from "../../[id]/_components/LeadSourceBar";
import RecommendedMoveCard from "../../[id]/_components/RecommendedMoveCard";
import NotesActivityFeed from "../../[id]/_components/NotesActivityFeed";
import NextActionCard from "../../[id]/_components/NextActionCard";
import OutreachQuickLog from "../../[id]/_components/OutreachQuickLog";
import type { NextMoveSuggestion } from "@/lib/leadNextMove";

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
  notes: string | null;
  isDraft: boolean;
  strategicBrief: string | null;
  reviewIntelligence: string | null;
  decisionMaker: DecisionMaker | null;
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

export default function PlacePageClient({
  lead: initialLead,
  nextMove,
  outreachAttempts,
  lastContactDays,
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

  // AI generation flags — initialize true for missing content so skeletons show immediately
  const [generatingBrief, setGeneratingBrief] = useState(!lead.strategicBrief);
  const [generatingReviews, setGeneratingReviews] = useState(
    !lead.reviewIntelligence,
  );
  const [generatingDM, setGeneratingDM] = useState(!lead.decisionMaker);
  const [generatingScripts, setGeneratingScripts] = useState(false);

  const [statusUpdating, setStatusUpdating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [snoozeDate, setSnoozeDate] = useState(
    lead.snoozeUntil?.split("T")[0] ?? "",
  );
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Guard against double-firing across StrictMode + re-renders
  const aiKickedOff = useRef(false);

  // Fetch Google Places preview (photos, hours, reviews)
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

  // Fetch drive time
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

  // Auto-fire AI generation for missing sections
  useEffect(() => {
    if (aiKickedOff.current) return;
    aiKickedOff.current = true;

    if (!lead.strategicBrief) generateAi("strategic-brief", "brief");
    if (!lead.reviewIntelligence) generateAi("review-intelligence", "reviews");
    if (!lead.decisionMaker) generateAi("decision-maker", "dm");
    // Scripts only if not draft
    if (!lead.isDraft && lead.outreachScripts.length === 0) {
      generateAi("generate-scripts", "scripts");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Clear loading flags once content arrives via router.refresh()
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

  async function generateAi(
    endpoint: string,
    field: "brief" | "reviews" | "dm" | "scripts",
  ) {
    const setLoading = {
      brief: setGeneratingBrief,
      reviews: setGeneratingReviews,
      dm: setGeneratingDM,
      scripts: setGeneratingScripts,
    }[field];
    setLoading(true);
    try {
      const res = await fetch(`/api/leads/${lead.id}/${endpoint}`, {
        method: "POST",
      });
      if (!res.ok) {
        console.error(`${endpoint} failed`, await res.text());
        setLoading(false); // failure: clear immediately, show retry UI
        return;
      }
      // Success: trigger refresh, but DON'T clear loading yet.
      // The watcher effects below clear it once content actually arrives in props.
      startTransition(() => router.refresh());
    } catch (err) {
      setLoading(false); // network error: clear immediately
      console.error(`${endpoint} threw`, err);
    }
  }

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
        // Optimistic local update so sidebar swaps immediately
        setLead((prev) => ({ ...prev, isDraft: false }));
        // Kick off scripts generation now that we're saved
        generateAi("generate-scripts", "scripts");
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

  async function copyToClipboard(text: string, scriptId: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(scriptId);
      setTimeout(() => setCopiedId(null), 1500);
    } catch (err) {
      console.error("Copy failed", err);
    }
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

        {/* HERO */}
        <section className={previewStyles.hero}>
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
          <h1 className={previewStyles.heroName}>
            {lead.businessName ?? "Unnamed"}
          </h1>
          {lead.businessAddress && (
            <p className={previewStyles.heroAddress}>{lead.businessAddress}</p>
          )}

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
                {lead.businessWebsite.replace(/^https?:\/\//, "")} ↗
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
        </section>

        {/* PHOTOS */}
        {preview?.photos && preview.photos.length > 0 && (
          <section className={previewStyles.photosSection}>
            <div className={previewStyles.photosRow}>
              {preview.photos.slice(0, 6).map((photo, i) => (
                <div key={photo.name} className={previewStyles.photoWrap}>
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

        {/* LOCATION CARD */}
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

        <RecommendedMoveCard suggestion={nextMove} />

        {/* ABOUT (editorial) */}
        {(preview?.editorialSummary || preview?.generativeSummary) && (
          <section className={detailStyles.section}>
            <h2 className={detailStyles.sectionTitle}>About</h2>
            <p className={previewStyles.editorialBody}>
              {preview.generativeSummary ?? preview.editorialSummary}
            </p>
          </section>
        )}

        {/* AT A GLANCE */}
        {allChips.length > 0 && (
          <section className={detailStyles.section}>
            <h2 className={detailStyles.sectionTitle}>At a glance</h2>
            <div className={previewStyles.chipsRow}>
              {allChips.map((label) => (
                <span key={label} className={previewStyles.atmosphereChip}>
                  {label}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* HOURS */}
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

        {/* STRATEGIC BRIEF */}
        <section className={detailStyles.section}>
          <div className={detailStyles.sectionHeader}>
            <h2 className={detailStyles.sectionTitle}>Strategic Brief</h2>
            {lead.strategicBrief && !generatingBrief && (
              <button
                type='button'
                onClick={() => generateAi("strategic-brief", "brief")}
                disabled={generatingBrief}
                className={detailStyles.regenerateBtn}
              >
                Regenerate
              </button>
            )}
          </div>
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
                onClick={() => generateAi("strategic-brief", "brief")}
                className={detailStyles.generateBtn}
              >
                Retry
              </button>
            </div>
          )}
        </section>

        {/* REVIEW INTELLIGENCE */}
        <section className={detailStyles.section}>
          <div className={detailStyles.sectionHeader}>
            <h2 className={detailStyles.sectionTitle}>Review Intelligence</h2>
            {lead.reviewIntelligence && !generatingReviews && (
              <button
                type='button'
                onClick={() => generateAi("review-intelligence", "reviews")}
                className={detailStyles.regenerateBtn}
              >
                Regenerate
              </button>
            )}
          </div>
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
                onClick={() => generateAi("review-intelligence", "reviews")}
                className={detailStyles.generateBtn}
              >
                Retry
              </button>
            </div>
          )}
        </section>

        {/* WHO TO CONTACT */}
        <section className={detailStyles.section}>
          <div className={detailStyles.sectionHeader}>
            <h2 className={detailStyles.sectionTitle}>Who to Contact</h2>
            {lead.decisionMaker && !generatingDM && (
              <button
                type='button'
                onClick={() => generateAi("decision-maker", "dm")}
                className={detailStyles.regenerateBtn}
              >
                Regenerate
              </button>
            )}
          </div>
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
                onClick={() => generateAi("decision-maker", "dm")}
                className={detailStyles.generateBtn}
              >
                Retry
              </button>
            </div>
          )}
        </section>

        {/* OUTREACH SCRIPTS — gated on isDraft */}
        <section className={detailStyles.section}>
          <div className={detailStyles.sectionHeader}>
            <h2 className={detailStyles.sectionTitle}>Outreach Scripts</h2>
            {!lead.isDraft &&
              lead.outreachScripts.length > 0 &&
              !generatingScripts && (
                <button
                  type='button'
                  onClick={() => generateAi("generate-scripts", "scripts")}
                  className={detailStyles.regenerateBtn}
                >
                  Regenerate
                </button>
              )}
          </div>
          {lead.isDraft ? (
            <div className={placeStyles.scriptsGated}>
              <p className={placeStyles.scriptsGatedTitle}>
                🔒 Save this lead to unlock outreach scripts
              </p>
              <p className={placeStyles.scriptsGatedDesc}>
                We&apos;ll generate personalized email, cold call, LinkedIn, and
                SMS scripts the moment you save. The other AI sections above are
                free to browse.
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
                onClick={() => generateAi("generate-scripts", "scripts")}
                className={detailStyles.generateBtn}
              >
                Retry
              </button>
            </div>
          )}
        </section>

        {/* RECENT REVIEWS */}
        {sortedReviews && sortedReviews.length > 0 && (
          <section className={detailStyles.section}>
            <h2 className={detailStyles.sectionTitle}>Recent reviews</h2>
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
          </section>
        )}

        {/* NOTES & ACTIVITY (always shown — drafts can have notes too) */}
        <NotesActivityFeed leadId={lead.id} activities={lead.activities} />
      </div>

      {/* SIDEBAR — conditional */}
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
            </>
          )}
        </div>
      </aside>
    </div>
  );
}