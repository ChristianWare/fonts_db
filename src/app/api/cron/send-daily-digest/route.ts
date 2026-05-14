import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendDailyDigestEmail } from "@/lib/emails";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

const WARM_MIN_DAYS = 15;
const WARM_MAX_DAYS = 90;
const DIGEST_WINDOW_HOURS = 24;
const MAX_EVENTS_PER_EMAIL = 5;

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const fifteenDaysOut = new Date(
    now.getTime() + WARM_MIN_DAYS * 24 * 60 * 60 * 1000,
  );
  const ninetyDaysOut = new Date(
    now.getTime() + WARM_MAX_DAYS * 24 * 60 * 60 * 1000,
  );
  const digestWindowStart = new Date(
    now.getTime() - DIGEST_WINDOW_HOURS * 60 * 60 * 1000,
  );

  const operators = await db.leadsSettings.findMany({
    where: {
      emailEnabled: true,
      primaryCity: { not: null },
      primaryState: { not: null },
    },
    select: {
      clientProfileId: true,
      primaryCity: true,
      primaryState: true,
      clientProfile: {
        select: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      },
    },
  });

  console.log(`[cron daily-digest] Checking ${operators.length} operators`);

  const results: Array<{
    clientProfileId: string;
    email: string;
    sent: boolean;
    eventCount: number;
    totalNew: number;
    reason?: string;
  }> = [];

  for (const op of operators) {
    const email = op.clientProfile.user.email;
    const firstName = op.clientProfile.user.name?.split(" ")[0] ?? "there";

    if (!email) {
      results.push({
        clientProfileId: op.clientProfileId,
        email: "(none)",
        sent: false,
        eventCount: 0,
        totalNew: 0,
        reason: "No email on user",
      });
      continue;
    }

    // Warm events: 15-90 days out, fetched in last 24h, enriched.
    // No dedup model needed — the fetchedAt window is naturally idempotent.
    const warmWhere = {
      marketCity: { equals: op.primaryCity!, mode: "insensitive" as const },
      marketState: { equals: op.primaryState!, mode: "insensitive" as const },
      eventDate: { gte: fifteenDaysOut, lte: ninetyDaysOut },
      fetchedAt: { gte: digestWindowStart },
      enrichedAt: { not: null },
    };

    const [totalNew, topEvents] = await Promise.all([
      db.eventbriteEvent.count({ where: warmWhere }),
      db.eventbriteEvent.findMany({
        where: warmWhere,
        orderBy: [
          { aiScore: { sort: "desc", nulls: "last" } },
          { eventDate: "asc" },
        ],
        take: MAX_EVENTS_PER_EMAIL,
        select: {
          eventbriteId: true,
          eventName: true,
          eventDate: true,
          venueName: true,
          aiScore: true,
        },
      }),
    ]);

    if (totalNew === 0) {
      results.push({
        clientProfileId: op.clientProfileId,
        email,
        sent: false,
        eventCount: 0,
        totalNew: 0,
        reason: "No new warm events",
      });
      continue;
    }

    try {
      await sendDailyDigestEmail({
        to: email,
        firstName,
        marketCity: op.primaryCity!,
        marketState: op.primaryState!,
        totalNewCount: totalNew,
        events: topEvents.map((e) => ({
          eventbriteId: e.eventbriteId,
          eventName: e.eventName,
          eventDate: e.eventDate,
          venueName: e.venueName,
          aiScore: e.aiScore,
          daysOut: Math.max(
            0,
            Math.floor(
              (e.eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
            ),
          ),
        })),
      });

      results.push({
        clientProfileId: op.clientProfileId,
        email,
        sent: true,
        eventCount: topEvents.length,
        totalNew,
      });
    } catch (err) {
      console.error(`[cron daily-digest] Failed to send to ${email}:`, err);
      results.push({
        clientProfileId: op.clientProfileId,
        email,
        sent: false,
        eventCount: 0,
        totalNew,
        reason: err instanceof Error ? err.message : String(err),
      });
    }
  }

  const summary = {
    ok: true,
    operatorsChecked: operators.length,
    emailsSent: results.filter((r) => r.sent).length,
    emailsSkipped: results.filter((r) => !r.sent).length,
    totalNewEventsAcrossOperators: results.reduce(
      (acc, r) => acc + r.totalNew,
      0,
    ),
    results,
  };

  console.log("[cron daily-digest] Complete:", summary);

  return NextResponse.json(summary);
}
