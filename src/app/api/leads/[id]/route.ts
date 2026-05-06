import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../../auth";
import { db } from "@/lib/db";
import { LeadStatus, Prisma } from "@prisma/client";

export const runtime = "nodejs";

const VALID_STATUSES: LeadStatus[] = [
  "NEW",
  "CONTACTED",
  "NURTURING",
  "SNOOZED",
  "WON",
  "DEAD",
];

type Body = {
  status?: string;
  notes?: string;
  snoozeUntil?: string | null;
};

export async function PATCH(
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

  // Verify ownership before any update
  const lead = await db.savedLead.findUnique({
    where: { id },
    select: { id: true, clientProfileId: true, status: true },
  });
  if (!lead || lead.clientProfileId !== profile.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const data: Prisma.SavedLeadUpdateInput = {};
  let statusChanged = false;
  let newStatus: LeadStatus | null = null;

  if (body.status !== undefined) {
    const candidate = body.status as LeadStatus;
    if (!VALID_STATUSES.includes(candidate)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    if (candidate !== lead.status) {
      data.status = candidate;
      statusChanged = true;
      newStatus = candidate;

      // Side effects: stamp timestamps for state transitions
      if (candidate === "CONTACTED") {
        data.lastContactedAt = new Date();
      }
      if (candidate === "WON") {
        data.wonAt = new Date();
      }
    }
  }

  if (body.notes !== undefined) {
    data.notes = body.notes || null;
  }

  if (body.snoozeUntil !== undefined) {
    data.snoozeUntil = body.snoozeUntil ? new Date(body.snoozeUntil) : null;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ success: true, noop: true });
  }

  const updated = await db.savedLead.update({
    where: { id },
    data,
  });

  // Activity log — only for status changes (notes get noisy)
  if (statusChanged && newStatus) {
    await db.leadActivity.create({
      data: {
        savedLeadId: id,
        clientProfileId: profile.id,
        activityType: "STATUS_CHANGED",
        description: `Status changed from ${lead.status} to ${newStatus}`,
        metadata: { from: lead.status, to: newStatus },
      },
    });
  }

  return NextResponse.json({ success: true, lead: updated });
}
