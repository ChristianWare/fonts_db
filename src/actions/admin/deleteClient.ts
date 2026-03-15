"use server";

import { auth } from "../../../auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";

export async function deleteClient(clientProfileId: string) {
  const session = await auth();
  if (!session?.user || !session.user.roles?.includes("ADMIN")) {
    return { error: "Unauthorized" };
  }

  const profile = await db.clientProfile.findUnique({
    where: { id: clientProfileId },
    select: { userId: true },
  });

  if (!profile) return { error: "Client not found" };

  // Delete in order to satisfy foreign key constraints
  await db.invoice.deleteMany({ where: { clientProfileId } });
  await db.subscription.deleteMany({ where: { clientProfileId } });
  await db.supportTicket.deleteMany({ where: { clientProfileId } });
  await db.changeRequest.deleteMany({ where: { clientProfileId } });
  await db.brandAsset.deleteMany({ where: { clientProfileId } });
  await db.document.deleteMany({ where: { clientProfileId } });
  await db.questionnaire.deleteMany({ where: { clientProfileId } });
  await db.stageChangeLog.deleteMany({ where: { clientProfileId } });
  await db.clientProfile.delete({ where: { id: clientProfileId } });
  await db.user.delete({ where: { id: profile.userId } });

  redirect("/admin/clients");
}
