const TRANSPORT_KEYWORDS = [
  "limo",
  "limousine",
  "chauffeur",
  "black car",
  "town car",
  "shuttle",
  "party bus",
  "transportation service",
  "transport service",
  "private driver",
  "sedan service",
  "suv service",
  "car service",
  "airport ride",
  "airport transport",
  "wedding car",
  "prom limo",
  "luxury transportation",
];

const BLACKLIST_PATTERNS: RegExp[] = [
  /\bselling my (limo|limousine|van|bus|car)\b/i,
  /\bfor sale\b.{0,40}\b(limo|limousine|van|bus)\b/i,
  /\bjob (opening|posting|listing)\b/i,
  /\bhiring (limo|drivers?|chauffeurs?)\b/i,
  /\b(i drive|i'm a driver|been driving)\b.{0,60}\bfor \d+ years\b/i, // self-promo
  /\b(review|complaint) (of|about|on)\b.{0,40}\b(limo|car service|chauffeur)\b/i,
  /\b(uber|lyft|rideshare) (driver|pay|earnings)\b/i, // rideshare driver community, not customer
];

const QUESTION_MARKERS = [
  "?",
  "anyone know",
  "anyone have",
  "anyone use",
  "anyone recommend",
  "looking for",
  "need a ",
  "need to find",
  "need recommendations",
  "where can i find",
  "recommend a",
  "recommendation for",
  "recommendations for",
  "suggestions for",
  "trying to find",
  "in search of",
  "any recs",
  "any suggestions",
  "who do you use",
  "who do you recommend",
  "help finding",
];

interface PreFilterInput {
  title: string;
  body: string;
}

/**
 * Returns true if a post passes the keyword + question + blacklist filter.
 * AI classification only runs on posts that pass this check, saving most of the cost.
 */
export function passesPreFilter(post: PreFilterInput): boolean {
  const combined = `${post.title} ${post.body}`.toLowerCase();

  // Length check — too-short posts rarely contain real intent
  if (combined.trim().length < 30) return false;

  // Must contain at least one transport keyword
  const hasTransportKw = TRANSPORT_KEYWORDS.some((kw) => combined.includes(kw));
  if (!hasTransportKw) return false;

  // Must NOT match any blacklist pattern
  const matchesBlacklist = BLACKLIST_PATTERNS.some((re) => re.test(combined));
  if (matchesBlacklist) return false;

  // Must look like a question / request
  const hasQuestion = QUESTION_MARKERS.some((m) => combined.includes(m));
  if (!hasQuestion) return false;

  return true;
}

const PHONE_REGEX =
  /(?:\+?1[-.\s]?)?\(?([2-9]\d{2})\)?[-.\s]?(\d{3})[-.\s]?(\d{4})\b/;
const EMAIL_REGEX = /\b[\w.+-]+@[\w-]+\.[\w.-]+\b/;
const DATE_REGEX_SLASH = /\b(\d{1,2})[/-](\d{1,2})(?:[/-](\d{2,4}))?\b/;

/**
 * Opportunistically extract phone, email, and date hints from post text.
 * Returns nulls when nothing found — these are bonus signals, not requirements.
 */
export function extractContactInfo(text: string): {
  phone: string | null;
  email: string | null;
  date: Date | null;
} {
  const phoneMatch = text.match(PHONE_REGEX);
  const phone = phoneMatch
    ? `(${phoneMatch[1]}) ${phoneMatch[2]}-${phoneMatch[3]}`
    : null;

  const emailMatch = text.match(EMAIL_REGEX);
  const email = emailMatch ? emailMatch[0].toLowerCase() : null;

  // Conservative date extraction — only obvious MM/DD or MM/DD/YY patterns
  let date: Date | null = null;
  const dateMatch = text.match(DATE_REGEX_SLASH);
  if (dateMatch) {
    const month = parseInt(dateMatch[1], 10);
    const day = parseInt(dateMatch[2], 10);
    const year = dateMatch[3]
      ? parseInt(dateMatch[3], 10) < 100
        ? 2000 + parseInt(dateMatch[3], 10)
        : parseInt(dateMatch[3], 10)
      : new Date().getFullYear();
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      const candidate = new Date(year, month - 1, day);
      if (!Number.isNaN(candidate.getTime())) date = candidate;
    }
  }

  return { phone, email, date };
}
