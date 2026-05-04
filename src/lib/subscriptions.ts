import { db } from "@/lib/db";
import { ProductType, SubscriptionStatus } from "@prisma/client";

// Statuses where the user still has product access.
// PAST_DUE is included because Stripe gives a grace period before cancellation —
// you don't want to lock a paying customer out the moment a card retry hasn't
// gone through. PAUSED and CANCELLED both mean no access.
const ACCESS_GRANTING_STATUSES: SubscriptionStatus[] = ["ACTIVE", "PAST_DUE"];

export type ProductAccess = {
  hasWebsite: boolean;
  hasLeads: boolean;
  websiteStatus: SubscriptionStatus | null;
  leadsStatus: SubscriptionStatus | null;
  leadsTrialEndsAt: Date | null;
  leadsInTrial: boolean;
  leadsOnboardingComplete: boolean;
};

/**
 * One-shot read of all product access flags for a client.
 * Use this in server components and API routes that need to gate UI by product.
 */
export async function getProductAccess(
  clientProfileId: string,
): Promise<ProductAccess> {
  const [subs, leadsSettings] = await Promise.all([
    db.subscription.findMany({
      where: { clientProfileId },
    }),
    db.leadsSettings.findUnique({
      where: { clientProfileId },
      select: { onboardingCompletedAt: true },
    }),
  ]);

  const website = subs.find((s) => s.productType === "WEBSITE");
  const leads = subs.find((s) => s.productType === "LEADS");

  const now = new Date();
  const leadsInTrial = !!(leads?.trialEndsAt && leads.trialEndsAt > now);

  return {
    hasWebsite: !!website && ACCESS_GRANTING_STATUSES.includes(website.status),
    hasLeads: !!leads && ACCESS_GRANTING_STATUSES.includes(leads.status),
    websiteStatus: website?.status ?? null,
    leadsStatus: leads?.status ?? null,
    leadsTrialEndsAt: leads?.trialEndsAt ?? null,
    leadsInTrial,
    leadsOnboardingComplete: !!leadsSettings?.onboardingCompletedAt,
  };
}

/**
 * Look up a single subscription by client + product.
 * Useful when you need fields beyond the access flags (e.g. billing dates,
 * Stripe IDs for the customer portal).
 */
export async function getSubscription(
  clientProfileId: string,
  productType: ProductType,
) {
  return db.subscription.findUnique({
    where: {
      clientProfileId_productType: { clientProfileId, productType },
    },
  });
}
