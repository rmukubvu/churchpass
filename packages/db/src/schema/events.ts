import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  real,
  pgEnum,
} from "drizzle-orm/pg-core";
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

export const events = pgTable("events", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  churchId: text("church_id")
    .notNull()
    .references(() => churches.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  bannerUrl: text("banner_url"),
  location: text("location"),
  category: eventCategoryEnum("category").notNull().default("other"),
  startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
  endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
  capacity: integer("capacity"),
  latitude: real("latitude"),
  longitude: real("longitude"),
  rsvpRequired: boolean("rsvp_required").notNull().default(true),
  isPublic: boolean("is_public").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;
