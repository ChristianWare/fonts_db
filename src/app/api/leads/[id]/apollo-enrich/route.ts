import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../../../auth";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const maxDuration = 30;

type ApolloPerson = {
  name: string;
  title: string;
  email: string | null;
  linkedinUrl: string | null;
  emailStatus: "verified" | "guessed" | "unavailable";
};

type ApolloResult =
  | {
      enabled: true;
      persons: ApolloPerson[];
      lastEnrichedAt: string;
    }
  | {
      enabled: false;
      reason: string;
    };

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await db.clientProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!profile) {
    return NextResponse.json({ error: "No profile" }, { status: 404 });
  }

  const { id } = await params;
  const url = new URL(req.url);
  const force = url.searchParams.get("force") === "true";

  const lead = await db.savedLead.findUnique({
    where: { id },
    select: {
      id: true,
      clientProfileId: true,
      businessWebsite: true,
      decisionMakerHypothesis: true,
      apolloEnrichment: true,
    },
  });
  if (!lead || lead.clientProfileId !== profile.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Idempotent: return cached when we have actual data and not forcing
  if (lead.apolloEnrichment && !force) {
    const cached = lead.apolloEnrichment as ApolloResult;
    if (cached.enabled === true) {
      return NextResponse.json({ success: true, enrichment: cached });
    }
  }

  const apiKey = process.env.APOLLO_API_KEY;
  if (!apiKey) {
    const result: ApolloResult = {
      enabled: false,
      reason: "Apollo integration pending enrollment",
    };
    // Don't save — re-check on next visit so enrollment auto-activates
    return NextResponse.json({ success: true, enrichment: result });
  }

  if (!lead.businessWebsite) {
    const result: ApolloResult = {
      enabled: false,
      reason: "No website on file — domain required for verified email lookup",
    };
    await db.savedLead.update({
      where: { id },
      data: { apolloEnrichment: result },
    });
    return NextResponse.json({ success: true, enrichment: result });
  }

  // ============================================================
  // TODO: Real Apollo lookup — implement when enrolled
  // ============================================================
  // 1. Extract domain from lead.businessWebsite (strip protocol, www, path)
  // 2. Parse decision-maker titles from lead.decisionMakerHypothesis JSON
  // 3. POST https://api.apollo.io/api/v1/people/search
  //    headers: { "X-API-KEY": apiKey, "Content-Type": "application/json" }
  //    body: { q_organization_domains: [domain], person_titles: [titles], page: 1, per_page: 10 }
  // 4. Map response.people[] to ApolloPerson[]
  // 5. Save to lead.apolloEnrichment as { enabled: true, persons, lastEnrichedAt: new Date().toISOString() }
  // 6. Return enrichment
  // ============================================================

  const result: ApolloResult = {
    enabled: false,
    reason:
      "Apollo lookup logic not yet implemented — scaffolding ready, awaiting integration",
  };

  return NextResponse.json({ success: true, enrichment: result });
}
