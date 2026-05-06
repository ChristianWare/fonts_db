import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { auth } from "../../../../../../auth";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const maxDuration = 30;

const MODEL = "claude-sonnet-4-6";

const SYSTEM_PROMPT = `You are a senior B2B sales strategist advising a luxury chauffeur and corporate transportation business owner. They've identified a potential prospect and need a strategic brief on how to approach them.

Write a 180-220 word strategic memo with these characteristics:
- Direct, intelligent, no fluff or generic advice
- Reference specific details from the prospect data
- Identify the most likely transportation pain points for this type of business
- Recommend the best angle to pitch (what to lead with)
- Suggest the right person/role to contact at this kind of business
- Note any signals that make this prospect particularly attractive or unattractive

Use 2-3 short paragraphs, separated by blank lines. Avoid bullet points and headers. Write like a smart consultant briefing a friend over coffee — confident but not arrogant. No markdown formatting, no preamble. Just the brief.`;

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

  const userMessage = `Prospect:
- Business name: ${lead.businessName ?? "Unknown"}
- Category: ${lead.category.replace(/_/g, " ")}
- Address: ${lead.businessAddress ?? "Unknown"}
- Google rating: ${lead.rating ? `${lead.rating}/5` : "No rating yet"}
- Number of reviews: ${lead.reviewCount ?? 0}
- Phone: ${lead.businessPhone ?? "N/A"}
- Website: ${lead.businessWebsite ?? "N/A"}

Write a strategic brief on how a luxury chauffeur/transportation operator should approach this prospect.`;

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
