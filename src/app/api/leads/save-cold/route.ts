import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../../auth";
import { db } from "@/lib/db";

export const runtime = "nodejs";

type Body = {
  placeId?: string;
  name?: string;
  address?: string;
  lat?: number;
  lng?: number;
  rating?: number | null;
  reviewCount?: number | null;
  phone?: string | null;
  website?: string | null;
  category?: string;
};

export async function POST(req: NextRequest) {
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

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (!body.placeId || !body.name) {
    return NextResponse.json(
      { error: "placeId and name are required" },
      { status: 400 },
    );
  }

  // Block duplicates per user — same place can be saved by different users
  const existing = await db.savedLead.findFirst({
    where: {
      clientProfileId: profile.id,
      googlePlaceId: body.placeId,
    },
  });
  if (existing) {
    return NextResponse.json(
      { error: "Already saved", id: existing.id },
      { status: 409 },
    );
  }

  const lead = await db.savedLead.create({
    data: {
      clientProfileId: profile.id,
      leadType: "COLD",
      source: "google_places",
      category: body.category ?? "uncategorized",
      businessName: body.name,
      businessAddress: body.address ?? null,
      businessLat: body.lat ?? null,
      businessLng: body.lng ?? null,
      businessPhone: body.phone ?? null,
      businessWebsite: body.website ?? null,
      googlePlaceId: body.placeId,
      rating: body.rating ?? null,
      reviewCount: body.reviewCount ?? null,
      status: "NEW",
    },
  });

  // Activity log
  await db.leadActivity.create({
    data: {
      savedLeadId: lead.id,
      clientProfileId: profile.id,
      activityType: "CREATED",
      description: `Saved cold lead: ${body.name}`,
    },
  });

  return NextResponse.json({ success: true, id: lead.id });
}
