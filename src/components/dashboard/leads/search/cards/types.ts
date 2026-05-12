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
};

// Eventbrite events 15-90 days out
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
  savedState: SavedState;
  savedLeadId: string | null;
};

// Eventbrite events 0-14 days out (same shape as warm, just closer in time)
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
  savedState: SavedState;
  savedLeadId: string | null;
};

export type SearchResult = ColdLeadResult | WarmLeadResult | HotLeadResult;
