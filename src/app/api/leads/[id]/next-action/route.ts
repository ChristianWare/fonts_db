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
  const dateStr = typeof body.date === "string" ? body.date : null;
  const note = typeof body.note === "string" ? body.note.trim() : "";

  if (!dateStr) {
    return NextResponse.json({ error: "Date required" }, { status: 400 });
  }

  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }

  const lead = await db.savedLead.findFirst({
    where: { id, clientProfile: { userId: session.user.id } },
    select: { id: true },
  });
  if (!lead) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await db.savedLead.update({
    where: { id: lead.id },
    data: { nextActionAt: date, nextActionNote: note || null },
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const lead = await db.savedLead.findFirst({
    where: { id, clientProfile: { userId: session.user.id } },
    select: { id: true },
  });
  if (!lead) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await db.savedLead.update({
    where: { id: lead.id },
    data: { nextActionAt: null, nextActionNote: null },
  });

  return NextResponse.json({ success: true });
}
