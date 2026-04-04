// Church plan tiers
export type ChurchPlan = "free" | "starter" | "growth" | "network";

// Event categories
export type EventCategory =
  | "worship"
  | "conference"
  | "outreach"
  | "youth"
  | "family"
  | "other";

// RSVP status
export type RsvpStatus = "pending" | "confirmed" | "cancelled" | "attended";

// Checkin method
export type CheckinMethod = "nfc_pass" | "nfc_card" | "qr" | "manual";

// Paginated response wrapper
export type PaginatedResult<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};
