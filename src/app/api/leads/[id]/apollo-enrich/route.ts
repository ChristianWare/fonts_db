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

type DecisionMakerHypothesis = {
  primary?: { title: string; why: string };
  secondary?: { title: string; why: string };
  linkedinSearch?: string;
};

type ApolloSearchPerson = {
  id: string;
  first_name?: string;
  last_name?: string;
  title?: string;
  linkedin_url?: string;
};

type ApolloMatchPerson = {
  id?: string;
  first_name?: string;
  last_name?: string;
  title?: string;
  email?: string | null;
  email_status?: "verified" | "guessed" | "unavailable" | string;
  linkedin_url?: string | null;
};

function extractDomain(websiteUrl: string): string | null {
  try {
    const normalized = websiteUrl.startsWith("http")
      ? websiteUrl
      : `https://${websiteUrl}`;
    const u = new URL(normalized);
    return u.hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

function parseTitles(hypothesisJson: string | null): string[] {
  if (!hypothesisJson) return [];
  try {
    const dm: DecisionMakerHypothesis = JSON.parse(hypothesisJson);
    const titles: string[] = [];
    if (dm.primary?.title) titles.push(dm.primary.title);
    if (dm.secondary?.title) titles.push(dm.secondary.title);
    return titles;
  } catch {
    return [];
  }
}

function normalizeEmailStatus(
  raw: string | undefined,
): "verified" | "guessed" | "unavailable" {
  if (raw === "verified") return "verified";
  if (raw === "guessed" || raw === "likely") return "guessed";
  return "unavailable";
}

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
      businessName: true,
      decisionMakerHypothesis: true,
      apolloEnrichment: true,
      isDraft: true,
    },
  });
  if (!lead || lead.clientProfileId !== profile.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Idempotent: return cached when we have actual enrichment data
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
    return NextResponse.json({ success: true, enrichment: result });
  }

  // Gate on saved (non-draft) leads only — don't burn credits on browsed leads
  if (lead.isDraft) {
    const result: ApolloResult = {
      enabled: false,
      reason: "Save this lead to unlock verified contacts",
    };
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

  const domain = extractDomain(lead.businessWebsite);
  if (!domain) {
    const result: ApolloResult = {
      enabled: false,
      reason: "Could not extract a valid domain from the website URL",
    };
    await db.savedLead.update({
      where: { id },
      data: { apolloEnrichment: result },
    });
    return NextResponse.json({ success: true, enrichment: result });
  }

  const titles = parseTitles(lead.decisionMakerHypothesis);
  if (titles.length === 0) {
    const result: ApolloResult = {
      enabled: false,
      reason:
        "No decision-maker titles available — generate the 'Who to Contact' section first",
    };
    return NextResponse.json({ success: true, enrichment: result });
  }

  // STEP 1: Search Apollo for people matching domain + titles (free, no credits)
  let searchPersons: ApolloSearchPerson[] = [];
  try {
    const searchParams = new URLSearchParams();
    searchParams.append("q_organization_domains_list[]", domain);
    titles.forEach((t) => searchParams.append("person_titles[]", t));
    searchParams.append("page", "1");
    searchParams.append("per_page", "5");

    const searchRes = await fetch(
      `https://api.apollo.io/api/v1/mixed_people/api_search?${searchParams}`,
      {
        method: "POST",
        headers: {
          "Cache-Control": "no-cache",
          "Content-Type": "application/json",
          accept: "application/json",
          "X-Api-Key": apiKey,
        },
      },
    );

    if (!searchRes.ok) {
      const errBody = await searchRes.text();
      console.error(
        "[apollo-enrich] Search failed:",
        searchRes.status,
        errBody,
      );
      const result: ApolloResult = {
        enabled: false,
        reason: `Apollo search returned ${searchRes.status}. Check your API key has master access.`,
      };
      return NextResponse.json({ success: true, enrichment: result });
    }

    const searchData = await searchRes.json();
    searchPersons = (searchData.people || []) as ApolloSearchPerson[];
  } catch (err) {
    console.error("[apollo-enrich] Search threw:", err);
    const result: ApolloResult = {
      enabled: false,
      reason: "Apollo search request failed",
    };
    return NextResponse.json({ success: true, enrichment: result });
  }

  if (searchPersons.length === 0) {
    const result: ApolloResult = {
      enabled: true,
      persons: [],
      lastEnrichedAt: new Date().toISOString(),
    };
    await db.savedLead.update({
      where: { id },
      data: { apolloEnrichment: result },
    });
    return NextResponse.json({ success: true, enrichment: result });
  }

  // STEP 2: Enrich top 2 matches to reveal verified emails (1 credit each)
  const topCandidates = searchPersons.slice(0, 2);
  const enrichedPersons: ApolloPerson[] = [];

  for (const candidate of topCandidates) {
    try {
      const matchParams = new URLSearchParams();
      matchParams.append("id", candidate.id);
      matchParams.append("reveal_personal_emails", "true");

      const matchRes = await fetch(
        `https://api.apollo.io/api/v1/people/match?${matchParams}`,
        {
          method: "POST",
          headers: {
            "Cache-Control": "no-cache",
            "Content-Type": "application/json",
            accept: "application/json",
            "X-Api-Key": apiKey,
          },
        },
      );

      if (!matchRes.ok) {
        const errBody = await matchRes.text();
        console.error(
          "[apollo-enrich] Match failed for",
          candidate.id,
          matchRes.status,
          errBody,
        );
        // Fall back to search data without email
        enrichedPersons.push({
          name:
            `${candidate.first_name ?? ""} ${candidate.last_name ?? ""}`.trim() ||
            "Unknown",
          title: candidate.title ?? "",
          email: null,
          linkedinUrl: candidate.linkedin_url ?? null,
          emailStatus: "unavailable",
        });
        continue;
      }

      const matchData = await matchRes.json();
      const person: ApolloMatchPerson = matchData.person ?? {};

      enrichedPersons.push({
        name:
          `${person.first_name ?? candidate.first_name ?? ""} ${person.last_name ?? candidate.last_name ?? ""}`.trim() ||
          "Unknown",
        title: person.title ?? candidate.title ?? "",
        email: person.email ?? null,
        linkedinUrl: person.linkedin_url ?? candidate.linkedin_url ?? null,
        emailStatus: normalizeEmailStatus(person.email_status),
      });
    } catch (err) {
      console.error("[apollo-enrich] Match threw for", candidate.id, err);
    }
  }

  const result: ApolloResult = {
    enabled: true,
    persons: enrichedPersons,
    lastEnrichedAt: new Date().toISOString(),
  };

  await db.savedLead.update({
    where: { id },
    data: { apolloEnrichment: result },
  });

  return NextResponse.json({ success: true, enrichment: result });
}
