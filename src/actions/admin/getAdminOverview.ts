"use server";

import { auth } from "../../../auth";
import { db } from "@/lib/db";

export const getAdminOverview = async () => {
  const session = await auth();
  if (!session?.user?.roles?.includes("ADMIN")) return null;

  const [clients, subscriptions, openTickets, pendingRequests] =
    await Promise.all([
      db.clientProfile.findMany({
        include: {
          user: { select: { name: true, email: true } },
          subscription: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      db.subscription.findMany({
        where: { status: "ACTIVE" },
      }),
      db.supportTicket.count({ where: { status: "OPEN" } }),
      db.changeRequest.count({ where: { status: "PENDING" } }),
    ]);

  const mrr = subscriptions.reduce(
    (sum, s) => sum + (s.planAmountCents ?? 0),
    0,
  );

  return {
    clients,
    mrr,
    activeCount: subscriptions.length,
    openTickets,
    pendingRequests,
  };
};
