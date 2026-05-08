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
  isFavorite?: boolean;
  isDraft?: boolean;
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

  const lead = await db.savedLead.findUnique({
    where: { id },
    select: {
      id: true,
      clientProfileId: true,
      status: true,
      isDraft: true,
      businessName: true,
    },
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
  let promotedFromDraft = false;

  if (body.status !== undefined) {
    const candidate = body.status as LeadStatus;
    if (!VALID_STATUSES.includes(candidate)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    if (candidate !== lead.status) {
      data.status = candidate;
      statusChanged = true;
      newStatus = candidate;
      if (candidate === "CONTACTED") data.lastContactedAt = new Date();
      if (candidate === "WON") data.wonAt = new Date();
    }
  }

  if (body.notes !== undefined) {
    data.notes = body.notes || null;
  }

  if (body.snoozeUntil !== undefined) {
    data.snoozeUntil = body.snoozeUntil ? new Date(body.snoozeUntil) : null;
  }

  if (body.isFavorite !== undefined) {
    data.isFavorite = body.isFavorite;
  }

  if (body.isDraft !== undefined && body.isDraft !== lead.isDraft) {
    data.isDraft = body.isDraft;
    if (lead.isDraft && body.isDraft === false) {
      promotedFromDraft = true;
    }
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ success: true, noop: true });
  }

  const updated = await db.savedLead.update({ where: { id }, data });

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

  if (promotedFromDraft) {
    await db.leadActivity.create({
      data: {
        savedLeadId: id,
        clientProfileId: profile.id,
        activityType: "CREATED",
        description: `Saved lead: ${lead.businessName ?? "Unnamed"}`,
      },
    });
  }

  return NextResponse.json({ success: true, lead: updated });
}

/**
 * DELETE — removes a lead atomically along with all its child records
 * (outreach scripts, activities). Wrapped in a transaction so a partial
 * failure never leaves orphaned data behind.
 */
export async function DELETE(
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

  const lead = await db.savedLead.findUnique({
    where: { id },
    select: { id: true, clientProfileId: true, businessName: true },
  });
  if (!lead || lead.clientProfileId !== profile.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await db.$transaction([
    db.outreachScript.deleteMany({ where: { savedLeadId: id } }),
    db.leadActivity.deleteMany({ where: { savedLeadId: id } }),
    db.savedLead.delete({ where: { id } }),
  ]);

  return NextResponse.json({
    success: true,
    deleted: lead.businessName ?? "lead",
  });
}
