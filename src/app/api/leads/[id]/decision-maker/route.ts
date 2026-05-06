import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { auth } from "../../../../../../auth";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const maxDuration = 30;

const MODEL = "claude-sonnet-4-6";

const SYSTEM_PROMPT = `You are a B2B sales strategist. Given a business category, you identify the right decision-makers to contact when pitching luxury chauffeur and corporate transportation services.

Output a JSON object with this exact shape — no markdown, no preamble, just the object:

{
  "primary": { "title": "...", "why": "..." },
  "secondary": { "title": "...", "why": "..." },
  "linkedinSearch": "..."
}

Where:
- primary.title: the single best title to target first (e.g. "Events Coordinator")
- primary.why: one sentence on why they're the right contact
- secondary.title: the fallback title if primary is unreachable
- secondary.why: one sentence
- linkedinSearch: a literal LinkedIn search query string the user can paste, formatted like: "Events Coordinator" "Boojum Tree Hidden Gardens" Phoenix

Be specific to the business category and location. No generic advice.`;

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await db.clientProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!profile) {
    return NextResponse.json({ error: "No profile" }, { status: 404 });
  }

  const { id } = await params;
  const lead = await db.savedLead.findUnique({ where: { id } });
  if (!lead || lead.clientProfileId !== profile.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY is not configured" },
      { status: 500 },
    );
  }

  const userMessage = `Business: ${lead.businessName ?? "Unknown"}
Category: ${lead.category.replace(/_/g, " ")}
Location: ${lead.businessAddress ?? "Unknown"}

Identify the right decision-makers to target for a luxury transportation pitch.`;

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  let response;
  try {
    response = await client.messages.create({
      model: MODEL,
      max_tokens: 600,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMessage }],
    });
  } catch (err) {
    console.error("Anthropic API error", err);
    return NextResponse.json(
      { error: "AI generation failed. Try again." },
      { status: 500 },
    );
  }

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    return NextResponse.json(
      { error: "Unexpected AI response shape" },
      { status: 500 },
    );
  }

  // Validate JSON shape before storing
  try {
    const cleaned = textBlock.text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned);
    if (
      !parsed.primary?.title ||
      !parsed.secondary?.title ||
      !parsed.linkedinSearch
    ) {
      throw new Error("Missing required fields");
    }
    // Store the cleaned JSON string
    await db.savedLead.update({
      where: { id: lead.id },
      data: { decisionMakerHypothesis: cleaned },
    });
    return NextResponse.json({ success: true, hypothesis: parsed });
  } catch (err) {
    console.error(
      "Failed to parse decision-maker response",
      err,
      textBlock.text,
    );
    return NextResponse.json(
      { error: "AI response was not valid JSON" },
      { status: 500 },
    );
  }
}
