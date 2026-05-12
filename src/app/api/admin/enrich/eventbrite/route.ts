import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../../../auth";
import { db } from "@/lib/db";
import { enrichEventbriteEvents } from "@/lib/enrichment/eventbriteEnrichment";

export const runtime = "nodejs";
export const maxDuration = 800;

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isAdmin = session.user.roles?.includes("ADMIN") ?? false;
  if (!isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: {
    city?: string;
    state?: string;
    force?: boolean;
    limit?: number;
  };
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  // Default: enrich events that haven't been enriched yet.
  // With force=true, re-enrich already-enriched events too.
  const where: Record<string, unknown> = {};
  if (body.city) where.marketCity = body.city;
  if (body.state) where.marketState = body.state;
  if (!body.force) where.enrichedAt = null;

  const limit = body.limit ?? 200;

  const events = await db.eventbriteEvent.findMany({
    where,
    select: { id: true },
    take: limit,
    orderBy: { fetchedAt: "desc" },
  });

  if (events.length === 0) {
    return NextResponse.json({
      ok: true,
      message: "No events match the criteria — nothing to enrich.",
      enriched: 0,
    });
  }

  const results = await enrichEventbriteEvents(
    events.map((e) => e.id),
    { force: body.force ?? false, concurrency: 5 },
  );

  return NextResponse.json({
    ok: true,
    totalProcessed: events.length,
    enriched: results.filter((r) => r.ok).length,
    failed: results.filter((r) => !r.ok).length,
    errors: results
      .filter((r) => r.error)
      .slice(0, 5)
      .map((r) => ({ eventId: r.eventId, error: r.error })),
  });
}
