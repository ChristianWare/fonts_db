import type { SavedLead, LeadActivity } from "@prisma/client";

export type NextMoveSuggestion = {
  headline: string;
  detail: string;
  priority: "urgent" | "due" | "wait" | "info";
  channel?: "EMAIL" | "PHONE" | "LINKEDIN" | "SMS" | "IN_PERSON";
  fromUser: boolean;
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const OUTREACH_TYPES = new Set([
  "EMAIL_SENT",
  "CALL_MADE",
  "LINKEDIN_SENT",
  "SMS_SENT",
  "IN_PERSON_VISIT",
  "CONTACTED",
]);

function daysSince(date: Date | null): number | null {
  if (!date) return null;
  return Math.floor((Date.now() - date.getTime()) / MS_PER_DAY);
}

function daysUntil(date: Date | null): number | null {
  if (!date) return null;
  return Math.floor((date.getTime() - Date.now()) / MS_PER_DAY);
}

export function computeNextMove(
  lead: SavedLead & { activities?: LeadActivity[] },
): NextMoveSuggestion {
  // 1. User-set next action — overrides everything
  if (lead.nextActionAt) {
    const days = daysUntil(lead.nextActionAt);
    if (days !== null && days < 0) {
      return {
        headline: `Overdue: ${lead.nextActionNote ?? "follow up"}`,
        detail: `You set this for ${lead.nextActionAt.toDateString()}.`,
        priority: "urgent",
        fromUser: true,
      };
    }
    if (days === 0) {
      return {
        headline: `Today: ${lead.nextActionNote ?? "follow up"}`,
        detail: "Action you set for today.",
        priority: "due",
        fromUser: true,
      };
    }
    return {
      headline: `In ${days} day${days === 1 ? "" : "s"}: ${lead.nextActionNote ?? "follow up"}`,
      detail: `Scheduled for ${lead.nextActionAt.toDateString()}.`,
      priority: "wait",
      fromUser: true,
    };
  }

  // 2. Terminal states
  if (lead.status === "WON") {
    return {
      headline: "Won — deliver the service.",
      detail: "This lead converted. No further outreach needed.",
      priority: "info",
      fromUser: false,
    };
  }

  if (lead.status === "DEAD") {
    return {
      headline: "Marked dead.",
      detail: "Move on or revisit in 6 months.",
      priority: "info",
      fromUser: false,
    };
  }

  // 3. Snoozed
  if (lead.status === "SNOOZED" && lead.snoozeUntil) {
    const days = daysUntil(lead.snoozeUntil);
    if (days === null || days < 0) {
      return {
        headline: "Snooze period ended — re-engage.",
        detail: `Snoozed until ${lead.snoozeUntil.toDateString()}, now overdue.`,
        priority: "urgent",
        fromUser: false,
      };
    }
    return {
      headline: `Snoozed for ${days} more day${days === 1 ? "" : "s"}.`,
      detail: `Auto-resumes ${lead.snoozeUntil.toDateString()}.`,
      priority: "wait",
      fromUser: false,
    };
  }

  // 4. Outreach-history-based logic
  const outreach = (lead.activities ?? [])
    .filter((a) => OUTREACH_TYPES.has(a.activityType))
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  const last = outreach[0];

  if (!last) {
    return {
      headline: "Send the first email.",
      detail:
        "Strategic brief and outreach scripts are ready. Personalize the email script and send today.",
      priority: "due",
      channel: "EMAIL",
      fromUser: false,
    };
  }

  const daysAgo = daysSince(last.createdAt) ?? 0;
  const lastChannel = last.activityType;

  if (daysAgo < 5) {
    return {
      headline: "Wait for response.",
      detail: `Last contact ${daysAgo} day${daysAgo === 1 ? "" : "s"} ago. Give it 5–7 days before next touch.`,
      priority: "wait",
      fromUser: false,
    };
  }

  if (daysAgo <= 14) {
    if (lastChannel === "EMAIL_SENT") {
      return {
        headline: "No reply — call them today.",
        detail: `Email sent ${daysAgo} days ago. Phone follow-up is the next move.`,
        priority: "due",
        channel: "PHONE",
        fromUser: false,
      };
    }
    if (lastChannel === "CALL_MADE") {
      return {
        headline: "No reply — try LinkedIn.",
        detail: `Call ${daysAgo} days ago. Try a LinkedIn message.`,
        priority: "due",
        channel: "LINKEDIN",
        fromUser: false,
      };
    }
    if (lastChannel === "LINKEDIN_SENT") {
      return {
        headline: "No reply — send a fresh email with a new angle.",
        detail: `LinkedIn ${daysAgo} days ago. Try email referencing something new.`,
        priority: "due",
        channel: "EMAIL",
        fromUser: false,
      };
    }
    return {
      headline: "Follow up via a different channel.",
      detail: `Last touch was ${daysAgo} days ago. Time for the next move.`,
      priority: "due",
      fromUser: false,
    };
  }

  if (daysAgo <= 30) {
    return {
      headline: "Re-engage with a new angle.",
      detail: `${daysAgo} days since last touch. Send something fresh — seasonal hook, new event, milestone.`,
      priority: "due",
      channel: "EMAIL",
      fromUser: false,
    };
  }

  return {
    headline: "Long gap — consider moving to NURTURING or DEAD.",
    detail: `${daysAgo} days since last contact. Decide whether this is a long-game lead or to deprioritize.`,
    priority: "info",
    fromUser: false,
  };
}

export function countOutreachAttempts(activities: LeadActivity[]): number {
  return activities.filter((a) => OUTREACH_TYPES.has(a.activityType)).length;
}

export function daysSinceLastContact(
  activities: LeadActivity[],
): number | null {
  const outreach = activities
    .filter((a) => OUTREACH_TYPES.has(a.activityType))
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  return outreach[0] ? daysSince(outreach[0].createdAt) : null;
}
