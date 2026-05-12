import Anthropic from "@anthropic-ai/sdk";

const MODEL = "claude-haiku-4-5-20251001";

const CLASSIFIER_SYSTEM = `You are an expert at classifying social media posts. Determine if a post is a genuine request for ground transportation services (limo, black car, chauffeur, shuttle, party bus, etc.) and rate its quality and urgency.

Output ONLY a JSON object with this exact shape — no markdown, no preamble:

{
  "isTransportRequest": boolean,
  "tripType": "wedding" | "prom" | "airport" | "corporate" | "party" | "anniversary" | "concert" | "general" | "other",
  "urgency": "today" | "this_week" | "this_month" | "future" | "unknown",
  "groupSize": number | null,
  "specificDate": "YYYY-MM-DD" | null,
  "qualitySignals": string[],
  "redFlags": string[],
  "score": number
}

Scoring guide (0-100):
- 80-100: Specific date, specific group size, clear request, OP looks reachable, no red flags
- 60-79: Clear request but missing some specifics (no date OR no group size)
- 40-59: Vague request, generic timeline, low specificity
- 0-39: Not really a transport request, or major red flags

Red flags include:
- Asking about Uber/Lyft/rideshare specifically (not our market)
- Selling their own transportation service
- Asking price-shopping questions ("what's the cheapest...")
- Hypothetical questions ("if I were to need...")
- Promotional content disguised as a question
- Asking about being a driver, not a customer

If isTransportRequest is false, score should be 0.

Always include at least one entry in qualitySignals OR redFlags — short phrases describing what you saw.`;

export interface HotLeadClassification {
  isTransportRequest: boolean;
  tripType: string;
  urgency: string;
  groupSize: number | null;
  specificDate: string | null;
  qualitySignals: string[];
  redFlags: string[];
  score: number;
}

export async function classifyHotLead(
  postTitle: string | null,
  postBody: string,
): Promise<HotLeadClassification | null> {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error(
      "[hot lead classifier] ANTHROPIC_API_KEY not set — skipping classification",
    );
    return null;
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const userMessage = [
    postTitle ? `Title: ${postTitle}` : null,
    `Body: ${postBody}`,
    "",
    "Classify this post.",
  ]
    .filter(Boolean)
    .join("\n");

  let response;
  try {
    response = await client.messages.create({
      model: MODEL,
      max_tokens: 400,
      system: CLASSIFIER_SYSTEM,
      messages: [{ role: "user", content: userMessage }],
    });
  } catch (err) {
    console.error("[hot lead classifier] Anthropic call failed:", err);
    return null;
  }

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    console.error("[hot lead classifier] no text block in response");
    return null;
  }

  try {
    const cleaned = textBlock.text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned);

    // Defensive validation
    if (typeof parsed.isTransportRequest !== "boolean") return null;
    if (typeof parsed.score !== "number") return null;
    if (typeof parsed.tripType !== "string") return null;
    if (typeof parsed.urgency !== "string") return null;

    return {
      isTransportRequest: parsed.isTransportRequest,
      tripType: parsed.tripType,
      urgency: parsed.urgency,
      groupSize: typeof parsed.groupSize === "number" ? parsed.groupSize : null,
      specificDate:
        typeof parsed.specificDate === "string" ? parsed.specificDate : null,
      qualitySignals: Array.isArray(parsed.qualitySignals)
        ? parsed.qualitySignals.filter((x: unknown) => typeof x === "string")
        : [],
      redFlags: Array.isArray(parsed.redFlags)
        ? parsed.redFlags.filter((x: unknown) => typeof x === "string")
        : [],
      score: Math.max(0, Math.min(100, parsed.score)),
    };
  } catch (err) {
    console.error(
      "[hot lead classifier] failed to parse response:",
      err,
      textBlock.text.slice(0, 500),
    );
    return null;
  }
}
