"use server";

import { auth } from "../../../auth";
import { db } from "@/lib/db";

export async function updateClientBillingRates({
  clientProfileId,
  setupFeeAmountCents,
  monthlyAmountCents,
}: {
  clientProfileId: string;
  setupFeeAmountCents: number;
  monthlyAmountCents: number;
}) {
  const session = await auth();
  if (!session?.user || !session.user.roles?.includes("ADMIN")) {
    return { error: "Unauthorized" };
  }

  if (setupFeeAmountCents < 0 || monthlyAmountCents < 0) {
    return { error: "Amounts cannot be negative." };
  }

  await db.clientProfile.update({
    where: { id: clientProfileId },
    data: {
      setupFeeAmountCents,
      monthlyAmountCents,
    },
  });

  return { success: true };
}
