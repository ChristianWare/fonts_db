import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../../auth";

export const runtime = "nodejs";

const API_KEY = process.env.GOOGLE_MAPS_SERVER_KEY;

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!API_KEY) {
    return NextResponse.json(
      { error: "Google Maps key not configured" },
      { status: 500 },
    );
  }

  const fromLat = parseFloat(req.nextUrl.searchParams.get("fromLat") ?? "");
  const fromLng = parseFloat(req.nextUrl.searchParams.get("fromLng") ?? "");
  const toLat = parseFloat(req.nextUrl.searchParams.get("toLat") ?? "");
  const toLng = parseFloat(req.nextUrl.searchParams.get("toLng") ?? "");

  if (
    !Number.isFinite(fromLat) ||
    !Number.isFinite(fromLng) ||
    !Number.isFinite(toLat) ||
    !Number.isFinite(toLng)
  ) {
    return NextResponse.json({ error: "Invalid coordinates" }, { status: 400 });
  }

  try {
    const res = await fetch(
      "https://routes.googleapis.com/directions/v2:computeRoutes",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": API_KEY,
          "X-Goog-FieldMask":
            "routes.duration,routes.distanceMeters,routes.staticDuration",
        },
        body: JSON.stringify({
          origin: {
            location: { latLng: { latitude: fromLat, longitude: fromLng } },
          },
          destination: {
            location: { latLng: { latitude: toLat, longitude: toLng } },
          },
          travelMode: "DRIVE",
          routingPreference: "TRAFFIC_AWARE",
        }),
      },
    );

    if (!res.ok) {
      console.error("Routes API error", res.status, await res.text());
      return NextResponse.json(
        { error: "Failed to compute drive time" },
        { status: 500 },
      );
    }

    const data = await res.json();
    const route = data.routes?.[0];
    if (!route) {
      return NextResponse.json({ error: "No route found" }, { status: 404 });
    }

    const parseSeconds = (s: string | undefined): number | null => {
      if (!s) return null;
      const m = s.match(/^(\d+)s$/);
      return m ? parseInt(m[1], 10) : null;
    };

    return NextResponse.json({
      driveTimeSeconds: parseSeconds(route.duration),
      driveTimeStaticSeconds: parseSeconds(route.staticDuration),
      distanceMeters: route.distanceMeters ?? null,
    });
  } catch (err) {
    console.error("Drive time error", err);
    return NextResponse.json(
      { error: "Failed to compute drive time" },
      { status: 500 },
    );
  }
}
