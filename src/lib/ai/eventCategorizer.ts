// Categorize Eventbrite events into corporate/wedding/fundraiser/etc.
// Uses Claude Haiku 4.5 — cheap, fast, good enough for category sorting.

import Anthropic from "@anthropic-ai/sdk";

const MODEL = "claude-haiku-4-5-20251001";

export type EventAiCategory =
  | "corporate"
  | "wedding"
  | "fundraiser"
  | "social"
  | "professional"
  | "performing_arts"
  | "other";

export interface EventCategorization {
  category: EventAiCategory;
  isCorporate: boolean;
  reasoning: string;
}

const SYSTEM_PROMPT = `You classify events for a black car / luxury ground transportation B2B sales tool. Given an Eventbrite event, identify what kind of audience and organizer it has so the operator knows how to approach it.

Categories:
- "corporate" — Business conferences, B2B summits, networking events, trade shows, industry awards, leadership symposiums. Audience is professionals; organizer is typically a company or industry association.
- "wedding" — Weddings, receptions, wedding showers, wedding anniversaries.
- "fundraiser" — Galas, benefit dinners, charity auctions, donor events, nonprofit functions. Usually high-ticket, formal attire.
- "social" — Birthday parties, milestone celebrations, social mixers, casual gatherings.
- "professional" — Smaller professional events: continuing education, certifications, niche industry workshops.
- "performing_arts" — Concerts, theater, dance, comedy. LOW VALUE for ground transport — audience uses rideshare.
- "other" — Doesn't fit cleanly above.

Output ONLY a JSON object — no markdown, no preamble:

{
  "category": "<one of the above>",
  "isCorporate": boolean,
  "reasoning": "<one short sentence>"
}

isCorporate is TRUE only when the event is clearly B2B/corporate. Weddings, fundraisers, social, and performing arts are NOT corporate. Set isCorporate to true only for "corporate" or unambiguously business-oriented "professional" events.`;

export async function categorizeEvent(input: {
  eventName: string;
  description: string | null;
  category: string | null;
  tags: string[];
  ticketPriceMin: number | null;
  ticketPriceMax: number | null;
}): Promise<EventCategorization | null> {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn("[eventCategorizer] ANTHROPIC_API_KEY not set");
    return null;
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const userMessage = [
    `Event name: ${input.eventName}`,
    input.description
      ? `Description: ${input.description.slice(0, 800)}`
      : null,
    input.category ? `Eventbrite category: ${input.category}` : null,
    input.tags.length > 0 ? `Tags: ${input.tags.join(", ")}` : null,
    input.ticketPriceMin !== null
      ? `Ticket price: $${input.ticketPriceMin}${
          input.ticketPriceMax !== input.ticketPriceMin
            ? `-$${input.ticketPriceMax}`
            : ""
        }`
      : null,
    "",
    "Classify this event.",
  ]
    .filter(Boolean)
    .join("\n");

  let response;
  try {
    response = await client.messages.create({
      model: MODEL,
      max_tokens: 300,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMessage }],
    });
  } catch (err) {
    console.error("[eventCategorizer] Anthropic call failed:", err);
    return null;
  }

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") return null;

  try {
    const cleaned = textBlock.text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned);

    if (typeof parsed.category !== "string") return null;
    if (typeof parsed.isCorporate !== "boolean") return null;

    const allowed: EventAiCategory[] = [
      "corporate",
      "wedding",
      "fundraiser",
      "social",
      "professional",
      "performing_arts",
      "other",
    ];
    if (!allowed.includes(parsed.category as EventAiCategory)) return null;

    return {
      category: parsed.category as EventAiCategory,
      isCorporate: parsed.isCorporate,
      reasoning: typeof parsed.reasoning === "string" ? parsed.reasoning : "",
    };
  } catch (err) {
    console.error(
      "[eventCategorizer] failed to parse response:",
      err,
      textBlock.text.slice(0, 300),
    );
    return null;
  }
}
