import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { auth } from "../../../../../../auth";
import { db } from "@/lib/db";
import { fetchPlaceReviews } from "@/lib/googlePlaces";

export const runtime = "nodejs";
export const maxDuration = 30;

const MODEL = "claude-sonnet-4-6";

const SYSTEM_PROMPT = `You are a sales intelligence analyst. You're given recent customer reviews of a business, and your job is to extract patterns relevant to a luxury chauffeur and transportation operator who's considering this business as a potential client.

Identify:
1. What customers consistently love (the strengths)
2. What customers complain about (the friction points)
3. Whether transportation, parking, accessibility, or guest logistics come up in any way

Output 2-3 short paragraphs, separated by blank lines. No bullets, no headers, no markdown. Specifically call out anything related to transportation pain points — that's the wedge for the operator's pitch. If reviews are too sparse to draw conclusions, say so honestly.`;

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

  if (!lead.googlePlaceId) {
    return NextResponse.json(
      { error: "No Google Place ID — cannot fetch reviews" },
      { status: 400 },
    );
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY is not configured" },
      { status: 500 },
    );
  }

  const reviews = await fetchPlaceReviews(lead.googlePlaceId);
  if (!reviews || reviews.length === 0) {
    return NextResponse.json(
      { error: "No reviews available for this business" },
      { status: 400 },
    );
  }

  const reviewText = reviews
    .map(
      (r, i) =>
        `Review ${i + 1} (${r.rating}/5 from ${r.authorName}):\n${r.text}`,
    )
    .join("\n\n---\n\n");

  const userMessage = `Business: ${lead.businessName ?? "Unknown"} (${lead.category.replace(/_/g, " ")})

Recent reviews (${reviews.length} total):

${reviewText}

Analyze these reviews from the perspective of a luxury transportation operator looking for an angle to pitch this business.`;

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  let response;
  try {
    response = await client.messages.create({
      model: MODEL,
      max_tokens: 800,
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

  const intelligence = textBlock.text.trim();

  await db.savedLead.update({
    where: { id: lead.id },
    data: { reviewIntelligence: intelligence },
  });

  return NextResponse.json({
    success: true,
    intelligence,
    reviewCount: reviews.length,
  });
}
