import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  // Verify the request is from Vercel Cron (or wherever you trigger it)
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  // Find candidates: draft, old, no notes, no activities
  const candidates = await db.savedLead.findMany({
    where: {
      isDraft: true,
      createdAt: { lt: ninetyDaysAgo },
      OR: [{ notes: null }, { notes: "" }],
      activities: { none: {} },
    },
    select: { id: true },
  });

  if (candidates.length === 0) {
    return NextResponse.json({
      success: true,
      deletedCount: 0,
      message: "No drafts eligible for cleanup",
    });
  }

  const ids = candidates.map((c) => c.id);

  // Delete in a transaction. Children first to handle non-cascade schemas.
  await db.$transaction([
    db.outreachScript.deleteMany({ where: { savedLeadId: { in: ids } } }),
    db.leadActivity.deleteMany({ where: { savedLeadId: { in: ids } } }),
    db.savedLead.deleteMany({ where: { id: { in: ids } } }),
  ]);

  console.log(`[cleanup-drafts] Deleted ${ids.length} stale drafts`);

  return NextResponse.json({
    success: true,
    deletedCount: ids.length,
  });
}
