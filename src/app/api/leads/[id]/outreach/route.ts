import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../../../auth";
import { db } from "../../../../../lib/db";
import type { LeadActivityType } from "@prisma/client";

export const runtime = "nodejs";

const VALID_CHANNELS = new Set([
  "EMAIL_SENT",
  "CALL_MADE",
  "LINKEDIN_SENT",
  "SMS_SENT",
  "IN_PERSON_VISIT",
]);

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const channel = typeof body.channel === "string" ? body.channel : "";
  const note = typeof body.note === "string" ? body.note.trim() : "";

  if (!VALID_CHANNELS.has(channel)) {
    return NextResponse.json({ error: "Invalid channel" }, { status: 400 });
  }

  const lead = await db.savedLead.findFirst({
    where: { id, clientProfile: { userId: session.user.id } },
    select: { id: true, clientProfileId: true, status: true },
  });
  if (!lead) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await db.$transaction([
    db.leadActivity.create({
      data: {
        savedLeadId: lead.id,
        clientProfileId: lead.clientProfileId,
        activityType: channel as LeadActivityType,
        description: note || null,
      },
    }),
    db.savedLead.update({
      where: { id: lead.id },
      data: {
        lastContactedAt: new Date(),
        ...(lead.status === "NEW" ? { status: "CONTACTED" as const } : {}),
      },
    }),
  ]);

  return NextResponse.json({ success: true });
}
