import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../../../auth";
import { scrapeRedditForMarket } from "@/lib/scrapers/reddit";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isAdmin = session.user.roles?.includes("ADMIN") ?? false;
  if (!isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: { city?: string; state?: string; maxItems?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const city = body.city?.trim();
  const state = body.state?.trim();
  if (!city || !state) {
    return NextResponse.json(
      { error: "city and state required" },
      { status: 400 },
    );
  }

  try {
    const result = await scrapeRedditForMarket({
      city,
      state,
      maxItems: body.maxItems,
    });
    return NextResponse.json({ ok: true, market: { city, state }, ...result });
  } catch (err) {
    console.error("[reddit admin scrape] failed:", err);
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : String(err),
      },
      { status: 500 },
    );
  }
}
