import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendHotLeadAlertEmail } from "@/lib/emails";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

const HOT_THRESHOLD_DAYS = 14;
const MAX_EVENTS_PER_EMAIL = 5;

export async function GET(request: Request) {
  // Vercel Cron sends Authorization: Bearer <CRON_SECRET>
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const fourteenDaysOut = new Date(
    now.getTime() + HOT_THRESHOLD_DAYS * 24 * 60 * 60 * 1000,
  );

  // Pull every operator who has email alerts on AND has a market set.
  // emailEnabled is per-operator opt-out, defaults true.
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

  console.log(`[cron hot-alerts] Checking ${operators.length} operators`);

  const results: Array<{
    clientProfileId: string;
    email: string;
    sent: boolean;
    eventCount: number;
    reason?: string;
  }> = [];

  // Serial loop — keeps DB load low and emails arrive in a predictable order.
  // If you ever have >50 operators this could be parallelized in chunks.
  for (const op of operators) {
    const email = op.clientProfile.user.email;
    const firstName = op.clientProfile.user.name?.split(" ")[0] ?? "there";

    if (!email) {
      results.push({
        clientProfileId: op.clientProfileId,
        email: "(none)",
        sent: false,
        eventCount: 0,
        reason: "No email on user",
      });
      continue;
    }

    // Enriched hot events in this operator's market that haven't been
    // alerted to them yet. Sorted by score (high first, nulls last) so
    // the email shows the best opportunities first.
    const candidateEvents = await db.eventbriteEvent.findMany({
      where: {
        marketCity: { equals: op.primaryCity!, mode: "insensitive" },
        marketState: { equals: op.primaryState!, mode: "insensitive" },
        eventDate: { gte: now, lte: fourteenDaysOut },
        enrichedAt: { not: null },
        hotLeadAlerts: {
          none: {
            clientProfileId: op.clientProfileId,
          },
        },
      },
      orderBy: [
        { aiScore: { sort: "desc", nulls: "last" } },
        { eventDate: "asc" },
      ],
      take: MAX_EVENTS_PER_EMAIL,
      select: {
        id: true,
        eventbriteId: true,
        eventName: true,
        eventDate: true,
        venueName: true,
        aiScore: true,
      },
    });

    if (candidateEvents.length === 0) {
      results.push({
        clientProfileId: op.clientProfileId,
        email,
        sent: false,
        eventCount: 0,
        reason: "No new hot events",
      });
      continue;
    }

    try {
      await sendHotLeadAlertEmail({
        to: email,
        firstName,
        marketCity: op.primaryCity!,
        marketState: op.primaryState!,
        events: candidateEvents.map((e) => ({
          eventbriteId: e.eventbriteId,
          eventName: e.eventName,
          eventDate: e.eventDate,
          venueName: e.venueName,
          aiScore: e.aiScore,
          daysUntil: Math.max(
            0,
            Math.floor(
              (e.eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
            ),
          ),
        })),
      });

      // Only mark as alerted AFTER successful send. If email fails,
      // we retry tomorrow. Worst case: duplicate email if email
      // succeeds but createMany fails (lesser evil than missed alert).
      await db.hotLeadAlert.createMany({
        data: candidateEvents.map((e) => ({
          clientProfileId: op.clientProfileId,
          eventbriteEventId: e.id,
        })),
        skipDuplicates: true,
      });

      results.push({
        clientProfileId: op.clientProfileId,
        email,
        sent: true,
        eventCount: candidateEvents.length,
      });
    } catch (err) {
      console.error(`[cron hot-alerts] Failed to send to ${email}:`, err);
      results.push({
        clientProfileId: op.clientProfileId,
        email,
        sent: false,
        eventCount: 0,
        reason: err instanceof Error ? err.message : String(err),
      });
    }
  }

  const summary = {
    ok: true,
    operatorsChecked: operators.length,
    emailsSent: results.filter((r) => r.sent).length,
    emailsSkipped: results.filter((r) => !r.sent).length,
    totalEventsAlerted: results.reduce(
      (acc, r) => acc + (r.sent ? r.eventCount : 0),
      0,
    ),
    results,
  };

  console.log("[cron hot-alerts] Complete:", summary);

  return NextResponse.json(summary);
}
