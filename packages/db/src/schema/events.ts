import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  real,
  pgEnum,
  customType,
  jsonb,
} from "drizzle-orm/pg-core";

const tsvector = customType<{ data: string }>({
  dataType() { return "tsvector"; },
});
import type { AnyPgColumn } from "drizzle-orm/pg-core";
import { churches } from "./churches";
import { createId } from "../utils/id";

export const eventCategoryEnum = pgEnum("event_category", [
  "worship",
  "conference",
  "outreach",
  "youth",
  "family",
  "other",
]);

export const eventVisibilityEnum = pgEnum("event_visibility", [
  "public",
  "private",
]);

export const locationTypeEnum = pgEnum("location_type", [
  "in_person",
  "virtual",
  "hybrid",
]);

export const ticketTypeEnum = pgEnum("ticket_type", [
  "free",
  "paid",
  "donation",
]);

export const processingFeeModeEnum = pgEnum("processing_fee_mode", [
  "absorb",
  "pass",
]);

export const recurringFrequencyEnum = pgEnum("recurring_frequency", [
  "weekly",
  "biweekly",
  "monthly",
]);

export const events = pgTable("events", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  churchId: text("church_id")
    .notNull()
    .references(() => churches.id, { onDelete: "cascade" }),

  // Content
  title: text("title").notNull(),
  description: text("description"),
  bannerUrl: text("banner_url"),
  category: eventCategoryEnum("category").notNull().default("other"),
  tags: text("tags").array().default([]),
  conditions: text("conditions"),

  // Visibility
  visibility: eventVisibilityEnum("visibility").notNull().default("public"),
  secretToken: text("secret_token").unique(),
  isDraft: boolean("is_draft").notNull().default(false),

  // Location
  locationType: locationTypeEnum("location_type").notNull().default("in_person"),
  location: text("location"),           // venue name + address (in_person / hybrid)
  locationDirections: text("location_directions"), // directions / extra info
  locationUrl: text("location_url"),    // meeting link (virtual / hybrid) — hidden pre-RSVP
  locationTbd: boolean("location_tbd").notNull().default(false),
  latitude: real("latitude"),
  longitude: real("longitude"),

  // Dates
  timezone: text("timezone").notNull().default("UTC"),
  startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
  endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),

  // Recurring
  isRecurring: boolean("is_recurring").notNull().default(false),
  recurringFrequency: recurringFrequencyEnum("recurring_frequency"),
  recurringEndsAt: timestamp("recurring_ends_at", { withTimezone: true }),
  recurringEndsAfter: integer("recurring_ends_after"), // N occurrences

  // Sessions (multi-session parent/child)
  parentEventId: text("parent_event_id").references((): AnyPgColumn => events.id, { onDelete: "cascade" }),

  // Capacity & waitlist
  capacity: integer("capacity"),
  waitlistEnabled: boolean("waitlist_enabled").notNull().default(false),
  waitlistCapacity: integer("waitlist_capacity"),
  waitlistAutoPromote: boolean("waitlist_auto_promote").notNull().default(true),

  // RSVP
  rsvpRequired: boolean("rsvp_required").notNull().default(true),

  // Ticketing
  ticketType: ticketTypeEnum("ticket_type").notNull().default("free"),
  processingFeeMode: processingFeeModeEnum("processing_fee_mode").notNull().default("absorb"),
  donationMinimum: integer("donation_minimum"),          // cents
  donationSuggestedAmounts: integer("donation_suggested_amounts").array().default([]), // cents
  refundPolicy: text("refund_policy"),                   // none | full | custom
  refundDays: integer("refund_days"),                    // full refund up to N days before
  refundPolicyDetails: text("refund_policy_details"),    // shown at checkout

  // Featured (Phase 3)
  featuredUntil: timestamp("featured_until", { withTimezone: true }),
  featuredOrder: integer("featured_order"),

  // Search
  searchVector: tsvector("search_vector"),

  isPublic: boolean("is_public").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;
