// Deterministic cold lead scoring. No AI, no API calls — pure math
// over Google Places data. Returns a 0-100 score plus a structured
// breakdown that downstream code can use to generate reasoning prose.

export interface ColdScoreInput {
  rating: number | null;
  reviewCount: number | null;
  phone: string | null;
  website: string | null;
  address: string | null;
  name: string | null;
  businessLat: number | null;
  businessLng: number | null;
  primaryLat: number | null;
  primaryLng: number | null;
  serviceRadiusMiles: number | null;
}

export interface ColdScoreBreakdown {
  total: number;
  scale: {
    points: number;
    maxPoints: 55;
    rating: number | null;
    reviewCount: number | null;
  };
  completeness: {
    points: number;
    maxPoints: 25;
    hasWebsite: boolean;
    hasPhone: boolean;
    hasAddress: boolean;
  };
  distance: {
    points: number;
    maxPoints: 10;
    distanceMiles: number | null;
    withinRadius: boolean | null;
  };
  keywords: {
    points: number;
    maxPoints: 10;
    matchedKeyword: string | null;
  };
}

// Scale-signaling keywords — venues with these in their names tend
// to be larger, more established, more likely to need transportation.
// Match is case-insensitive substring. Any single match = full 10 points.
const SCALE_KEYWORDS = [
  "country club",
  "resort",
  "conference center",
  "convention center",
  "ballroom",
  "estate",
  "manor",
  "chateau",
  "pavilion",
  "grand",
  "royal",
  "palace",
  "hotel",
  "inn",
] as const;

const EARTH_RADIUS_MILES = 3958.8;

function haversineMiles(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_MILES * c;
}

// Rating × log10(reviews), normalized to 55 max
// A 5.0-rated venue with 5,000+ reviews scores full marks
// A 3.0-rated venue with 10 reviews scores low
function computeScale(
  rating: number | null,
  reviewCount: number | null,
): number {
  if (rating == null || reviewCount == null || reviewCount === 0) return 0;
  const ratingFactor = Math.min(rating, 5.0) / 5.0;
  const reviewFactor = Math.min(
    Math.log10(reviewCount + 1) / Math.log10(5000),
    1,
  );
  return Math.round(ratingFactor * reviewFactor * 55);
}

function computeCompleteness(
  hasWebsite: boolean,
  hasPhone: boolean,
  hasAddress: boolean,
): number {
  let points = 0;
  if (hasWebsite) points += 10;
  if (hasPhone) points += 10;
  if (hasAddress) points += 5;
  return points;
}

function computeDistance(
  distanceMiles: number | null,
  serviceRadiusMiles: number | null,
): { points: number; withinRadius: boolean | null } {
  // Unknown distance — give neutral middle so we don't punish unscoreable leads
  if (distanceMiles == null || serviceRadiusMiles == null) {
    return { points: 5, withinRadius: null };
  }
  if (distanceMiles <= serviceRadiusMiles) {
    // Linear decay from 10 (at 0mi) to 0 (at radius)
    const ratio = 1 - distanceMiles / serviceRadiusMiles;
    return { points: Math.max(0, Math.round(ratio * 10)), withinRadius: true };
  }
  return { points: 0, withinRadius: false };
}

function computeKeywords(name: string | null): {
  points: number;
  matched: string | null;
} {
  if (!name) return { points: 0, matched: null };
  const lower = name.toLowerCase();
  for (const kw of SCALE_KEYWORDS) {
    if (lower.includes(kw)) {
      return { points: 10, matched: kw };
    }
  }
  return { points: 0, matched: null };
}

export function computeColdScore(input: ColdScoreInput): ColdScoreBreakdown {
  const scalePoints = computeScale(input.rating, input.reviewCount);
  const completenessPoints = computeCompleteness(
    !!input.website,
    !!input.phone,
    !!input.address,
  );

  let distance: number | null = null;
  if (
    input.businessLat != null &&
    input.businessLng != null &&
    input.primaryLat != null &&
    input.primaryLng != null
  ) {
    distance = haversineMiles(
      input.primaryLat,
      input.primaryLng,
      input.businessLat,
      input.businessLng,
    );
  }

  const distResult = computeDistance(distance, input.serviceRadiusMiles);
  const kwResult = computeKeywords(input.name);

  const total = Math.min(
    100,
    scalePoints + completenessPoints + distResult.points + kwResult.points,
  );

  return {
    total,
    scale: {
      points: scalePoints,
      maxPoints: 55,
      rating: input.rating,
      reviewCount: input.reviewCount,
    },
    completeness: {
      points: completenessPoints,
      maxPoints: 25,
      hasWebsite: !!input.website,
      hasPhone: !!input.phone,
      hasAddress: !!input.address,
    },
    distance: {
      points: distResult.points,
      maxPoints: 10,
      distanceMiles: distance,
      withinRadius: distResult.withinRadius,
    },
    keywords: {
      points: kwResult.points,
      maxPoints: 10,
      matchedKeyword: kwResult.matched,
    },
  };
}
