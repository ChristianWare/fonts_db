import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { auth } from "../../../../../../auth";
import { db } from "@/lib/db";
import { ScriptFormat } from "@prisma/client";

export const runtime = "nodejs";
export const maxDuration = 30;

const MODEL = "claude-sonnet-4-6";

const SYSTEM_PROMPT = `You are an expert B2B sales coach helping a luxury chauffeur and corporate transportation business owner write outreach to potential clients (event venues, hotels, law firms, country clubs, etc.).

Your tone is warm, professional, and direct — never spammy, pushy, or salesy. You write like a real person, not a marketing template.

You always generate three formats based on a single prospect:

1. EMAIL — subject line (max 8 words) + body (max 120 words). Reference specific details about the prospect when possible. Do NOT open with "I hope this email finds you well" or any equivalent. End with a clear, low-friction ask.

2. COLD_CALL — 50-70 word opener for the first 30 seconds of a phone call. Conversational, not scripted-sounding. Acknowledge that you're calling cold. Offer a clear reason to keep talking.

3. LINKEDIN_DM — max 60 words. Casual but professional. Skip the "Hope you're well!" opener. Get to the point.

Output as raw JSON only. No markdown fences, no commentary, just the object:

{
  "email": { "subject": "...", "body": "..." },
  "cold_call": "...",
  "linkedin_dm": "..."
}`;

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

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const userMessage = `Prospect details:
- Business name: ${lead.businessName ?? "Unknown"}
- Category: ${lead.category.replace(/_/g, " ")}
- Address: ${lead.businessAddress ?? "Unknown"}
- Rating: ${
    lead.rating
      ? `${lead.rating}/5 (${lead.reviewCount ?? 0} reviews)`
      : "No ratings yet"
  }
- Phone: ${lead.businessPhone ?? "N/A"}
- Website: ${lead.businessWebsite ?? "N/A"}

Generate outreach scripts for a luxury chauffeur and transportation business approaching this prospect about partnering for their client transportation needs.`;

  let response;
  try {
    response = await client.messages.create({
      model: MODEL,
      max_tokens: 1500,
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

  // Parse JSON — strip any markdown fences just in case
  let parsed: {
    email?: { subject?: string; body?: string };
    cold_call?: string;
    linkedin_dm?: string;
  };
  try {
    const cleaned = textBlock.text.replace(/```json|```/g, "").trim();
    parsed = JSON.parse(cleaned);
  } catch {
    console.error("Failed to parse AI response", textBlock.text);
    return NextResponse.json(
      { error: "AI response was not valid JSON" },
      { status: 500 },
    );
  }

  // Regeneration replaces existing scripts, doesn't append
  await db.outreachScript.deleteMany({ where: { savedLeadId: lead.id } });

  const records: Array<{
    savedLeadId: string;
    clientProfileId: string;
    format: ScriptFormat;
    subject: string | null;
    body: string;
  }> = [];

  if (parsed.email?.subject && parsed.email?.body) {
    records.push({
      savedLeadId: lead.id,
      clientProfileId: profile.id,
      format: "EMAIL",
      subject: parsed.email.subject,
      body: parsed.email.body,
    });
  }

  if (parsed.cold_call) {
    records.push({
      savedLeadId: lead.id,
      clientProfileId: profile.id,
      format: "CALL",
      subject: null,
      body: parsed.cold_call,
    });
  }

  if (parsed.linkedin_dm) {
    records.push({
      savedLeadId: lead.id,
      clientProfileId: profile.id,
      format: "LINKEDIN",
      subject: null,
      body: parsed.linkedin_dm,
    });
  }

  if (records.length === 0) {
    return NextResponse.json(
      { error: "AI returned no usable scripts" },
      { status: 500 },
    );
  }

  await db.outreachScript.createMany({ data: records });

  const scripts = await db.outreachScript.findMany({
    where: { savedLeadId: lead.id },
    orderBy: { format: "asc" },
  });

  return NextResponse.json({
    success: true,
    scripts: scripts.map((s) => ({
      ...s,
      generatedAt: s.generatedAt.toISOString(),
    })),
  });
}
