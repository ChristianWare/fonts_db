import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../../../auth";
import { db } from "../../../../../lib/db";

export const runtime = "nodejs";

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
  const text = typeof body.text === "string" ? body.text.trim() : "";

  if (!text) {
    return NextResponse.json({ error: "Note text required" }, { status: 400 });
  }

  const lead = await db.savedLead.findFirst({
    where: { id, clientProfile: { userId: session.user.id } },
    select: { id: true, clientProfileId: true },
  });
  if (!lead) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const activity = await db.leadActivity.create({
    data: {
      savedLeadId: lead.id,
      clientProfileId: lead.clientProfileId,
      activityType: "NOTE_ADDED",
      description: text,
    },
  });

  return NextResponse.json({ id: activity.id, createdAt: activity.createdAt });
}
