"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import styles from "./LeadDetailPage.module.css";

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
  rating: number | null;
  reviewCount: number | null;
  status: LeadStatus;
  notes: string | null;
  isFavorite: boolean;
  strategicBrief: string | null;
  reviewIntelligence: string | null;
  decisionMaker: DecisionMaker | null;
  distanceMiles: number | null;
  primaryMarket: string | null;
  serviceRadiusMiles: number | null;
  snoozeUntil: string | null;
  lastContactedAt: string | null;
  createdAt: string;
  outreachScripts: SerializedScript[];
  activities: SerializedActivity[];
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

function formatActivityDate(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function LeadDetailClient({
  lead,
}: {
  lead: SerializedLead;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [statusUpdating, setStatusUpdating] = useState(false);
  const [generatingBrief, setGeneratingBrief] = useState(false);
  const [generatingReviews, setGeneratingReviews] = useState(false);
  const [generatingDM, setGeneratingDM] = useState(false);
  const [generatingScripts, setGeneratingScripts] = useState(false);
  const [promoting, setPromoting] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [snoozeDate, setSnoozeDate] = useState(
    lead.snoozeUntil?.split("T")[0] ?? "",
  );

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

  async function promoteToPipeline() {
    setPromoting(true);
    try {
      await patchLead({ isFavorite: false });
    } finally {
      setPromoting(false);
    }
  }

  async function generate(
    endpoint: string,
    setLoading: (v: boolean) => void,
  ) {
    setLoading(true);
    try {
      const res = await fetch(`/api/leads/${lead.id}/${endpoint}`, {
        method: "POST",
      });
      if (!res.ok) {
        console.error(`${endpoint} failed`, await res.text());
        return;
      }
      startTransition(() => router.refresh());
    } catch (err) {
      console.error(`${endpoint} failed`, err);
    } finally {
      setLoading(false);
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

  const emailScript = lead.outreachScripts.find((s) => s.format === "EMAIL");
  const mailtoUrl = emailScript
    ? `mailto:?subject=${encodeURIComponent(emailScript.subject ?? "")}&body=${encodeURIComponent(emailScript.body)}`
    : null;

  return (
    <div className={styles.layout}>
      <div className={styles.body}>
        {/* Favorite banner */}
        {lead.isFavorite && (
          <div className={styles.favoriteBanner}>
            <span className={styles.favoriteBannerText}>
              ★ This is a favorite — not yet in your pipeline
            </span>
            <button
              type='button'
              onClick={promoteToPipeline}
              disabled={promoting}
              className={styles.promoteBtn}
            >
              {promoting ? "Promoting..." : "Promote to pipeline →"}
            </button>
          </div>
        )}

        {/* Hero */}
        <section className={styles.hero}>
          <div className={styles.heroMeta}>
            <span
              className={`${styles.statusBadge} ${styles[`status_${lead.status}`]}`}
            >
              {lead.status}
            </span>
            <span className={styles.category}>
              {lead.category.replace(/_/g, " ")}
            </span>
          </div>

          <h1 className={styles.heroName}>{lead.businessName ?? "Unnamed"}</h1>

          {lead.businessAddress && (
            <p className={styles.heroAddress}>{lead.businessAddress}</p>
          )}

          <div className={styles.heroDetails}>
            {lead.rating !== null && (
              <span className={styles.heroRating}>
                ★ {lead.rating.toFixed(1)} ({lead.reviewCount ?? 0} reviews)
              </span>
            )}
            {lead.businessPhone && (
              <a href={`tel:${lead.businessPhone}`} className={styles.heroLink}>
                {lead.businessPhone}
              </a>
            )}
            {lead.businessWebsite && (
              <a
                href={lead.businessWebsite}
                target='_blank'
                rel='noopener noreferrer'
                className={styles.heroLink}
              >
                {lead.businessWebsite.replace(/^https?:\/\//, "")} ↗
              </a>
            )}
          </div>
        </section>

        {/* Distance */}
        {lead.distanceMiles !== null && lead.primaryMarket && (
          <section className={styles.distanceCard}>
            <p className={styles.distanceValue}>
              {lead.distanceMiles.toFixed(1)} miles
            </p>
            <p className={styles.distanceDesc}>
              from your base in {lead.primaryMarket}
              {lead.serviceRadiusMiles &&
              lead.distanceMiles > lead.serviceRadiusMiles
                ? ` — outside your ${lead.serviceRadiusMiles}-mile service radius`
                : lead.serviceRadiusMiles
                  ? ` — within your ${lead.serviceRadiusMiles}-mile service radius`
                  : ""}
            </p>
          </section>
        )}

        {/* Strategic Brief */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Strategic Brief</h2>
            {lead.strategicBrief && (
              <button
                type='button'
                onClick={() => generate("strategic-brief", setGeneratingBrief)}
                disabled={generatingBrief}
                className={styles.regenerateBtn}
              >
                {generatingBrief ? "Regenerating..." : "Regenerate"}
              </button>
            )}
          </div>
          {lead.strategicBrief ? (
            <div className={styles.briefBody}>
              {lead.strategicBrief.split("\n\n").map((para, i) => (
                <p key={i} className={styles.briefParagraph}>
                  {para}
                </p>
              ))}
            </div>
          ) : (
            <div className={styles.emptyBlock}>
              <p className={styles.emptyDesc}>
                Generate a strategic brief — Claude analyzes this prospect and
                writes a memo on how to position your transportation service,
                what pain points to lead with, and who to contact.
              </p>
              <button
                type='button'
                onClick={() => generate("strategic-brief", setGeneratingBrief)}
                disabled={generatingBrief}
                className={styles.generateBtn}
              >
                {generatingBrief
                  ? "Generating..."
                  : "✨ Generate strategic brief"}
              </button>
            </div>
          )}
        </section>

        {/* Review Intelligence */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Review Intelligence</h2>
            {lead.reviewIntelligence && (
              <button
                type='button'
                onClick={() =>
                  generate("review-intelligence", setGeneratingReviews)
                }
                disabled={generatingReviews}
                className={styles.regenerateBtn}
              >
                {generatingReviews ? "Regenerating..." : "Regenerate"}
              </button>
            )}
          </div>
          {lead.reviewIntelligence ? (
            <div className={styles.reviewBody}>
              {lead.reviewIntelligence.split("\n\n").map((para, i) => (
                <p key={i} className={styles.briefParagraph}>
                  {para}
                </p>
              ))}
            </div>
          ) : (
            <div className={styles.emptyBlock}>
              <p className={styles.emptyDesc}>
                Pull recent reviews from Google and let Claude extract themes —
                what customers love, complain about, and any transportation pain
                points worth pitching.
              </p>
              <button
                type='button'
                onClick={() =>
                  generate("review-intelligence", setGeneratingReviews)
                }
                disabled={generatingReviews}
                className={styles.generateBtn}
              >
                {generatingReviews ? "Analyzing..." : "✨ Analyze reviews"}
              </button>
            </div>
          )}
        </section>

        {/* Decision Maker Hypothesis */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Who to Contact</h2>
            {lead.decisionMaker && (
              <button
                type='button'
                onClick={() => generate("decision-maker", setGeneratingDM)}
                disabled={generatingDM}
                className={styles.regenerateBtn}
              >
                {generatingDM ? "Regenerating..." : "Regenerate"}
              </button>
            )}
          </div>
          {lead.decisionMaker ? (
            <div className={styles.dmBody}>
              <div className={styles.dmRow}>
                <p className={styles.dmLabel}>Primary target</p>
                <p className={styles.dmTitle}>
                  {lead.decisionMaker.primary.title}
                </p>
                <p className={styles.dmWhy}>{lead.decisionMaker.primary.why}</p>
              </div>
              <div className={styles.dmRow}>
                <p className={styles.dmLabel}>Fallback contact</p>
                <p className={styles.dmTitle}>
                  {lead.decisionMaker.secondary.title}
                </p>
                <p className={styles.dmWhy}>
                  {lead.decisionMaker.secondary.why}
                </p>
              </div>
              <div className={styles.dmRow}>
                <p className={styles.dmLabel}>LinkedIn search</p>
                <a
                  href={`https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(lead.decisionMaker.linkedinSearch)}`}
                  target='_blank'
                  rel='noopener noreferrer'
                  className={styles.dmLink}
                >
                  Search: {lead.decisionMaker.linkedinSearch} ↗
                </a>
              </div>
            </div>
          ) : (
            <div className={styles.emptyBlock}>
              <p className={styles.emptyDesc}>
                Identify the right titles to contact at this business plus a
                LinkedIn search query you can use to find them by name.
              </p>
              <button
                type='button'
                onClick={() => generate("decision-maker", setGeneratingDM)}
                disabled={generatingDM}
                className={styles.generateBtn}
              >
                {generatingDM ? "Analyzing..." : "✨ Identify decision-makers"}
              </button>
            </div>
          )}
        </section>

        {/* Outreach Scripts */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Outreach Scripts</h2>
            {lead.outreachScripts.length > 0 && (
              <button
                type='button'
                onClick={() =>
                  generate("generate-scripts", setGeneratingScripts)
                }
                disabled={generatingScripts}
                className={styles.regenerateBtn}
              >
                {generatingScripts ? "Regenerating..." : "Regenerate"}
              </button>
            )}
          </div>
          {lead.outreachScripts.length > 0 ? (
            <div className={styles.scriptsList}>
              {lead.outreachScripts.map((script) => (
                <div key={script.id} className={styles.scriptCard}>
                  <div className={styles.scriptHeader}>
                    <span className={styles.scriptFormat}>
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
                      className={styles.copyBtn}
                    >
                      {copiedId === script.id ? "Copied ✓" : "Copy"}
                    </button>
                  </div>
                  {script.subject && (
                    <p className={styles.scriptSubject}>
                      <strong>Subject:</strong> {script.subject}
                    </p>
                  )}
                  <p className={styles.scriptBody}>{script.body}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.emptyBlock}>
              <p className={styles.emptyDesc}>
                Generate personalized outreach scripts — email, cold call
                opener, and LinkedIn DM — written specifically for this
                prospect.
              </p>
              <button
                type='button'
                onClick={() =>
                  generate("generate-scripts", setGeneratingScripts)
                }
                disabled={generatingScripts}
                className={styles.generateBtn}
              >
                {generatingScripts
                  ? "Generating..."
                  : "✨ Generate outreach scripts"}
              </button>
            </div>
          )}
        </section>

        {/* Activity Timeline */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Activity Timeline</h2>
          <div className={styles.timeline}>
            {lead.activities.length === 0 ? (
              <p className={styles.timelineEmpty}>No activity yet.</p>
            ) : (
              lead.activities.map((activity) => (
                <div key={activity.id} className={styles.timelineItem}>
                  <p className={styles.timelineDate}>
                    {formatActivityDate(activity.createdAt)}
                  </p>
                  <p className={styles.timelineDesc}>
                    {activity.description ?? activity.activityType}
                  </p>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      {/* Quick Actions Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarSticky}>
          <h3 className={styles.sidebarTitle}>Quick Actions</h3>

          <div className={styles.sidebarGroup}>
            <label className={styles.sidebarLabel}>Status</label>
            <select
              value={lead.status}
              disabled={statusUpdating}
              onChange={(e) => updateStatus(e.target.value as LeadStatus)}
              className={styles.statusSelect}
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
              className={styles.sidebarBtn}
            >
              Mark contacted
            </button>
          )}

          <div className={styles.sidebarGroup}>
            <label className={styles.sidebarLabel}>Snooze until</label>
            <input
              type='date'
              value={snoozeDate}
              onChange={(e) => setSnoozeDate(e.target.value)}
              className={styles.dateInput}
            />
            <button
              type='button'
              onClick={snoozeLead}
              disabled={statusUpdating || !snoozeDate}
              className={styles.sidebarBtn}
            >
              Snooze
            </button>
          </div>

          {mailtoUrl && (
            <a href={mailtoUrl} className={styles.sidebarBtnPrimary}>
              📧 Open in mail app
            </a>
          )}

          {lead.lastContactedAt && (
            <p className={styles.sidebarMeta}>
              Last contacted{" "}
              {new Date(lead.lastContactedAt).toLocaleDateString()}
            </p>
          )}
        </div>
      </aside>
    </div>
  );
}