import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { auth } from "../../../../../../../auth";
import { db } from "@/lib/db";
import { APOLLO_DOMAIN_GUESS_SYSTEM } from "@/lib/ai/warmAiPrompts";

export const runtime = "nodejs";
export const maxDuration = 30;

const MODEL = "claude-sonnet-4-6";

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
      matchedDomain?: string;
    }
  | {
      enabled: false;
      reason: string;
    };

type DecisionMakerHypothesis = {
  primary?: { title: string; why: string };
  secondary?: { title: string; why: string };
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
  email_status?: string;
  linkedin_url?: string | null;
};

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

async function guessDomains(
  organizerName: string,
  apiKey: string,
): Promise<string[]> {
  const client = new Anthropic({ apiKey });
  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 200,
      system: APOLLO_DOMAIN_GUESS_SYSTEM,
      messages: [{ role: "user", content: `Organizer name: ${organizerName}` }],
    });
    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") return [];
    const cleaned = textBlock.text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (d): d is string => typeof d === "string" && d.includes("."),
    );
  } catch (err) {
    console.error("[apollo-enrich warm] domain guess failed:", err);
    return [];
  }
}

async function searchApolloByDomain(
  domain: string,
  titles: string[],
  apiKey: string,
): Promise<ApolloSearchPerson[]> {
  const searchParams = new URLSearchParams();
  searchParams.append("q_organization_domains_list[]", domain);
  titles.forEach((t) => searchParams.append("person_titles[]", t));
  searchParams.append("page", "1");
  searchParams.append("per_page", "5");

  const res = await fetch(
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

  if (!res.ok) {
    console.warn(
      `[apollo-enrich warm] domain ${domain} returned ${res.status}`,
    );
    return [];
  }

  const data = await res.json();
  return (data.people || []) as ApolloSearchPerson[];
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
      leadType: true,
      businessName: true,
      decisionMakerHypothesis: true,
      apolloEnrichment: true,
      isDraft: true,
    },
  });
  if (!lead || lead.clientProfileId !== profile.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (lead.leadType !== "WARM" && lead.leadType !== "HOT") {
    return NextResponse.json(
      { error: "This route is for event-based leads only" },
      { status: 400 },
    );
  }

  // Idempotent
  if (lead.apolloEnrichment && !force) {
    const cached = lead.apolloEnrichment as ApolloResult;
    if (cached.enabled === true) {
      return NextResponse.json({ success: true, enrichment: cached });
    }
  }

  const apolloKey = process.env.APOLLO_API_KEY;
  if (!apolloKey) {
    const result: ApolloResult = {
      enabled: false,
      reason: "Apollo integration pending enrollment",
    };
    return NextResponse.json({ success: true, enrichment: result });
  }

  // Gate on saved (non-draft) leads only
  if (lead.isDraft) {
    const result: ApolloResult = {
      enabled: false,
      reason: "Save this lead to unlock verified contacts",
    };
    return NextResponse.json({ success: true, enrichment: result });
  }

  // For warm, businessName is the organizerName (set during page.tsx draft creation)
  const organizerName = lead.businessName;
  if (!organizerName) {
    const result: ApolloResult = {
      enabled: false,
      reason: "No organizer name on file — cannot lookup verified contacts",
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

  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (!anthropicKey) {
    const result: ApolloResult = {
      enabled: false,
      reason: "AI domain guesser unavailable",
    };
    return NextResponse.json({ success: true, enrichment: result });
  }

  // STEP 1: AI-guess possible domains for this organizer
  const candidateDomains = await guessDomains(organizerName, anthropicKey);
  if (candidateDomains.length === 0) {
    const result: ApolloResult = {
      enabled: false,
      reason: `Could not guess a domain for ${organizerName}. Try adding the organizer's website manually.`,
    };
    await db.savedLead.update({
      where: { id },
      data: { apolloEnrichment: result },
    });
    return NextResponse.json({ success: true, enrichment: result });
  }

  // STEP 2: Try each domain until Apollo returns hits
  let matchedDomain: string | null = null;
  let searchPersons: ApolloSearchPerson[] = [];
  for (const domain of candidateDomains) {
    try {
      const persons = await searchApolloByDomain(domain, titles, apolloKey);
      if (persons.length > 0) {
        matchedDomain = domain;
        searchPersons = persons;
        break;
      }
    } catch (err) {
      console.error(`[apollo-enrich warm] search failed for ${domain}:`, err);
    }
  }

  if (!matchedDomain || searchPersons.length === 0) {
    const result: ApolloResult = {
      enabled: false,
      reason: `Tried ${candidateDomains.length} candidate domain(s) for ${organizerName} — no matches in Apollo. The organizer may use a different domain or Apollo doesn't have them indexed.`,
    };
    await db.savedLead.update({
      where: { id },
      data: { apolloEnrichment: result },
    });
    return NextResponse.json({ success: true, enrichment: result });
  }

  // STEP 3: Enrich top 2 matches to reveal verified emails
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
            "X-Api-Key": apolloKey,
          },
        },
      );

      if (!matchRes.ok) {
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
      console.error("[apollo-enrich warm] match threw:", err);
    }
  }

  const result: ApolloResult = {
    enabled: true,
    persons: enrichedPersons,
    lastEnrichedAt: new Date().toISOString(),
    matchedDomain,
  };

  await db.savedLead.update({
    where: { id },
    data: { apolloEnrichment: result },
  });

  return NextResponse.json({ success: true, enrichment: result });
}
