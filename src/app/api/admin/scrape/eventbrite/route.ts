import { NextResponse } from "next/server";
import { auth } from "../../../../../../auth";
import { scrapeEventbriteForMarket } from "@/lib/scrapers/eventbrite";

// Vercel Pro caps at 300s. Local dev has no cap.
export const maxDuration = 300;

interface ScrapeRequestBody {
  city?: string;
  state?: string;
  daysOutMin?: number;
  daysOutMax?: number;
  maxResults?: number;
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.roles?.includes("ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as ScrapeRequestBody;

  const city = body.city ?? "Phoenix";
  const state = body.state ?? "AZ";

  const result = await scrapeEventbriteForMarket({
    city,
    state,
    daysOutMin: body.daysOutMin,
    daysOutMax: body.daysOutMax,
    maxResults: body.maxResults,
  });

  return NextResponse.json({
    ok: result.errors.length === 0,
    market: { city, state },
    ...result,
  });
}
