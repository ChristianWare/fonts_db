// Recurring / high-LTV account detection.
// Some account types book ground transportation again and again under a single
// relationship (the calendar-vendor play); others are one-off. This flags the
// recurring ones so operators can prioritize durable accounts.
//
// Pure category mapping — no DB, no external calls.

const RECURRING_CATEGORIES = new Set<string>([
  "55+ communities",
  "country clubs",
  "hotels",
  "funeral homes",
  "wedding venues",
  "event venues",
]);

// Map singular / slug forms back to the canonical plural label so this works
// against both the search categories ("wedding venues") and the saved-lead
// slug format ("wedding_venue").
const ALIASES: Record<string, string> = {
  "55+ community": "55+ communities",
  "country club": "country clubs",
  hotel: "hotels",
  "funeral home": "funeral homes",
  "wedding venue": "wedding venues",
  "event venue": "event venues",
};

function normalizeCategory(category: string): string {
  return category.toLowerCase().replace(/_/g, " ").replace(/\s+/g, " ").trim();
}

export function isRecurringCategory(
  category: string | null | undefined,
): boolean {
  if (!category) return false;
  const norm = normalizeCategory(category);
  const canonical = ALIASES[norm] ?? norm;
  return RECURRING_CATEGORIES.has(canonical);
}
