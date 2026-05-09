import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { auth } from "../../../../../../../auth";
import { db } from "@/lib/db";
import {
  OUTREACH_SCRIPTS_SYSTEM,
  buildEventContextBlock,
  parseWarmSignalData,
} from "@/lib/ai/warmAiPrompts";

export const runtime = "nodejs";
export const maxDuration = 60;

const MODEL = "claude-sonnet-4-6";

type ParsedScripts = {
  email: { subject: string; body: string };
  call: { subject: null; body: string };
  linkedin: { subject: null; body: string };
};

function isParsedScripts(obj: unknown): obj is ParsedScripts {
  if (!obj || typeof obj !== "object") return false;
  const o = obj as Record<string, unknown>;
  const sections = ["email", "call", "linkedin"];
  for (const s of sections) {
    const block = o[s] as Record<string, unknown> | undefined;
    if (!block || typeof block !== "object") return false;
    if (typeof block.body !== "string" || block.body.length === 0) return false;
  }
  const email = o.email as { subject?: unknown };
  if (typeof email.subject !== "string") return false;
  return true;
}

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

  const lead = await db.savedLead.findUnique({
    where: { id },
    include: { outreachScripts: true },
  });
  if (!lead || lead.clientProfileId !== profile.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (lead.leadType !== "WARM") {
    return NextResponse.json(
      { error: "This route is for warm leads only" },
      { status: 400 },
    );
  }

  // Gate on saved leads only — don't burn AI credits on browsed drafts
  if (lead.isDraft) {
    return NextResponse.json(
      { error: "Save this lead before generating scripts" },
      { status: 400 },
    );
  }

  // Idempotent — return existing scripts unless ?force=true
  if (lead.outreachScripts.length > 0 && !force) {
    return NextResponse.json({
      success: true,
      cached: true,
      scripts: lead.outreachScripts.map((s) => ({
        id: s.id,
        format: s.format,
        subject: s.subject,
        body: s.body,
      })),
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

Generate the 3 outreach script variants for the operator to send to ${event.organizerName ?? "the organizer"}.`;

  let response;
  try {
    response = await client.messages.create({
      model: MODEL,
      max_tokens: 1500,
      system: OUTREACH_SCRIPTS_SYSTEM,
      messages: [{ role: "user", content: userMessage }],
    });
  } catch (err) {
    console.error("Anthropic API error", err);
    return NextResponse.json(
      { error: "Script generation failed. Try again." },
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

  let parsed: ParsedScripts;
  try {
    const cleaned = textBlock.text.replace(/```json|```/g, "").trim();
    const obj = JSON.parse(cleaned);
    if (!isParsedScripts(obj)) {
      throw new Error("Missing or malformed script fields");
    }
    parsed = obj;
  } catch (err) {
    console.error("Failed to parse scripts response", err, textBlock.text);
    return NextResponse.json(
      { error: "AI response was not valid JSON" },
      { status: 500 },
    );
  }

  // Replace existing scripts with regenerated versions
  await db.$transaction([
    db.outreachScript.deleteMany({ where: { savedLeadId: lead.id } }),
    db.outreachScript.createMany({
      data: [
        {
          savedLeadId: lead.id,
          clientProfileId: lead.clientProfileId,
          format: "EMAIL",
          subject: parsed.email.subject,
          body: parsed.email.body,
        },
        {
          savedLeadId: lead.id,
          clientProfileId: lead.clientProfileId,
          format: "CALL",
          subject: null,
          body: parsed.call.body,
        },
        {
          savedLeadId: lead.id,
          clientProfileId: lead.clientProfileId,
          format: "LINKEDIN",
          subject: null,
          body: parsed.linkedin.body,
        },
      ],
    }),
  ]);

  const scripts = await db.outreachScript.findMany({
    where: { savedLeadId: lead.id },
    orderBy: { format: "asc" },
  });

  return NextResponse.json({
    success: true,
    scripts: scripts.map((s) => ({
      id: s.id,
      format: s.format,
      subject: s.subject,
      body: s.body,
    })),
  });
}
