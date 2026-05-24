import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { auth } from "../../../../../../auth";
import { db } from "@/lib/db";
import { getHotelTier } from "@/lib/leadPriority";

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

function buildCategoryStrategyNote(
  category: string,
  businessName: string | null,
): string | null {
  const cat = category.toLowerCase().replace(/\s+/g, "_");

  if (cat === "hotels" || cat === "resort_spas") {
    const tier = getHotelTier(businessName);
    switch (tier) {
      case "independent_luxury":
        return "Strategic note: This appears to be an independent luxury property. Local decision-making, no corporate procurement to navigate. Best contacts: concierge for guest referrals, catering/sales director for events and wedding business.";
      case "boutique_luxury_chain":
        return "Strategic note: This is a smaller luxury chain property. These brands typically grant local properties more procurement autonomy than the big four. Catering/sales director and concierge are both viable doors.";
      case "resort":
        return "Strategic note: This is a resort property. Wedding and event business is hyper-local even within chain resorts. Lead with the catering or wedding sales director, not the GM. Concierge relationships also drive guest referrals.";
      case "big_chain_luxury":
        return "Strategic note: This is a major chain luxury brand (Ritz-Carlton, Four Seasons, JW Marriott class). National procurement contract likely already in place with a national vendor. Don't pitch contract; pitch concierge relationships for guest referrals and overflow business when their primary vendor is at capacity.";
      case "big_chain_urban":
        return "Strategic note: This is a major chain urban business hotel. National procurement and corporate vendor lock are likely. Lowest-priority hotel pitch. If pursued, only viable angle is concierge-direct relationship for personal guest recommendations, not any kind of contract.";
      default:
        return "Strategic note: Hotel category. Best contacts are concierge for guest referrals and catering/sales director for event-related transportation. Watch for any existing transportation partner mentioned on their site.";
    }
  }

  if (cat === "casinos") {
    return "Strategic note: This is a casino property. The primary decision-maker is the VIP Host or Player Development Manager, who controls comp transportation budgets for high-roller guests. Secondary contact is Convention Sales Manager for group/event business. Pitch angle: discretion, vetted drivers who understand player privacy, and overflow/backup capacity when their primary vendor can't cover. Tribal casinos in regional markets often have less entrenched vendor relationships than Vegas Strip properties — easier door in.";
  }

  if (
    cat === "55+_communities" ||
    cat.includes("retirement") ||
    cat.includes("active_adult")
  ) {
    return "Strategic note: This is an active adult / 55+ community. Primary decision-maker is the Events Coordinator or Lifestyle Director, who books group transportation for community outings (theater trips, dinners, casino runs, holiday celebrations, seasonal excursions). Pitch angle: recurring group bookings, Sprinter/minibus capability, single trusted vendor relationship for the whole community calendar. Don't pitch individual airport runs — that's a fragmented sale. Pitch the calendar.";
  }

  if (cat === "law_firms") {
    return "Strategic note: This is a law firm. Primary contacts are the Office Manager or Executive Assistant who handle partner travel and client logistics. Travel pattern: partners flying in for depositions, trials, client meetings, conferences. These clients don't price-shop on transportation — they need reliability and professionalism. Recurring revenue potential is high once you're on their list.";
  }

  if (cat === "country_clubs") {
    return "Strategic note: This is a country club. Best contact is the Membership Director or General Manager. Members fly in for tournaments and business golf — getting on the club's preferred vendor list captures every member's airport business at that club.";
  }

  if (cat === "funeral_homes") {
    return "Strategic note: This is a funeral home. They already own hearses — what they hire from a black car operator is family limousines for processions (stretch limo or executive Sprinter), SUVs for smaller family groups, and sedans for out-of-town family airport pickup. Best contact is the Funeral Director or General Manager. Tone matters: quiet, respectful, discretion-focused. Sedan-only operators should lead with airport family transfers, not procession service.";
  }

  if (cat === "wedding_venues" || cat === "event_venues") {
    return "Strategic note: Best contact is the Event Sales Coordinator or Director of Catering. Preferred vendor list is the goal — one venue listing puts you in front of every couple/host they book. Lead with reliability and brand-matching aesthetics, not price.";
  }

  return null;
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

  const lead = await db.savedLead.findUnique({ where: { id } });
  if (!lead || lead.clientProfileId !== profile.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (lead.strategicBrief && !force) {
    return NextResponse.json({
      success: true,
      brief: lead.strategicBrief,
      cached: true,
    });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY is not configured" },
      { status: 500 },
    );
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const strategyNote = buildCategoryStrategyNote(
    lead.category,
    lead.businessName,
  );

  const userMessage = `Prospect:
- Business name: ${lead.businessName ?? "Unknown"}
- Category: ${lead.category.replace(/_/g, " ")}
- Address: ${lead.businessAddress ?? "Unknown"}
- Google rating: ${lead.rating ? `${lead.rating}/5` : "No rating yet"}
- Number of reviews: ${lead.reviewCount ?? 0}
- Phone: ${lead.businessPhone ?? "N/A"}
- Website: ${lead.businessWebsite ?? "N/A"}
${strategyNote ? `\n${strategyNote}\n` : ""}
Write a strategic brief on how a luxury chauffeur/transportation operator should approach this prospect.${strategyNote ? " Incorporate the strategic note above where relevant — it reflects current thinking on this category." : ""}`;

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
