export type OutreachWindowStatus =
  | "early"
  | "on_time"
  | "approaching_late"
  | "urgent"
  | "too_late";

export type OutreachWindow = {
  status: OutreachWindowStatus;
  daysUntilEvent: number;
  optimalRangeStart: number;
  optimalRangeEnd: number;
  headline: string;
  recommendation: string;
};

const LARGE_EVENT_KEYWORDS = [
  "gala",
  "fundraiser",
  "summit",
  "conference",
  "convention",
  "ball",
  "auction",
  "annual",
  "benefit",
];

/**
 * Determines the optimal outreach window for a given event and returns
 * a status + human-readable recommendation.
 */
export function computeOutreachWindow(
  eventDateIso: string,
  category: string | null,
  eventName: string,
): OutreachWindow {
  const eventTime = new Date(eventDateIso).getTime();
  const now = Date.now();
  const daysUntilEvent = Math.floor((eventTime - now) / (1000 * 60 * 60 * 24));

  // Larger / formal events have longer planning lead times
  const haystack = `${eventName} ${category ?? ""}`.toLowerCase();
  const isLarge = LARGE_EVENT_KEYWORDS.some((k) => haystack.includes(k));

  const optimalMin = isLarge ? 45 : 21;
  const optimalMax = isLarge ? 90 : 60;

  if (daysUntilEvent < 0) {
    return {
      status: "too_late",
      daysUntilEvent,
      optimalRangeStart: optimalMin,
      optimalRangeEnd: optimalMax,
      headline: "Event has passed",
      recommendation:
        "Use this as relationship-building groundwork. If it's a recurring event, reach out about next year's planning.",
    };
  }
  if (daysUntilEvent < 7) {
    return {
      status: "urgent",
      daysUntilEvent,
      optimalRangeStart: optimalMin,
      optimalRangeEnd: optimalMax,
      headline: "Very late",
      recommendation:
        "Most organizers have booked transport by now. Worth a fast outreach only if you can quote within hours and beat their existing vendor on availability or price.",
    };
  }
  if (daysUntilEvent < optimalMin) {
    return {
      status: "approaching_late",
      daysUntilEvent,
      optimalRangeStart: optimalMin,
      optimalRangeEnd: optimalMax,
      headline: "Past the ideal window",
      recommendation: `Optimal outreach was ${optimalMin}–${optimalMax} days out. Still worth a touch — some organizers leave logistics late. Lead with a same-day quote.`,
    };
  }
  if (daysUntilEvent <= optimalMax) {
    return {
      status: "on_time",
      daysUntilEvent,
      optimalRangeStart: optimalMin,
      optimalRangeEnd: optimalMax,
      headline: "Sweet spot — reach out now",
      recommendation: `${optimalMin}–${optimalMax} days out is when organizers are scoping vendors but haven't locked in transportation yet. Best response rates land here.`,
    };
  }
  return {
    status: "early",
    daysUntilEvent,
    optimalRangeStart: optimalMin,
    optimalRangeEnd: optimalMax,
    headline: "Still early",
    recommendation: `Bookmark this lead and circle back in ${daysUntilEvent - optimalMax} days. Reaching out now risks getting forgotten before logistics planning starts.`,
  };
}
