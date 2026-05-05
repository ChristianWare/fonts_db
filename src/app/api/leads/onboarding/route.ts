import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../../auth";
import { db } from "@/lib/db";

export const runtime = "nodejs";

type Body = {
  primaryCity?: string;
  primaryState?: string;
  serviceRadiusMiles?: number;
  phoneNumber?: string;
  smsEnabled?: boolean;
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

  const city = body.primaryCity?.trim();
  const state = body.primaryState?.trim().toUpperCase();
  const radius = body.serviceRadiusMiles;
  const phone = body.phoneNumber?.trim();

  // Validation
  if (!city) {
    return NextResponse.json({ error: "City is required" }, { status: 400 });
  }
  if (!state || state.length !== 2) {
    return NextResponse.json(
      { error: "State must be a 2-letter abbreviation (e.g. AZ)" },
      { status: 400 },
    );
  }
  if (!radius || radius < 10 || radius > 150) {
    return NextResponse.json(
      { error: "Radius must be between 10 and 150 miles" },
      { status: 400 },
    );
  }
  if (!phone || phone.replace(/\D/g, "").length < 10) {
    return NextResponse.json(
      { error: "A valid phone number is required" },
      { status: 400 },
    );
  }

  // Upsert because admin users may not have a LeadsSettings row yet
  // (it's normally bootstrapped by checkout, but admins bypass that).
  await db.leadsSettings.upsert({
    where: { clientProfileId: profile.id },
    create: {
      clientProfileId: profile.id,
      primaryCity: city,
      primaryState: state,
      serviceRadiusMiles: radius,
      phoneNumber: phone,
      smsEnabled: body.smsEnabled ?? true,
      onboardingCompletedAt: new Date(),
    },
    update: {
      primaryCity: city,
      primaryState: state,
      serviceRadiusMiles: radius,
      phoneNumber: phone,
      smsEnabled: body.smsEnabled ?? true,
      onboardingCompletedAt: new Date(),
    },
  });

  return NextResponse.json({ success: true });
}
