"use client";

import { useState, useEffect, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import detailStyles from "../../[id]/LeadDetailPage.module.css";
import previewStyles from "../../preview/[placeId]/PreviewPage.module.css";
import styles from "./EventDetailPage.module.css";
import LeadSourceBar from "../../[id]/_components/LeadSourceBar";
import NotesActivityFeed from "../../[id]/_components/NotesActivityFeed";
import NextActionCard from "../../[id]/_components/NextActionCard";
import OutreachQuickLog from "../../[id]/_components/OutreachQuickLog";
import type { OutreachWindow } from "@/lib/warmLeadIntelligence";

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
      matchedDomain?: string;
    }
  | { enabled: false; reason: string };

type SerializedEvent = {
  eventbriteId: string;
  eventName: string;
  eventDateIso: string;
  description: string | null;
  imageUrl: string | null;
  tags: string[];
  venueName: string | null;
  venueAddress: string | null;
  venueLat: number | null;
  venueLng: number | null;
  ticketPriceMin: string | null;
  ticketPriceMax: string | null;
  expectedAttendance: number | null;
  organizerName: string | null;
  organizerEmail: string | null;
  organizerPhone: string | null;
  category: string | null;
  aiScore: number | null;
  url: string;
};

type RecurringEvent = {
  eventbriteId: string;
  eventName: string;
  eventDateIso: string;
};

type SerializedLead = {
  leadId: string;
  leadType: "WARM";
  isDraft: boolean;
  status: LeadStatus;
  notes: string | null;
  snoozeUntil: string | null;
  nextActionAt: string | null;
  nextActionNote: string | null;
  lastContactedAt: string | null;
  createdAt: string;
  activities: SerializedActivity[];
  strategicBrief: string | null;
  decisionMaker: DecisionMaker | null;
  apolloEnrichment: ApolloEnrichment | null;
  outreachScripts: SerializedScript[];
  event: SerializedEvent;
  distanceMiles: number | null;
  primaryMarket: string | null;
  primaryLat: number | null;
  primaryLng: number | null;
  serviceRadiusMiles: number | null;
  outreachWindow: OutreachWindow;
  recurringEvents: RecurringEvent[];
};

type Props = {
  lead: SerializedLead;
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

const DESCRIPTION_TRUNCATE_THRESHOLD = 500;

function formatDateLong(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateShort(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

function daysUntil(iso: string): number {
  return Math.max(
    0,
    Math.floor((new Date(iso).getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
  );
}

function formatPrice(min: string | null, max: string | null): string {
  const minNum = min ? parseFloat(min) : null;
  const maxNum = max ? parseFloat(max) : null;
  if (minNum === 0 && maxNum === 0) return "Free";
  if (minNum != null && maxNum != null && minNum !== maxNum) {
    return `$${minNum.toFixed(0)} – $${maxNum.toFixed(0)}`;
  }
  if (minNum != null) return `$${minNum.toFixed(0)}`;
  if (maxNum != null) return `$${maxNum.toFixed(0)}`;
  return "—";
}

function formatDriveTime(seconds: number): string {
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder > 0 ? `${hours}h ${remainder}m` : `${hours}h`;
}

export default function EventDetailClient({
  lead: initialLead,
  outreachAttempts,
  lastContactDays,
}: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [lead, setLead] = useState(initialLead);

  useEffect(() => {
    setLead(initialLead);
  }, [initialLead]);

  // AI generation flags — start true for missing content so skeletons render
  const [generatingBrief, setGeneratingBrief] = useState(!lead.strategicBrief);
  const [generatingDM, setGeneratingDM] = useState(!lead.decisionMaker);
  const [generatingScripts, setGeneratingScripts] = useState(false);
  const [generatingApollo, setGeneratingApollo] = useState(
    !lead.apolloEnrichment || lead.apolloEnrichment.enabled === false,
  );

  const [statusUpdating, setStatusUpdating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [snoozeDate, setSnoozeDate] = useState(
    lead.snoozeUntil?.split("T")[0] ?? "",
  );
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [mapFailed, setMapFailed] = useState(false);
  const [driveTime, setDriveTime] = useState<{ seconds: number } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Guard against double-firing AI generation
  const aiKickedOff = useRef(false);

  const event = lead.event;
  const days = daysUntil(event.eventDateIso);
  const mapsUrl = event.venueAddress
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.venueAddress)}`
    : null;

  const descriptionTruncated =
    event.description != null &&
    event.description.length > DESCRIPTION_TRUNCATE_THRESHOLD;
  const visibleDescription = !event.description
    ? null
    : showFullDescription || !descriptionTruncated
      ? event.description
      : `${event.description.slice(0, DESCRIPTION_TRUNCATE_THRESHOLD).trimEnd()}…`;

  // Drive time fetch
  useEffect(() => {
    if (
      lead.primaryLat == null ||
      lead.primaryLng == null ||
      event.venueLat == null ||
      event.venueLng == null
    ) {
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `/api/leads/drive-time?fromLat=${lead.primaryLat}&fromLng=${lead.primaryLng}&toLat=${event.venueLat}&toLng=${event.venueLng}`,
        );
        if (!res.ok) return;
        const body = await res.json();
        if (!cancelled && body.driveTimeSeconds) {
          setDriveTime({ seconds: body.driveTimeSeconds });
        }
      } catch (err) {
        console.warn("[event detail] drive-time failed", err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [lead.primaryLat, lead.primaryLng, event.venueLat, event.venueLng]);

  // Auto-fire AI generation on mount for missing sections
  useEffect(() => {
    if (aiKickedOff.current) return;
    aiKickedOff.current = true;

    if (!lead.strategicBrief) generateAi("strategic-brief", "brief");
    if (!lead.decisionMaker) generateAi("decision-maker", "dm");
    // Apollo + scripts only run on saved leads
    if (
      !lead.isDraft &&
      (!lead.apolloEnrichment || lead.apolloEnrichment.enabled === false)
    ) {
      generateAi("apollo-enrich", "apollo");
    }
    if (!lead.isDraft && lead.outreachScripts.length === 0) {
      generateAi("generate-scripts", "scripts");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Watch effects to clear loading flags once content arrives
  useEffect(() => {
    if (lead.strategicBrief) setGeneratingBrief(false);
  }, [lead.strategicBrief]);

  useEffect(() => {
    if (lead.decisionMaker) setGeneratingDM(false);
  }, [lead.decisionMaker]);

  useEffect(() => {
    if (lead.outreachScripts.length > 0) setGeneratingScripts(false);
  }, [lead.outreachScripts.length]);

  useEffect(() => {
    if (lead.apolloEnrichment) setGeneratingApollo(false);
  }, [lead.apolloEnrichment]);

  async function generateAi(
    endpoint:
      | "strategic-brief"
      | "decision-maker"
      | "apollo-enrich"
      | "generate-scripts",
    field: "brief" | "dm" | "apollo" | "scripts",
    force = false,
  ) {
    const setLoading = {
      brief: setGeneratingBrief,
      dm: setGeneratingDM,
      apollo: setGeneratingApollo,
      scripts: setGeneratingScripts,
    }[field];
    setLoading(true);
    try {
      const res = await fetch(
        `/api/leads/warm/${lead.leadId}/${endpoint}${force ? "?force=true" : ""}`,
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

  async function patchLead(patch: Record<string, unknown>) {
    const res = await fetch(`/api/leads/${lead.leadId}`, {
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
        // Kick off gated AI calls now that we're saved
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

  async function copyToClipboard(text: string, scriptId: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(scriptId);
      setTimeout(() => setCopiedId(null), 1500);
    } catch (err) {
      console.error("Copy failed", err);
    }
  }

  const window_ = lead.outreachWindow;
  const emailScript = lead.outreachScripts.find((s) => s.format === "EMAIL");
  const mailtoUrl = emailScript
    ? `mailto:?subject=${encodeURIComponent(emailScript.subject ?? "")}&body=${encodeURIComponent(emailScript.body)}`
    : null;

  return (
    <div className={detailStyles.layout}>
      <div className={detailStyles.body}>
        <LeadSourceBar
          leadType='WARM'
          category={event.category ?? "Event"}
          source='eventbrite'
          createdAt={lead.createdAt}
          outreachAttempts={outreachAttempts}
          daysSinceLastContact={lastContactDays}
        />

        {/* HERO */}
        <section className={styles.hero}>
          {!lead.isDraft && (
            <p className={styles.eyebrow}>
              <span
                className={`${detailStyles.statusBadge} ${detailStyles[`status_${lead.status}`]}`}
              >
                {lead.status}
              </span>
            </p>
          )}
          {lead.isDraft && (
            <p className={styles.eyebrow}>Preview · not yet saved</p>
          )}

          {event.imageUrl && (
            <div className={styles.heroImageWrap}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={event.imageUrl}
                alt={event.eventName}
                className={styles.heroImage}
                loading='lazy'
              />
            </div>
          )}

          <h1 className={styles.heroName}>{event.eventName}</h1>

          <div className={styles.heroDateRow}>
            <span className={styles.heroDateMain}>
              {formatDateLong(event.eventDateIso)}
            </span>
            <span className={styles.heroDateTime}>
              · {formatTime(event.eventDateIso)}
            </span>
            <span className={styles.heroCountdown}>
              {days === 0
                ? "Today"
                : days === 1
                  ? "Tomorrow"
                  : `${days} days away`}
            </span>
          </div>

          {event.venueName && (
            <p className={styles.heroVenue}>{event.venueName}</p>
          )}
          {event.venueAddress && (
            <p className={styles.heroAddress}>{event.venueAddress}</p>
          )}

          <div className={styles.heroLinks}>
            <a
              href={event.url}
              target='_blank'
              rel='noopener noreferrer'
              className={styles.heroLink}
            >
              View on Eventbrite ↗
            </a>
            {mapsUrl && (
              <a
                href={mapsUrl}
                target='_blank'
                rel='noopener noreferrer'
                className={styles.heroLink}
              >
                Open in Google Maps ↗
              </a>
            )}
          </div>
        </section>

        {/* LOCATION CARD */}
        {lead.distanceMiles !== null &&
          lead.primaryMarket &&
          event.venueLat != null &&
          event.venueLng != null && (
            <section
              className={`${previewStyles.locationCard} ${mapFailed ? previewStyles.locationCardNoMap : ""}`}
            >
              {!mapFailed && (
                <div className={previewStyles.locationMap}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/api/leads/static-map?lat=${event.venueLat}&lng=${event.venueLng}&zoom=14&width=600&height=300`}
                    alt={`Map of ${event.venueName ?? "venue"}`}
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

        {/* OUTREACH WINDOW */}
        <section
          className={`${styles.outreachCard} ${styles[`outreach_${window_.status}`]}`}
        >
          <div className={styles.outreachHeader}>
            <p className={styles.outreachLabel}>Outreach timing</p>
            <span className={styles.outreachStatus}>
              {window_.status.replace(/_/g, " ")}
            </span>
          </div>
          <h3 className={styles.outreachHeadline}>{window_.headline}</h3>
          <p className={styles.outreachBody}>{window_.recommendation}</p>
          <p className={styles.outreachWindow}>
            Optimal window: {window_.optimalRangeStart}–
            {window_.optimalRangeEnd} days before event ·{" "}
            <strong>{window_.daysUntilEvent} days</strong> until this one
          </p>
        </section>

        {/* STRATEGIC BRIEF */}
        <section className={detailStyles.section}>
          <div className={detailStyles.sectionHeader}>
            <h2 className={detailStyles.sectionTitle}>Strategic Brief</h2>
            {lead.strategicBrief && !generatingBrief && (
              <button
                type='button'
                onClick={() => generateAi("strategic-brief", "brief", true)}
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
                onClick={() => generateAi("strategic-brief", "brief", true)}
                className={detailStyles.generateBtn}
              >
                Retry
              </button>
            </div>
          )}
        </section>

        {/* TAGS */}
        {event.tags.length > 0 && (
          <section className={detailStyles.section}>
            <h2 className={detailStyles.sectionTitle}>Tags</h2>
            <div className={styles.tagRow}>
              {event.tags.map((tag) => (
                <span key={tag} className={styles.tagChip}>
                  {tag}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* DESCRIPTION */}
        {visibleDescription && (
          <section className={detailStyles.section}>
            <h2 className={detailStyles.sectionTitle}>About this event</h2>
            <p className={styles.description}>{visibleDescription}</p>
            {descriptionTruncated && (
              <button
                type='button'
                onClick={() => setShowFullDescription(!showFullDescription)}
                className={styles.descriptionToggle}
              >
                {showFullDescription ? "Show less" : "Show more"}
              </button>
            )}
          </section>
        )}

        {/* EVENT FACTS */}
        <section className={detailStyles.section}>
          <h2 className={detailStyles.sectionTitle}>Event details</h2>
          <div className={styles.factsGrid}>
            <div className={styles.factCell}>
              <p className={styles.factLabel}>Ticket price</p>
              <p className={styles.factValue}>
                {formatPrice(event.ticketPriceMin, event.ticketPriceMax)}
              </p>
            </div>
            {event.expectedAttendance != null && (
              <div className={styles.factCell}>
                <p className={styles.factLabel}>Expected attendance</p>
                <p className={styles.factValue}>
                  ~{event.expectedAttendance.toLocaleString()}
                </p>
              </div>
            )}
            <div className={styles.factCell}>
              <p className={styles.factLabel}>Organizer</p>
              <p className={styles.factValue}>
                {event.organizerName ?? "Unknown"}
              </p>
            </div>
            <div className={styles.factCell}>
              <p className={styles.factLabel}>Category</p>
              <p className={styles.factValue}>{event.category ?? "Event"}</p>
            </div>
            {event.aiScore != null && (
              <div className={styles.factCell}>
                <p className={styles.factLabel}>Lead score</p>
                <p className={styles.factValue}>{event.aiScore}/100</p>
              </div>
            )}
          </div>
        </section>

        {/* WHO TO CONTACT */}
        <section className={detailStyles.section}>
          <div className={detailStyles.sectionHeader}>
            <h2 className={detailStyles.sectionTitle}>Who to Contact</h2>
            {lead.decisionMaker && !generatingDM && (
              <button
                type='button'
                onClick={() => generateAi("decision-maker", "dm", true)}
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
                onClick={() => generateAi("decision-maker", "dm", true)}
                className={detailStyles.generateBtn}
              >
                Retry
              </button>
            </div>
          )}
        </section>

        {/* APOLLO VERIFIED CONTACTS */}
        <section className={detailStyles.section}>
          <div className={detailStyles.sectionHeader}>
            <h2 className={detailStyles.sectionTitle}>Verified Contacts</h2>
          </div>
          {lead.isDraft ? (
            <div className={styles.apolloPending}>
              <span className={styles.apolloIcon}>🔒</span>
              <p className={styles.apolloTitle}>
                Save this lead to unlock verified contacts
              </p>
              <p className={styles.apolloDesc}>
                We&apos;ll guess the organizer&apos;s domain and search Apollo
                for verified emails for{" "}
                {lead.decisionMaker?.primary?.title ?? "the decision-maker"} and
                related titles the moment you save.
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
                No verified contacts found at{" "}
                {lead.apolloEnrichment.matchedDomain ?? "this organizer"} for
                the target titles.
              </p>
            </div>
          ) : (
            <div className={styles.apolloPersonsList}>
              {lead.apolloEnrichment.matchedDomain && (
                <p className={styles.apolloDomainNote}>
                  Found at{" "}
                  <strong>{lead.apolloEnrichment.matchedDomain}</strong>
                </p>
              )}
              {lead.apolloEnrichment.persons.map((person) => (
                <div
                  key={person.email ?? person.name}
                  className={styles.apolloPersonCard}
                >
                  <p className={styles.apolloPersonName}>{person.name}</p>
                  <p className={styles.apolloPersonTitle}>{person.title}</p>
                  {person.email && (
                    <a
                      href={`mailto:${person.email}`}
                      className={styles.apolloPersonEmail}
                    >
                      {person.email} ↗
                    </a>
                  )}
                  {person.linkedinUrl && (
                    <a
                      href={person.linkedinUrl}
                      target='_blank'
                      rel='noopener noreferrer'
                      className={styles.apolloPersonLink}
                    >
                      LinkedIn ↗
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* RECURRING ORGANIZER */}
        {lead.recurringEvents.length > 0 && (
          <section className={styles.recurringCard}>
            <div className={styles.recurringHeader}>
              <p className={styles.recurringLabel}>Repeat organizer</p>
              <h3 className={styles.recurringTitle}>
                {event.organizerName} hosts other events in your market
              </h3>
            </div>
            <p className={styles.recurringBody}>
              This organizer has {lead.recurringEvents.length} other event
              {lead.recurringEvents.length === 1 ? "" : "s"} on file. Recurring
              event organizers tend to re-book transportation vendors year over
              year — strong relationship-building target.
            </p>
            <ul className={styles.recurringList}>
              {lead.recurringEvents.map((re) => (
                <li key={re.eventbriteId} className={styles.recurringItem}>
                  <span className={styles.recurringEventName}>
                    {re.eventName}
                  </span>
                  <span className={styles.recurringEventDate}>
                    {formatDateShort(re.eventDateIso)}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* PITCH IDEAS */}
        <section className={detailStyles.section}>
          <h2 className={detailStyles.sectionTitle}>Pitch ideas</h2>
          <p className={styles.pitchIntro}>
            Events at this scale typically need ground transportation in one or
            more of the following forms. Pitch the angle that fits your fleet
            best.
          </p>
          <ul className={styles.pitchList}>
            <li className={styles.pitchItem}>
              <strong>VIP / sponsor pickup</strong> — donors and headliners
              expect car service to and from the venue. Often comp&apos;d by
              the host as part of the donor experience.
            </li>
            <li className={styles.pitchItem}>
              <strong>Hotel-to-venue shuttle</strong> — out-of-town attendees
              staying at nearby hotels need a circulator the night of. Fixed
              fee, predictable revenue.
            </li>
            <li className={styles.pitchItem}>
              <strong>Late-night safe rides home</strong> — alcohol service
              plus an older guest list = liability concerns. Cars on standby
              from 10pm–midnight is an easy add-on.
            </li>
            <li className={styles.pitchItem}>
              <strong>Keynote / honoree transport</strong> — speakers and
              award recipients get cars. Single-trip or round-trip from
              airport / hotel.
            </li>
          </ul>
        </section>

        {/* OUTREACH SCRIPTS */}
        <section className={detailStyles.section}>
          <div className={detailStyles.sectionHeader}>
            <h2 className={detailStyles.sectionTitle}>Outreach Scripts</h2>
            {!lead.isDraft &&
              lead.outreachScripts.length > 0 &&
              !generatingScripts && (
                <button
                  type='button'
                  onClick={() =>
                    generateAi("generate-scripts", "scripts", true)
                  }
                  className={detailStyles.regenerateBtn}
                >
                  Regenerate
                </button>
              )}
          </div>
          {lead.isDraft ? (
            <div className={styles.scriptsGated}>
              <p className={styles.scriptsGatedTitle}>
                🔒 Save this lead to unlock outreach scripts
              </p>
              <p className={styles.scriptsGatedDesc}>
                We&apos;ll generate personalized email, cold call, LinkedIn,
                and SMS scripts referencing this specific event the moment you
                save.
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
                onClick={() => generateAi("generate-scripts", "scripts", true)}
                className={detailStyles.generateBtn}
              >
                Retry
              </button>
            </div>
          )}
        </section>

        {/* NOTES & ACTIVITY */}
        <NotesActivityFeed leadId={lead.leadId} activities={lead.activities} />
      </div>

      {/* SIDEBAR */}
      <aside className={detailStyles.sidebar}>
        <div className={detailStyles.sidebarSticky}>
          {lead.isDraft ? (
            <div className={styles.saveCtaCard}>
              <h3 className={styles.saveCtaTitle}>Save this lead</h3>
              <p className={styles.saveCtaDesc}>
                Saving moves this event into your pipeline and unlocks verified
                contacts plus personalized outreach scripts. Your notes stay
                attached.
              </p>
              <button
                type='button'
                onClick={saveLead}
                disabled={saving}
                className={styles.saveCtaBtn}
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
                leadId={lead.leadId}
                nextActionAt={lead.nextActionAt}
                nextActionNote={lead.nextActionNote}
              />

              <OutreachQuickLog leadId={lead.leadId} />

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