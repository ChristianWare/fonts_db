import { db } from "@/lib/db";
import { runActorSync } from "@/lib/apify";
import { passesPreFilter, extractContactInfo } from "@/lib/hotLeadFilters"; 
import { classifyHotLead } from "../ai/hotLeadClassifier"; 

// Apify Reddit scraper actor — swappable if you prefer a different one
const ACTOR_ID = "apify/reddit-scraper-lite";

// Search keywords joined with OR for the subreddit search URL
const SEARCH_KEYWORDS = [
  "limo",
  "limousine",
  "chauffeur",
  "shuttle",
  "transportation",
  "black car",
  "town car",
  "party bus",
];

const STATE_TO_SUBREDDIT: Record<string, string> = {
  AL: "alabama",
  AK: "alaska",
  AZ: "arizona",
  AR: "arkansas",
  CA: "california",
  CO: "colorado",
  CT: "connecticut",
  DE: "delaware",
  FL: "florida",
  GA: "georgia",
  HI: "hawaii",
  ID: "idaho",
  IL: "illinois",
  IN: "indiana",
  IA: "iowa",
  KS: "kansas",
  KY: "kentucky",
  LA: "louisiana",
  ME: "maine",
  MD: "maryland",
  MA: "massachusetts",
  MI: "michigan",
  MN: "minnesota",
  MS: "mississippi",
  MO: "missouri",
  MT: "montana",
  NE: "nebraska",
  NV: "nevada",
  NH: "newhampshire",
  NJ: "newjersey",
  NM: "newmexico",
  NY: "newyork",
  NC: "northcarolina",
  ND: "northdakota",
  OH: "ohio",
  OK: "oklahoma",
  OR: "oregon",
  PA: "pennsylvania",
  RI: "rhodeisland",
  SC: "southcarolina",
  SD: "southdakota",
  TN: "tennessee",
  TX: "texas",
  UT: "utah",
  VT: "vermont",
  VA: "virginia",
  WA: "washington",
  WV: "westvirginia",
  WI: "wisconsin",
  WY: "wyoming",
};

export interface RedditRawPost {
  id?: string;
  title?: string;
  text?: string; // post body
  body?: string; // alternate body field name some scrapers use
  url?: string;
  permalink?: string;
  createdAt?: string;
  postedAt?: string;
  authorName?: string;
  username?: string;
  subredditName?: string;
  subreddit?: string;
  [key: string]: unknown;
}

interface RedditScrapeOptions {
  city: string;
  state: string;
  maxItems?: number;
}

export interface RedditScrapeResult {
  scraped: number;
  candidates: number; // passed pre-filter
  inserted: number; // passed AI + stored
  skipped: number;
  errors: string[];
  subreddits: string[];
  searchUrls: string[];
  sampleRaw?: RedditRawPost | null;
}

function generateSubredditCandidates(city: string, state: string): string[] {
  const candidates: string[] = [];

  const cityNormalized = city.toLowerCase().replace(/[^a-z]/g, "");
  if (cityNormalized.length > 0) candidates.push(cityNormalized);

  const stateUpper = state.toUpperCase();
  const stateSubreddit = STATE_TO_SUBREDDIT[stateUpper];
  if (stateSubreddit) candidates.push(stateSubreddit);

  return Array.from(new Set(candidates));
}

function buildSearchUrl(subreddit: string): string {
  const keywordQuery = SEARCH_KEYWORDS.map((k) => encodeURIComponent(k)).join(
    "+OR+",
  );
  return `https://www.reddit.com/r/${subreddit}/search/?q=${keywordQuery}&restrict_sr=1&t=week&sort=new`;
}

// Defensive accessors — different Apify Reddit actors return slightly different shapes
function postId(p: RedditRawPost): string | null {
  return typeof p.id === "string" ? p.id : null;
}
function postTitle(p: RedditRawPost): string {
  return typeof p.title === "string" ? p.title : "";
}
function postBody(p: RedditRawPost): string {
  if (typeof p.text === "string") return p.text;
  if (typeof p.body === "string") return p.body;
  return "";
}
function postUrl(p: RedditRawPost): string {
  if (typeof p.url === "string" && p.url.startsWith("http")) return p.url;
  if (typeof p.permalink === "string") {
    return p.permalink.startsWith("http")
      ? p.permalink
      : `https://reddit.com${p.permalink}`;
  }
  return "";
}
function postCreatedAt(p: RedditRawPost): Date {
  const raw =
    (typeof p.createdAt === "string" && p.createdAt) ||
    (typeof p.postedAt === "string" && p.postedAt) ||
    null;
  if (raw) {
    const d = new Date(raw);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return new Date();
}
function postAuthor(p: RedditRawPost): string | null {
  if (typeof p.authorName === "string") return p.authorName;
  if (typeof p.username === "string") return p.username;
  return null;
}
function postSubreddit(p: RedditRawPost): string | null {
  if (typeof p.subredditName === "string") return p.subredditName;
  if (typeof p.subreddit === "string") return p.subreddit;
  return null;
}

export async function scrapeRedditForMarket(
  opts: RedditScrapeOptions,
): Promise<RedditScrapeResult> {
  const maxItems = opts.maxItems ?? 100;
  const subreddits = generateSubredditCandidates(opts.city, opts.state);
  const searchUrls = subreddits.map(buildSearchUrl);

  const result: RedditScrapeResult = {
    scraped: 0,
    candidates: 0,
    inserted: 0,
    skipped: 0,
    errors: [],
    subreddits,
    searchUrls,
    sampleRaw: null,
  };

  if (searchUrls.length === 0) {
    result.errors.push(
      `Could not generate any subreddit candidates for ${opts.city}, ${opts.state}`,
    );
    return result;
  }

  let raw: RedditRawPost[];
  try {
    raw = await runActorSync<RedditRawPost>({
      actorId: ACTOR_ID,
      input: {
        startUrls: searchUrls.map((url) => ({ url })),
        maxItems,
        type: "posts",
        sort: "new",
        time: "week",
      },
      timeoutSecs: 300,
    });
  } catch (err) {
    result.errors.push(err instanceof Error ? err.message : String(err));
    return result;
  }

  result.scraped = raw.length;
  result.sampleRaw = raw[0] ?? null;

  if (raw[0]) {
    console.log(
      "[reddit scrape] sample raw post:",
      JSON.stringify(raw[0], null, 2).slice(0, 1500),
    );
  }

  for (const post of raw) {
    const id = postId(post);
    if (!id) {
      result.skipped++;
      continue;
    }

    const title = postTitle(post);
    const body = postBody(post);
    if (!title && !body) {
      result.skipped++;
      continue;
    }

    // Pre-filter
    if (!passesPreFilter({ title, body })) {
      result.skipped++;
      continue;
    }

    result.candidates++;

    // AI classify
    const classification = await classifyHotLead(title, body);
    if (
      !classification ||
      !classification.isTransportRequest ||
      classification.score < 50
    ) {
      result.skipped++;
      continue;
    }

    const contact = extractContactInfo(`${title} ${body}`);
    const url = postUrl(post);
    const author = postAuthor(post);
    const subreddit = postSubreddit(post);

    try {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 14);

      await db.hotLead.upsert({
        where: {
          source_externalId: { source: "reddit", externalId: id },
        },
        create: {
          externalId: id,
          source: "reddit",
          postTitle: title || null,
          postBody: body,
          postUrl: url || `https://reddit.com/comments/${id}`,
          postedAtIso: postCreatedAt(post),
          authorName: author,
          authorProfileUrl: author ? `https://reddit.com/user/${author}` : null,
          sourceCommunity: subreddit ? `r/${subreddit}` : null,
          sourceCommunityUrl: subreddit
            ? `https://reddit.com/r/${subreddit}`
            : null,
          marketCity: opts.city,
          marketState: opts.state,
          extractedPhone: contact.phone,
          extractedEmail: contact.email,
          extractedDate: contact.date,
          classification: classification as object,
          aiScore: classification.score,
          expiresAt,
        },
        update: {
          // Re-scrape just refreshes classification; don't reset expiresAt
          classification: classification as object,
          aiScore: classification.score,
        },
      });

      result.inserted++;
    } catch (err) {
      result.errors.push(
        `Failed to upsert ${id}: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
    }
  }

  return result;
}
