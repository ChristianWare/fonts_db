import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { auth } from "../../../../../../../auth";
import { db } from "@/lib/db";
import {
  STRATEGIC_BRIEF_SYSTEM,
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

  // Idempotent
  if (lead.strategicBrief && !force) {
    return NextResponse.json({
      success: true,
      brief: lead.strategicBrief,
      cached: true,
    });
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

Write a strategic brief on how a luxury chauffeur/transportation operator should approach this event lead.`;

  let response;
  try {
    response = await client.messages.create({
      model: MODEL,
      max_tokens: 600,
      system: STRATEGIC_BRIEF_SYSTEM,
      messages: [{ role: "user", content: userMessage }],
    });
  } catch (err) {
    console.error("Anthropic API error", err);
    return NextResponse.json(
      { error: "Brief generation failed. Try again." },
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

  const brief = textBlock.text.trim();

  await db.savedLead.update({
    where: { id: lead.id },
    data: { strategicBrief: brief },
  });

  return NextResponse.json({ success: true, brief });
}
