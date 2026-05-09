export type WarmEventSignalData = {
  eventbriteId: string;
  eventName: string;
  eventDate: string;
  venueName: string | null;
  venueAddress: string | null;
  ticketPriceMin: string | null;
  ticketPriceMax: string | null;
  expectedAttendance: number | null;
  organizerName: string | null;
  category: string | null;
};

export function parseWarmSignalData(json: unknown): WarmEventSignalData | null {
  if (!json || typeof json !== "object") return null;
  const obj = json as Record<string, unknown>;
  if (typeof obj.eventbriteId !== "string") return null;
  if (typeof obj.eventName !== "string") return null;
  if (typeof obj.eventDate !== "string") return null;
  return {
    eventbriteId: obj.eventbriteId,
    eventName: obj.eventName,
    eventDate: obj.eventDate,
    venueName: typeof obj.venueName === "string" ? obj.venueName : null,
    venueAddress:
      typeof obj.venueAddress === "string" ? obj.venueAddress : null,
    ticketPriceMin:
      typeof obj.ticketPriceMin === "string" ? obj.ticketPriceMin : null,
    ticketPriceMax:
      typeof obj.ticketPriceMax === "string" ? obj.ticketPriceMax : null,
    expectedAttendance:
      typeof obj.expectedAttendance === "number"
        ? obj.expectedAttendance
        : null,
    organizerName:
      typeof obj.organizerName === "string" ? obj.organizerName : null,
    category: typeof obj.category === "string" ? obj.category : null,
  };
}

function formatPriceRange(min: string | null, max: string | null): string {
  const minNum = min ? parseFloat(min) : null;
  const maxNum = max ? parseFloat(max) : null;
  if (minNum === 0 && maxNum === 0) return "Free";
  if (minNum != null && maxNum != null && minNum !== maxNum) {
    return `$${minNum.toFixed(0)}–$${maxNum.toFixed(0)}`;
  }
  if (minNum != null) return `$${minNum.toFixed(0)}`;
  if (maxNum != null) return `$${maxNum.toFixed(0)}`;
  return "Unknown";
}

function daysUntil(iso: string): number {
  return Math.floor(
    (new Date(iso).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
  );
}

/**
 * Builds a multi-line "Event:..." block to insert into a user message.
 * Used by all warm AI route prompts.
 */
export function buildEventContextBlock(event: WarmEventSignalData): string {
  const eventDateLong = new Date(event.eventDate).toLocaleDateString(
    undefined,
    {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    },
  );
  const days = daysUntil(event.eventDate);
  const daysStr =
    days < 0
      ? `${Math.abs(days)} days ago`
      : days === 0
        ? "today"
        : `${days} days from today`;

  return [
    `Event: ${event.eventName}`,
    `Date: ${eventDateLong} (${daysStr})`,
    `Venue: ${event.venueName ?? "Unknown"}`,
    `Address: ${event.venueAddress ?? "Unknown"}`,
    `Organizer: ${event.organizerName ?? "Unknown"}`,
    `Category: ${event.category ?? "Event"}`,
    `Ticket price: ${formatPriceRange(event.ticketPriceMin, event.ticketPriceMax)}`,
    `Expected attendance: ${event.expectedAttendance ?? "Unknown"}`,
  ].join("\n");
}

// =============================================================================
// SYSTEM PROMPTS
// =============================================================================

export const STRATEGIC_BRIEF_SYSTEM = `You are a senior B2B sales strategist advising a luxury chauffeur and corporate transportation business owner. They've identified an upcoming event as a lead — the event organizer is the prospect they want to win.

Write a 180-220 word strategic memo on how to approach this event. The memo should:
- Be direct, intelligent, no fluff or generic advice
- Reference specific details from the event data (date, venue, scale, type, ticket pricing)
- Identify the most likely transportation needs for THIS event (VIP/sponsor pickup, hotel-to-venue shuttles, late-night safe rides, keynote/honoree transport, attendee circulation)
- Recommend the best angle to lead the pitch with given the event's character
- Note timing — galas/conferences typically book transport 30-90 days out, smaller corporate events 14-45 days out
- Flag whether the operator should pitch the organizer directly or the venue, given the event characteristics

Use 2-3 short paragraphs, separated by blank lines. Avoid bullet points and headers. Write like a smart consultant briefing a friend over coffee — confident but not arrogant. No markdown formatting, no preamble. Just the brief.`;

export const DECISION_MAKER_SYSTEM = `You are a B2B sales strategist. Given an upcoming event and its organizer, identify the right people to contact when pitching luxury chauffeur and corporate transportation services.

For events, the right contact is almost always within the ORGANIZER's organization — not the venue. Common titles depending on org size and event scale: Events Manager, Director of Events, Sponsorship Manager, Operations Manager, Chief of Staff, Logistics Coordinator, Event Production Manager, Conference Director, Director of Programming.

Output a JSON object with this exact shape — no markdown, no preamble, just the object:

{
  "primary": { "title": "...", "why": "..." },
  "secondary": { "title": "...", "why": "..." },
  "linkedinSearch": "..."
}

Where:
- primary.title: the single best title to target first for THIS event
- primary.why: one sentence on why this title is the right contact for this event scale and type
- secondary.title: the fallback title if primary is unreachable
- secondary.why: one sentence
- linkedinSearch: a literal LinkedIn search query, formatted like: "Events Manager" "{organizerName}" {city}

Be specific to this event and organizer. No generic advice.`;

export const APOLLO_DOMAIN_GUESS_SYSTEM = `You are an internet research expert. Given an event organizer's name, guess up to 3 likely domain names for their official website.

Output ONLY a JSON array of domain strings (no protocol, no www, no markdown, no preamble):
["domain1.com", "domain2.com", "domain3.com"]

Be conservative — only include domains you have moderate confidence in. Return [] if unsure or if the name is too generic.

If the organizer name contains generic words like "Events", "Productions", "Group", "Inc", "LLC", try variations with and without those words. Common patterns: lowercase the name, drop spaces, drop generic words.

Examples:
Input: "LimeLife by Alcone" → ["limelifebyalcone.com", "limelife.com", "alcone.com"]
Input: "Make-A-Wish Arizona" → ["arizona.wish.org", "wish.org"]
Input: "John Smith Events" → ["johnsmithevents.com", "johnsmith.com"]
Input: "Phoenix" → []`;

export const OUTREACH_SCRIPTS_SYSTEM = `You are an expert B2B sales copywriter for luxury chauffeur and corporate transportation services. Generate 3 outreach script variants for reaching out to an event organizer about transportation needs for a specific upcoming event.

Output a JSON object with this exact shape — no markdown, no preamble, just the object:

{
  "email": { "subject": "...", "body": "..." },
  "call": { "subject": null, "body": "..." },
  "linkedin": { "subject": null, "body": "..." }
}

Each script must:
- Reference the specific event by name and date
- Mention a concrete transportation pitch angle suited to the event scale (VIP/sponsor pickup for galas, hotel shuttle for conferences, late-night safe rides for nighttime events, keynote transport for conferences with featured speakers)
- Be brief and conversational — sound like the operator wrote it themselves, not a corporate template
- Include a clear call to action
- Be professional but warm — these are humans booking transport, not buyers

Specific format requirements:
- email.subject: under 60 characters, intriguing not spammy
- email.body: 100-150 words, plain text with line breaks for readability
- call.body: 60-80 word voicemail/cold call opener, conversational, easy to read aloud, ends with a callback prompt
- linkedin.body: under 300 characters (LinkedIn DM limit), more casual, friendly tone

Set "subject" to null for everything except email.`;
