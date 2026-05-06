import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../../../auth";

export const runtime = "nodejs";

const API_KEY = process.env.GOOGLE_MAPS_SERVER_KEY;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ placeId: string }> },
) {
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

  const { placeId } = await params;

  const fieldMask = [
    "id",
    "displayName",
    "formattedAddress",
    "location",
    "rating",
    "userRatingCount",
    "nationalPhoneNumber",
    "websiteUri",
    "types",
    "regularOpeningHours",
    "priceLevel",
    "businessStatus",
  ].join(",");

  try {
    const res = await fetch(
      `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`,
      {
        method: "GET",
        headers: {
          "X-Goog-Api-Key": API_KEY,
          "X-Goog-FieldMask": fieldMask,
        },
      },
    );

    if (!res.ok) {
      console.error("Place Details error", res.status, await res.text());
      return NextResponse.json(
        { error: "Failed to fetch place details" },
        { status: 500 },
      );
    }

    const data = await res.json();

    return NextResponse.json({
      placeId: data.id,
      name: data.displayName?.text ?? "",
      address: data.formattedAddress ?? "",
      coordinates: {
        lat: data.location?.latitude ?? 0,
        lng: data.location?.longitude ?? 0,
      },
      rating: data.rating ?? null,
      reviewCount: data.userRatingCount ?? null,
      phone: data.nationalPhoneNumber ?? null,
      website: data.websiteUri ?? null,
      types: data.types ?? [],
      hours: data.regularOpeningHours?.weekdayDescriptions ?? null,
      priceLevel: data.priceLevel ?? null,
      businessStatus: data.businessStatus ?? null,
    });
  } catch (err) {
    console.error("Place Details fetch failed", err);
    return NextResponse.json(
      { error: "Failed to fetch place details" },
      { status: 500 },
    );
  }
}
