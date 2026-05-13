// Deterministic prose generator. Takes the structured breakdown
// from computeColdScore and returns 2-4 sentences explaining the score.

import type { ColdScoreBreakdown } from "./coldScore";

export function generateColdScoreReasoning(
  breakdown: ColdScoreBreakdown,
): string {
  const parts: string[] = [];

  // Scale signal — what the rating + review count says about volume
  if (
    breakdown.scale.reviewCount == null ||
    breakdown.scale.reviewCount === 0
  ) {
    parts.push(
      "No reviews on file, so volume is unmeasurable from public signals",
    );
  } else if (breakdown.scale.points >= 40) {
    parts.push(
      `Strong volume signal — ${breakdown.scale.rating?.toFixed(1)} rating with ${breakdown.scale.reviewCount.toLocaleString()} reviews suggests an active, well-established business`,
    );
  } else if (breakdown.scale.points >= 20) {
    parts.push(
      `Moderate volume — ${breakdown.scale.rating?.toFixed(1)} rating with ${breakdown.scale.reviewCount.toLocaleString()} reviews indicates a real working business, not high-volume`,
    );
  } else {
    parts.push(
      `Limited volume — only ${breakdown.scale.reviewCount.toLocaleString()} reviews on file, which usually means a smaller operation`,
    );
  }

  // Listing completeness
  const missing: string[] = [];
  if (!breakdown.completeness.hasWebsite) missing.push("website");
  if (!breakdown.completeness.hasPhone) missing.push("phone");
  if (!breakdown.completeness.hasAddress) missing.push("full address");

  if (missing.length === 0) {
    parts.push("Complete public listing (website, phone, address)");
  } else if (missing.length === 1) {
    parts.push(`Listing missing ${missing[0]}`);
  } else {
    parts.push(`Listing missing ${missing.join(", ")}`);
  }

  // Distance
  if (breakdown.distance.distanceMiles != null) {
    const miles = breakdown.distance.distanceMiles.toFixed(1);
    if (breakdown.distance.withinRadius === true) {
      parts.push(
        `${miles} miles from your primary market — within service radius`,
      );
    } else if (breakdown.distance.withinRadius === false) {
      parts.push(
        `${miles} miles from your primary market — outside service radius, so distance is a factor`,
      );
    }
  }

  // Keyword
  if (breakdown.keywords.matchedKeyword) {
    parts.push(
      `Name includes "${breakdown.keywords.matchedKeyword}" — typical scale-signaling venue keyword`,
    );
  }

  return `Scored ${breakdown.total}/100. ${parts.join(". ")}.`;
}
