import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../../../../auth";
import { db } from "@/lib/db";
import { generateScoreReasoning } from "@/lib/ai/scoreReasoning";

const EVENTBRITE_ID_PATTERN = /\/e\/([^/?#]+)/;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: savedLeadId } = await params;

  // Auth
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Resolve client profile (matches your loader pattern)
  const profile = await db.clientProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!profile) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Load the SavedLead and verify ownership
  const lead = await db.savedLead.findUnique({
    where: { id: savedLeadId },
    select: {
      id: true,
      clientProfileId: true,
      source: true,
      sourceUrl: true,
    },
  });
  if (!lead || lead.clientProfileId !== profile.id) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }

  // Must be an Eventbrite-backed lead
  if (lead.source !== "eventbrite" || !lead.sourceUrl) {
    return NextResponse.json(
      { error: "Lead is not Eventbrite-backed" },
      { status: 400 },
    );
  }

  // Extract eventbriteId from sourceUrl
  // (sourceUrl format: https://www.eventbrite.com/e/{eventbriteId})
  const match = lead.sourceUrl.match(EVENTBRITE_ID_PATTERN);
  if (!match) {
    return NextResponse.json(
      { error: "Could not parse eventbriteId from sourceUrl" },
      { status: 400 },
    );
  }
  const eventbriteId = match[1];

  // Load the EventbriteEvent
  const event = await db.eventbriteEvent.findUnique({
    where: { eventbriteId },
  });
  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  const url = new URL(req.url);
  const force = url.searchParams.get("force") === "true";

  // Return cached reasoning if already generated and not forcing
  if (!force && event.aiScoreReasoning) {
    return NextResponse.json({ aiScoreReasoning: event.aiScoreReasoning });
  }

  if (event.aiScore == null) {
    return NextResponse.json(
      { error: "Event has no score yet — score must be generated first" },
      { status: 400 },
    );
  }

  // Generate
  const reasoning = await generateScoreReasoning({
    eventName: event.eventName,
    description: event.description,
    category: event.category,
    aiCategory: event.aiCategory,
    isCorporate: event.isCorporate,
    tags: event.tags,
    ticketPriceMin: event.ticketPriceMin ? Number(event.ticketPriceMin) : null,
    ticketPriceMax: event.ticketPriceMax ? Number(event.ticketPriceMax) : null,
    expectedAttendance: event.expectedAttendance,
    organizerName: event.organizerName,
    venueName: event.venueName,
    eventDate: event.eventDate,
    aiScore: event.aiScore,
  });

  if (!reasoning) {
    return NextResponse.json(
      { error: "Reasoning generation failed" },
      { status: 500 },
    );
  }

  // Persist on the EventbriteEvent (shared, so any operator who saves
  // this event sees the same reasoning — cache-friendly)
  await db.eventbriteEvent.update({
    where: { eventbriteId },
    data: { aiScoreReasoning: reasoning },
  });

  return NextResponse.json({ aiScoreReasoning: reasoning });
}
