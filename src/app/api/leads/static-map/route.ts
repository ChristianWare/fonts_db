import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../../auth";

export const runtime = "nodejs";

const API_KEY = process.env.GOOGLE_MAPS_SERVER_KEY;

const MAP_STYLES = [
  "feature:poi|visibility:off",
  "feature:transit|visibility:off",
  "feature:landscape|color:0xf5f5f5",
  "feature:road|color:0xffffff",
  "feature:road|element:labels|color:0x999999",
  "feature:water|color:0xe5e5e5",
  "feature:administrative|element:labels|color:0x666666",
];

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

  const lat = parseFloat(req.nextUrl.searchParams.get("lat") ?? "");
  const lng = parseFloat(req.nextUrl.searchParams.get("lng") ?? "");
  const zoom = Math.min(
    Math.max(parseInt(req.nextUrl.searchParams.get("zoom") ?? "14", 10), 1),
    20,
  );
  const width = Math.min(
    Math.max(parseInt(req.nextUrl.searchParams.get("width") ?? "600", 10), 100),
    1280,
  );
  const height = Math.min(
    Math.max(
      parseInt(req.nextUrl.searchParams.get("height") ?? "300", 10),
      100,
    ),
    1280,
  );
  const styled = req.nextUrl.searchParams.get("styled") !== "false";

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json({ error: "Invalid coordinates" }, { status: 400 });
  }

  const url = new URL("https://maps.googleapis.com/maps/api/staticmap");
  url.searchParams.set("center", `${lat},${lng}`);
  url.searchParams.set("zoom", String(zoom));
  url.searchParams.set("size", `${width}x${height}`);
  url.searchParams.set("scale", "2");
  url.searchParams.set("markers", `color:0x000000|${lat},${lng}`);
  if (styled) {
    for (const style of MAP_STYLES) {
      url.searchParams.append("style", style);
    }
  }
  url.searchParams.set("key", API_KEY);

  try {
    const res = await fetch(url.toString());

    if (!res.ok) {
      const errorBody = await res.text();
      const debugUrl = url.toString().replace(API_KEY, "REDACTED");
      console.error(
        "[static-map] Google API error",
        "\n  status:",
        res.status,
        "\n  statusText:",
        res.statusText,
        "\n  body:",
        errorBody,
        "\n  url:",
        debugUrl,
      );
      return NextResponse.json(
        {
          error: "Failed to fetch map",
          googleStatus: res.status,
          googleError: errorBody,
        },
        { status: 500 },
      );
    }

    const contentType = res.headers.get("Content-Type") ?? "image/png";
    const buffer = await res.arrayBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=604800, s-maxage=604800",
      },
    });
  } catch (err) {
    console.error("[static-map] fetch threw:", err);
    return NextResponse.json({ error: "Failed to fetch map" }, { status: 500 });
  }
}
