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

  // Hotels / Resort Spas
  // For hotels, volume (review count) is the dominant signal — even mid-rated
  // chain hotels generate substantial transportation demand from out-of-town
  // guests, corporate travelers, and event attendees. Rating only excludes
  // genuinely troubled properties (< 3.0).
  if (cat === "hotels" || cat === "resort_spas") {
    if (rating > 0 && rating < 3.0) {
      return {
        priority: "LOW",
        reasoning:
          "Low-rated property — financial pressure or service issues may limit premium partnership potential.",
        estimatedAnnualVolume: "Limited",
      };
    }
    if (reviews >= 500) {
      return {
        priority: "HIGH",
        reasoning:
          "High-volume hotel with substantial guest traffic — out-of-town guests, corporate travelers, and event attendees consistently need transportation.",
        estimatedAnnualVolume: "200+ rides/year potential",
      };
    }
    if (reviews >= 150) {
      return {
        priority: "MEDIUM",
        reasoning: "Established hotel with steady guest transportation needs.",
        estimatedAnnualVolume: "50-200 rides/year",
      };
    }
    return {
      priority: "LOW",
      reasoning: "Smaller property with limited transportation volume.",
      estimatedAnnualVolume: "<50 rides/year",
    };
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

  // Law Firms / Corporate Offices
  if (cat === "law_firms" || cat === "corporate_offices") {
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
