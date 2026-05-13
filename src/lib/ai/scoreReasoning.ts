import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface ScoreReasoningInput {
  eventName: string;
  description: string | null;
  category: string | null;
  aiCategory: string | null;
  isCorporate: boolean;
  tags: string[];
  ticketPriceMin: number | null;
  ticketPriceMax: number | null;
  expectedAttendance: number | null;
  organizerName: string | null;
  venueName: string | null;
  eventDate: Date;
  aiScore: number;
}

const SYSTEM_PROMPT = `You analyze events for a black car / limousine operator who is prospecting for transportation work. The operator already has an AI-generated lead-quality score (0-100) for each event. Your job is to explain why a specific score makes sense given the event's signals.

Reasoning principles:
- Reference SPECIFIC signals from the event data (attendance number, ticket price, corporate flag, category, time of day, organizer type, etc.)
- Acknowledge factors that pushed the score up AND any that limit it
- Be concrete and operator-relevant — focus on what the score implies about transportation demand
- Do NOT second-guess or revise the score; interpret it
- Plain prose, 2-3 sentences, no bullet points, no preamble, no markdown`;

export async function generateScoreReasoning(
  input: ScoreReasoningInput,
): Promise<string | null> {
  const eventTime = input.eventDate.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
  const eventDay = input.eventDate.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const priceLine =
    input.ticketPriceMin != null || input.ticketPriceMax != null
      ? `$${input.ticketPriceMin ?? "?"} - $${input.ticketPriceMax ?? "?"}`
      : "unknown";

  const attendanceLine =
    input.expectedAttendance != null
      ? input.expectedAttendance.toLocaleString()
      : "unknown";

  const tagsLine = input.tags.length > 0 ? input.tags.join(", ") : "none";

  const descriptionLine = input.description
    ? input.description.slice(0, 600)
    : "none";

  const userPrompt = `This event was scored ${input.aiScore}/100 for transportation lead quality. Explain why in 2-3 sentences.

EVENT:
- Name: ${input.eventName}
- When: ${eventDay} at ${eventTime}
- AI category: ${input.aiCategory ?? "uncategorized"}
- Corporate: ${input.isCorporate ? "yes" : "no"}
- Expected attendance: ${attendanceLine}
- Ticket price: ${priceLine}
- Organizer: ${input.organizerName ?? "unknown"}
- Venue: ${input.venueName ?? "unknown"}
- Tags: ${tagsLine}
- Description: ${descriptionLine}

Respond with ONLY the reasoning text. No labels, no bullets, no preamble.`;

  try {
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 400,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    });

    const block = response.content[0];
    if (!block || block.type !== "text") return null;

    const text = block.text.trim();
    return text.length > 0 ? text : null;
  } catch (err) {
    console.error("[scoreReasoning] generation failed:", err);
    return null;
  }
}
