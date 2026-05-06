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
    "currentOpeningHours",
    "priceLevel",
    "priceRange",
    "businessStatus",
    "editorialSummary",
    "photos",
    "parkingOptions",
    "reservable",
    "goodForGroups",
    "outdoorSeating",
    "liveMusic",
    "allowsDogs",
    "goodForChildren",
    "servesCocktails",
    "servesWine",
    "servesBeer",
    "servesBreakfast",
    "servesBrunch",
    "servesLunch",
    "servesDinner",
    "takeout",
    "delivery",
    "dineIn",
    "curbsidePickup",
    "reviews",
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
      const errorBody = await res.text();
      console.error(
        "[place-details] Google API error",
        "status:",
        res.status,
        "body:",
        errorBody,
      );
      return NextResponse.json(
        {
          error: "Failed to fetch place details",
          googleStatus: res.status,
          googleError: errorBody,
        },
        { status: 500 },
      );
    }

    const data = await res.json();

    // Dev-only logging to confirm what Google actually returns
    if (process.env.NODE_ENV !== "production") {
      console.log(
        "[place-details] Got fields for",
        data.displayName?.text,
        "→",
        Object.keys(data).join(", "),
      );
    }

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
      hours:
        data.currentOpeningHours?.weekdayDescriptions ??
        data.regularOpeningHours?.weekdayDescriptions ??
        null,
      openNow:
        data.currentOpeningHours?.openNow ??
        data.regularOpeningHours?.openNow ??
        null,
      priceLevel: data.priceLevel ?? null,
      priceRange: data.priceRange
        ? {
            startPrice: data.priceRange.startPrice
              ? {
                  amount: parseFloat(data.priceRange.startPrice.units || "0"),
                  currency: data.priceRange.startPrice.currencyCode || "USD",
                }
              : null,
            endPrice: data.priceRange.endPrice
              ? {
                  amount: parseFloat(data.priceRange.endPrice.units || "0"),
                  currency: data.priceRange.endPrice.currencyCode || "USD",
                }
              : null,
          }
        : null,
      businessStatus: data.businessStatus ?? null,
      editorialSummary: data.editorialSummary?.text ?? null,
      photos: Array.isArray(data.photos)
        ? data.photos.map(
            (p: { name: string; widthPx?: number; heightPx?: number }) => ({
              name: p.name,
              widthPx: p.widthPx ?? 0,
              heightPx: p.heightPx ?? 0,
            }),
          )
        : null,
      parkingOptions: data.parkingOptions ?? null,
      reservable: data.reservable ?? null,
      goodForGroups: data.goodForGroups ?? null,
      outdoorSeating: data.outdoorSeating ?? null,
      liveMusic: data.liveMusic ?? null,
      allowsDogs: data.allowsDogs ?? null,
      goodForChildren: data.goodForChildren ?? null,
      servesCocktails: data.servesCocktails ?? null,
      servesWine: data.servesWine ?? null,
      servesBeer: data.servesBeer ?? null,
      servesBreakfast: data.servesBreakfast ?? null,
      servesBrunch: data.servesBrunch ?? null,
      servesLunch: data.servesLunch ?? null,
      servesDinner: data.servesDinner ?? null,
      takeout: data.takeout ?? null,
      delivery: data.delivery ?? null,
      dineIn: data.dineIn ?? null,
      curbsidePickup: data.curbsidePickup ?? null,
      reviews: Array.isArray(data.reviews)
        ? data.reviews.map(
            (r: {
              name: string;
              rating?: number;
              text?: { text?: string };
              relativePublishTimeDescription?: string;
              publishTime?: string;
              authorAttribution?: {
                displayName?: string;
                photoUri?: string;
              };
            }) => ({
              name: r.name,
              rating: r.rating ?? 0,
              text: r.text?.text ?? null,
              relativeTime: r.relativePublishTimeDescription ?? null,
              publishTime: r.publishTime ?? null,
              authorName: r.authorAttribution?.displayName ?? null,
              authorPhotoUri: r.authorAttribution?.photoUri ?? null,
            }),
          )
        : null,
    });
  } catch (err) {
    console.error("[place-details] fetch threw:", err);
    return NextResponse.json(
      { error: "Failed to fetch place details" },
      { status: 500 },
    );
  }
}
