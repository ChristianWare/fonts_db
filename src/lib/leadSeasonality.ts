export type SeasonalGuidance = {
  applicable: boolean;
  peakBookingWindow: string;
  currentSeason: "peak" | "approaching_peak" | "off_season" | "neutral";
  recommendation: string;
};

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function normalize(category: string): string {
  return category.toLowerCase().replace(/\s+/g, "_");
}

export function getSeasonalGuidance(category: string): SeasonalGuidance {
  const cat = normalize(category);
  const month = new Date().getMonth();

  if (cat.includes("wedding") || cat === "event_venues") {
    const peakBookingWindow =
      "February-May (spring/summer events) and September-October (next-year planning)";
    if (month >= 1 && month <= 4) {
      return {
        applicable: true,
        peakBookingWindow,
        currentSeason: "peak",
        recommendation: `Peak booking season (${MONTHS[month]}). Wedding venues are actively planning spring/summer events. Reach out this week — response rates are highest now.`,
      };
    }
    if (month === 8 || month === 9) {
      return {
        applicable: true,
        peakBookingWindow,
        currentSeason: "peak",
        recommendation:
          "Secondary peak — venues plan next-year galas and corporate holiday parties in fall. Strong outreach window.",
      };
    }
    if (month === 0 || month === 5) {
      return {
        applicable: true,
        peakBookingWindow,
        currentSeason: "approaching_peak",
        recommendation: `Booking season is ${month === 0 ? "starting" : "ending"}. Reach out soon to catch the active planning window.`,
      };
    }
    return {
      applicable: true,
      peakBookingWindow,
      currentSeason: "off_season",
      recommendation:
        "Off-season for wedding venue outreach. Consider waiting until February when next year's spring/summer planning kicks off — response rates roughly double in peak season.",
    };
  }

  if (cat === "hotels" || cat === "resort_spas") {
    const peakBookingWindow =
      "Year-round, with stronger response Q4 (corporate season) and March-April (conference season)";
    if ((month >= 9 && month <= 10) || (month >= 2 && month <= 3)) {
      return {
        applicable: true,
        peakBookingWindow,
        currentSeason: "peak",
        recommendation: `${month >= 9 ? "Q4 corporate travel season" : "Spring conference season"} — hotels are actively coordinating guest transportation. Strong outreach window.`,
      };
    }
    return {
      applicable: true,
      peakBookingWindow,
      currentSeason: "neutral",
      recommendation:
        "Hotels operate year-round. Reach out anytime, but expect stronger response during Q4 corporate season or spring conference season.",
    };
  }

  if (cat === "country_clubs") {
    const peakBookingWindow =
      "September-November for next-year galas and member events";
    if (month >= 8 && month <= 10) {
      return {
        applicable: true,
        peakBookingWindow,
        currentSeason: "peak",
        recommendation:
          "Peak planning season — clubs finalize next-year event calendars now. Strong outreach window.",
      };
    }
    if (month >= 5 && month <= 7) {
      return {
        applicable: true,
        peakBookingWindow,
        currentSeason: "off_season",
        recommendation:
          "Summer is light — many members traveling, club activity slower. Wait until September for stronger response.",
      };
    }
    return {
      applicable: true,
      peakBookingWindow,
      currentSeason: "neutral",
      recommendation:
        "Year-round member transportation needs. Best outreach window is September-November for next-year events.",
    };
  }

  if (cat === "funeral_homes") {
    return {
      applicable: false,
      peakBookingWindow: "No seasonal pattern",
      currentSeason: "neutral",
      recommendation:
        "Funeral homes have no seasonal booking patterns. Reach out anytime.",
    };
  }

  if (cat === "law_firms" || cat === "corporate_offices") {
    const peakBookingWindow = "Year-round, avoiding late December and mid-July";
    if (month === 11 || month === 6) {
      return {
        applicable: true,
        peakBookingWindow,
        currentSeason: "off_season",
        recommendation: `${month === 11 ? "Holiday season" : "Mid-summer"} — many decision-makers out. Wait 2-3 weeks for higher response rates.`,
      };
    }
    return {
      applicable: true,
      peakBookingWindow,
      currentSeason: "neutral",
      recommendation:
        "Year-round outreach acceptable. Avoid late December and mid-July for stronger response rates.",
    };
  }

  return {
    applicable: false,
    peakBookingWindow: "No specific seasonal pattern",
    currentSeason: "neutral",
    recommendation: "No category-specific seasonal guidance.",
  };
}
