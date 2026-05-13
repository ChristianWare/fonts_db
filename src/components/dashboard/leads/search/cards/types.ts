export type Temperature = "hot" | "warm" | "cold";
export type SavedState = "none" | "favorite" | "pipeline" | "saved";

export type ColdLeadResult = {
  temperature: "cold";
  placeId: string;
  name: string;
  address: string;
  coordinates: { lat: number; lng: number };
  rating: number | null;
  reviewCount: number | null;
  phone: string | null;
  website: string | null;
  types: string[];
  savedState: SavedState;
  savedLeadId: string | null;
  category: string;
  contactReady: boolean;
  aiScore: number | null;
  aiScoreReasoning: string | null;
};

export type WarmLeadResult = {
  temperature: "warm";
  source: "eventbrite";
  externalId: string;
  eventName: string;
  eventDateIso: string;
  venue: string | null;
  attendeeCount: number | null;
  organizerName: string | null;
  organizerEmail: string | null;
  organizerPhone: string | null;
  url: string;
  category: string;
  aiScore: number | null;
  savedState: SavedState;
  savedLeadId: string | null;
  contactReady: boolean;
};

export type HotLeadResult = {
  temperature: "hot";
  source: "eventbrite";
  externalId: string;
  eventName: string;
  eventDateIso: string;
  venue: string | null;
  attendeeCount: number | null;
  organizerName: string | null;
  organizerEmail: string | null;
  organizerPhone: string | null;
  url: string;
  category: string;
  aiScore: number | null;
  savedState: SavedState;
  savedLeadId: string | null;
  contactReady: boolean;
};

export type SearchResult = ColdLeadResult | WarmLeadResult | HotLeadResult;
