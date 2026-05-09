import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { auth } from "../../../../../../../auth";
import { db } from "@/lib/db";
import {
  DECISION_MAKER_SYSTEM,
  buildEventContextBlock,
  parseWarmSignalData,
} from "@/lib/ai/warmAiPrompts";

export const runtime = "nodejs";
export const maxDuration = 30;

const MODEL = "claude-sonnet-4-6";

export async function POST(
  req: NextRequest,
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
  const url = new URL(req.url);
  const force = url.searchParams.get("force") === "true";

  const lead = await db.savedLead.findUnique({ where: { id } });
  if (!lead || lead.clientProfileId !== profile.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (lead.leadType !== "WARM") {
    return NextResponse.json(
      { error: "This route is for warm leads only" },
      { status: 400 },
    );
  }

  // Idempotent: return cached if valid JSON
  if (lead.decisionMakerHypothesis && !force) {
    try {
      const parsed = JSON.parse(lead.decisionMakerHypothesis);
      if (
        parsed.primary?.title &&
        parsed.secondary?.title &&
        parsed.linkedinSearch
      ) {
        return NextResponse.json({
          success: true,
          hypothesis: parsed,
          cached: true,
        });
      }
    } catch {
      // Fall through and regenerate
    }
  }

  const event = parseWarmSignalData(lead.signalData);
  if (!event) {
    return NextResponse.json(
      { error: "Lead is missing event data" },
      { status: 400 },
    );
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY is not configured" },
      { status: 500 },
    );
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const userMessage = `${buildEventContextBlock(event)}

Identify the right decision-makers within ${event.organizerName ?? "the organizer"} to target for a luxury transportation pitch tied to this event.`;

  let response;
  try {
    response = await client.messages.create({
      model: MODEL,
      max_tokens: 600,
      system: DECISION_MAKER_SYSTEM,
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
