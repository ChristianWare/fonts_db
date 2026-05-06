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

  const name = req.nextUrl.searchParams.get("name");
  const maxWidthRaw = req.nextUrl.searchParams.get("maxWidth") ?? "800";

  if (!name || !name.startsWith("places/")) {
    return NextResponse.json({ error: "Invalid photo name" }, { status: 400 });
  }

  const maxWidth = Math.min(
    Math.max(parseInt(maxWidthRaw, 10) || 800, 100),
    1600,
  );

  const url = `https://places.googleapis.com/v1/${name}/media?maxWidthPx=${maxWidth}&key=${API_KEY}`;

  try {
    const res = await fetch(url, { redirect: "follow" });

    if (!res.ok) {
      console.error("Place photo fetch failed", res.status);
      return NextResponse.json(
        { error: "Failed to fetch photo" },
        { status: 500 },
      );
    }

    const contentType = res.headers.get("Content-Type") ?? "image/jpeg";
    const buffer = await res.arrayBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, s-maxage=86400",
      },
    });
  } catch (err) {
    console.error("Place photo proxy error", err);
    return NextResponse.json(
      { error: "Failed to fetch photo" },
      { status: 500 },
    );
  }
}
