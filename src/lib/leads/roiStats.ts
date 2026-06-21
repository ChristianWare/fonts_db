// ROI / results stats for the leads tool — pure queries over data you already
// store (SavedLead.status, estimatedValue, lastContactedAt). No new tables.
//
// This is the retention number: "you contacted N accounts, booked M, est. $X."
//
// NOTE on "contacted" and "in conversation": until Feature #2 (send + reply
// tracking) lands, we infer these from status + lastContactedAt. Once email
// activities exist, swap these to count LeadActivity rows for true accuracy.

import { db } from "@/lib/db";

const LEADS_MONTHLY_COST = 125; // used for the "paid for itself Nx" line

export type RoiStats = {
  totalSaved: number;
  contacted: number;
  inConversation: number; // NURTURING — proxy for "replied" until #2
  booked: number; // WON
  dead: number;
  estValueBooked: number; // sum of estimatedValue on WON leads
  contactedToBookedPct: number | null; // null when nothing contacted yet
  monthlyCost: number;
  roiMultiple: number | null; // estValueBooked / monthlyCost, null if $0
};

export async function getRoiStats(clientProfileId: string): Promise<RoiStats> {
  const baseWhere = { clientProfileId, isDraft: false } as const;

  const [byStatus, wonAgg, totalSaved, contacted] = await Promise.all([
    db.savedLead.groupBy({
      by: ["status"],
      where: baseWhere,
      _count: { _all: true },
    }),
    db.savedLead.aggregate({
      where: { ...baseWhere, status: "WON" },
      _sum: { estimatedValue: true },
      _count: { _all: true },
    }),
    db.savedLead.count({ where: baseWhere }),
    db.savedLead.count({
      where: {
        ...baseWhere,
        OR: [
          { lastContactedAt: { not: null } },
          { status: { in: ["CONTACTED", "NURTURING", "WON"] } },
        ],
      },
    }),
  ]);

  const statusCount = (s: string) =>
    byStatus.find((r) => r.status === s)?._count._all ?? 0;

  const booked = wonAgg._count._all;
  const estValueBooked = wonAgg._sum.estimatedValue ?? 0;
  const inConversation = statusCount("NURTURING");
  const dead = statusCount("DEAD");

  const contactedToBookedPct =
    contacted > 0 ? Math.round((booked / contacted) * 100) : null;

  const roiMultiple =
    estValueBooked > 0
      ? Math.round((estValueBooked / LEADS_MONTHLY_COST) * 10) / 10
      : null;

  return {
    totalSaved,
    contacted,
    inConversation,
    booked,
    dead,
    estValueBooked,
    contactedToBookedPct,
    monthlyCost: LEADS_MONTHLY_COST,
    roiMultiple,
  };
}