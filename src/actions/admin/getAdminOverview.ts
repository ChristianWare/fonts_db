"use server";

import { auth } from "../../../auth";
import { db } from "@/lib/db";

export const getAdminOverview = async () => {
  const session = await auth();
  if (!session?.user?.roles?.includes("ADMIN")) return null;

  const [clients, openTickets, pendingRequests] = await Promise.all([
    db.clientProfile.findMany({
      include: {
        user: { select: { email: true, name: true, roles: true } },
        subscriptions: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    db.supportTicket.count({ where: { status: "OPEN" } }),
    db.changeRequest.count({ where: { status: "PENDING" } }),
  ]);

  // Active clients are those with an ACTIVE WEBSITE subscription.
  // (A client may also have a LEADS subscription — don't count that here.)
  const activeClients = clients.filter((c) =>
    c.subscriptions.some(
      (s) => s.productType === "WEBSITE" && s.status === "ACTIVE",
    ),
  );

  // MRR uses ClientProfile.monthlyAmountCents — the admin-editable per-client
  // rate — rather than Subscription.planAmountCents (the Stripe plan default).
  // Clients with monthlyAmountCents = 0 (e.g. internal/test accounts) are
  // correctly excluded from revenue.
  const mrr = activeClients.reduce(
    (sum, c) => sum + (c.monthlyAmountCents ?? 0),
    0,
  );

  return {
    clients,
    mrr,
    activeCount: activeClients.length,
    openTickets,
    pendingRequests,
  };
};
