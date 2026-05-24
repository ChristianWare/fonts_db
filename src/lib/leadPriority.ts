export type LeadPriority = "HIGH" | "MEDIUM" | "LOW";

export type LeadPriorityResult = {
  priority: LeadPriority;
  reasoning: string;
  estimatedAnnualVolume: string | null;
};

export type LeadPriorityInput = {
  category: string;
  rating: number | null;
  reviewCount: number | null;
  priceLevel?: string | null;
  name?: string | null; // optional — needed for hotel tier detection
};

const PRICE_RANK: Record<string, number> = {
  PRICE_LEVEL_FREE: 0,
  PRICE_LEVEL_INEXPENSIVE: 1,
  PRICE_LEVEL_MODERATE: 2,
  PRICE_LEVEL_EXPENSIVE: 3,
  PRICE_LEVEL_VERY_EXPENSIVE: 4,
};

function priceRank(level?: string | null): number {
  if (!level) return -1;
  return PRICE_RANK[level] ?? -1;
}

function normalize(category: string): string {
  return category.toLowerCase().replace(/\s+/g, "_");
}

// === Hotel tier detection ===

export type HotelTier =
  | "independent_luxury"
  | "boutique_luxury_chain"
  | "resort"
  | "big_chain_luxury"
  | "big_chain_urban"
  | "unknown";

// Major chain urban business hotels — rigid national procurement, hardest to pitch
const BIG_CHAIN_URBAN_BRANDS = [
  "marriott",
  "hilton",
  "hyatt regency",
  "hyatt place",
  "sheraton",
  "westin",
  "doubletree",
  "embassy suites",
  "hampton",
  "holiday inn",
  "crowne plaza",
  "courtyard",
  "residence inn",
  "fairfield",
  "springhill",
  "homewood suites",
  "intercontinental",
  "kimpton",
  "le meridien",
  "renaissance",
  "conrad",
];

// Big-name luxury brands — still chain procurement issues
const BIG_CHAIN_LUXURY_BRANDS = [
  "ritz-carlton",
  "ritz carlton",
  "four seasons",
  "jw marriott",
  "st. regis",
  "st regis",
  "waldorf astoria",
  "the langham",
  "the peninsula",
];

// Smaller luxury chains — more local procurement autonomy
const BOUTIQUE_LUXURY_BRANDS = [
  "rosewood",
  "montage",
  "auberge",
  "aman",
  "mandarin oriental",
  "park hyatt",
  "edition",
  "andaz",
  "thompson",
  "1 hotel",
  "fairmont",
  "loews",
];

export function getHotelTier(name: string | null | undefined): HotelTier {
  if (!name) return "unknown";
  const n = name.toLowerCase();

  // Resort detection bypasses chain procurement (wedding/event business stays local)
  if (n.includes("resort") || n.endsWith(" spa") || n.includes(" spa ")) {
    return "resort";
  }

  // Check most specific (luxury) brands first to avoid generic match
  if (BIG_CHAIN_LUXURY_BRANDS.some((b) => n.includes(b))) {
    return "big_chain_luxury";
  }
  if (BOUTIQUE_LUXURY_BRANDS.some((b) => n.includes(b))) {
    return "boutique_luxury_chain";
  }
  if (BIG_CHAIN_URBAN_BRANDS.some((b) => n.includes(b))) {
    return "big_chain_urban";
  }

  // No recognized brand — treat as independent. Imperfect but the default
  // case for non-chain luxury and most boutiques.
  return "independent_luxury";
}

function bumpUp(p: LeadPriority): LeadPriority {
  if (p === "LOW") return "MEDIUM";
  if (p === "MEDIUM") return "HIGH";
  return "HIGH";
}

function bumpDown(p: LeadPriority): LeadPriority {
  if (p === "HIGH") return "MEDIUM";
  if (p === "MEDIUM") return "LOW";
  return "LOW";
}

function applyHotelTierModifier(
  base: {
    priority: LeadPriority;
    reasoning: string;
    estimatedAnnualVolume: string | null;
  },
  tier: HotelTier,
): LeadPriorityResult {
  switch (tier) {
    case "independent_luxury":
      return {
        priority: bumpUp(base.priority),
        reasoning: `${base.reasoning} Independent luxury property — local decision-making, no corporate procurement to navigate.`,
        estimatedAnnualVolume: base.estimatedAnnualVolume,
      };
    case "boutique_luxury_chain":
      return {
        priority: bumpUp(base.priority),
        reasoning: `${base.reasoning} Smaller luxury chain — typically has local procurement autonomy.`,
        estimatedAnnualVolume: base.estimatedAnnualVolume,
      };
    case "resort":
      return {
        priority: bumpUp(base.priority),
        reasoning: `${base.reasoning} Resort property — wedding and event business is hyper-local even within chains.`,
        estimatedAnnualVolume: base.estimatedAnnualVolume,
      };
    case "big_chain_luxury":
      return {
        priority: bumpDown(base.priority),
        reasoning: `${base.reasoning} Major chain luxury brand — national procurement contract likely. Best angle: concierge relationships for guest referrals, not contract.`,
        estimatedAnnualVolume: base.estimatedAnnualVolume,
      };
    case "big_chain_urban":
      return {
        priority: "LOW",
        reasoning: `${base.reasoning} Major chain urban business hotel — national procurement and existing vendor lock likely. Lowest-priority hotel target.`,
        estimatedAnnualVolume: base.estimatedAnnualVolume,
      };
    case "unknown":
    default:
      return { ...base };
  }
}

export function computeLeadPriority(
  input: LeadPriorityInput,
): LeadPriorityResult {
  const cat = normalize(input.category);
  const reviews = input.reviewCount ?? 0;
  const rating = input.rating ?? 0;
  const price = priceRank(input.priceLevel);

  // Wedding / Event Venues
  if (cat.includes("wedding") || cat === "event_venues") {
    if (reviews >= 500 && rating >= 4.0 && (price >= 3 || price === -1)) {
      return {
        priority: "HIGH",
        reasoning:
          "Established luxury venue with high event volume — strong target for premium chauffeur services.",
        estimatedAnnualVolume: "80-150 events/year",
      };
    }
    if (reviews >= 200 && rating >= 4.0) {
      return {
        priority: "MEDIUM",
        reasoning: "Mid-tier venue with steady event flow.",
        estimatedAnnualVolume: "30-80 events/year",
      };
    }
    return {
      priority: "LOW",
      reasoning: "Smaller or less-established venue.",
      estimatedAnnualVolume: "<30 events/year",
    };
  }

  // Hotels / Resort Spas — base scoring, then tier modifier
  if (cat === "hotels" || cat === "resort_spas") {
    let base: {
      priority: LeadPriority;
      reasoning: string;
      estimatedAnnualVolume: string | null;
    };

    if (rating > 0 && rating < 3.0) {
      base = {
        priority: "LOW",
        reasoning:
          "Low-rated property — financial pressure or service issues may limit premium partnership potential.",
        estimatedAnnualVolume: "Limited",
      };
    } else if (reviews >= 500) {
      base = {
        priority: "HIGH",
        reasoning:
          "High-volume hotel with substantial guest traffic — out-of-town guests, corporate travelers, and event attendees consistently need transportation.",
        estimatedAnnualVolume: "200+ rides/year potential",
      };
    } else if (reviews >= 150) {
      base = {
        priority: "MEDIUM",
        reasoning: "Established hotel with steady guest transportation needs.",
        estimatedAnnualVolume: "50-200 rides/year",
      };
    } else {
      base = {
        priority: "LOW",
        reasoning: "Smaller property with limited transportation volume.",
        estimatedAnnualVolume: "<50 rides/year",
      };
    }

    const tier = getHotelTier(input.name);
    return applyHotelTierModifier(base, tier);
  }

  // Country Clubs
  if (cat === "country_clubs") {
    if (reviews >= 100 && rating >= 4.0) {
      return {
        priority: "MEDIUM",
        reasoning:
          "Active country club — member events and prospect transport opportunities.",
        estimatedAnnualVolume: "20-60 events/year",
      };
    }
    return {
      priority: "LOW",
      reasoning: "Smaller club with limited public-facing events.",
      estimatedAnnualVolume: "<20 events/year",
    };
  }

  // Funeral Homes
  if (cat === "funeral_homes") {
    return {
      priority: "MEDIUM",
      reasoning:
        "Funeral homes generate steady recurring transportation needs for grieving families.",
      estimatedAnnualVolume: "Recurring small jobs",
    };
  }

  // Law Firms (corporate_offices removed)
  if (cat === "law_firms") {
    if (reviews >= 50 && rating >= 4.0) {
      return {
        priority: "MEDIUM",
        reasoning:
          "Established firm with executive and client transportation needs.",
        estimatedAnnualVolume: "Steady executive rides",
      };
    }
    return {
      priority: "LOW",
      reasoning: "Smaller firm with limited transportation volume.",
      estimatedAnnualVolume: null,
    };
  }

  // Casinos
  if (cat === "casinos") {
    if (reviews >= 500 && rating >= 4.0) {
      return {
        priority: "HIGH",
        reasoning:
          "High-volume casino property — VIP host budgets and convention event traffic create consistent high-margin transportation demand.",
        estimatedAnnualVolume: "Premium VIP runs + group/convention business",
      };
    }
    if (reviews >= 150) {
      return {
        priority: "MEDIUM",
        reasoning:
          "Active casino property — VIP host program and event business generate ongoing transportation needs.",
        estimatedAnnualVolume: "Recurring VIP and group transport",
      };
    }
    return {
      priority: "MEDIUM",
      reasoning:
        "Casino property — even smaller venues run VIP host programs worth pursuing for discretion-focused operators.",
      estimatedAnnualVolume: null,
    };
  }

  // 55+ Communities
  if (
    cat === "55+_communities" ||
    cat.includes("retirement") ||
    cat.includes("active_adult")
  ) {
    if (reviews >= 100 && rating >= 4.0) {
      return {
        priority: "HIGH",
        reasoning:
          "Well-established active adult community — events coordinator books regular group transportation for community outings, seasonal trips, and resident events.",
        estimatedAnnualVolume: "12-30 group bookings/year",
      };
    }
    return {
      priority: "MEDIUM",
      reasoning:
        "Active adult community — recurring group transportation potential through events coordinator.",
      estimatedAnnualVolume: "Recurring group bookings",
    };
  }

  // Default fallback
  if (reviews >= 500 && rating >= 4.5) {
    return {
      priority: "MEDIUM",
      reasoning: "Highly-rated business with notable customer base.",
      estimatedAnnualVolume: null,
    };
  }
  return {
    priority: "LOW",
    reasoning: "Insufficient signals to qualify as a high-priority target.",
    estimatedAnnualVolume: null,
  };
}
