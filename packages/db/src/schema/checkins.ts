import { pgTable, text, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { events } from "./events";
import { rsvps } from "./rsvps";
import { attendees } from "./attendees";
import { createId } from "../utils/id";

export const checkinMethodEnum = pgEnum("checkin_method", [
  "nfc_pass",
  "nfc_card",
  "qr",
  "manual",
]);

export const checkins = pgTable("checkins", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  eventId: text("event_id")
    .notNull()
    .references(() => events.id, { onDelete: "cascade" }),
  rsvpId: text("rsvp_id").references(() => rsvps.id, { onDelete: "set null" }),
  attendeeId: text("attendee_id")
    .notNull()
    .references(() => attendees.id, { onDelete: "cascade" }),
  method: checkinMethodEnum("method").notNull().default("manual"),
  readerId: text("reader_id"),
  checkedInAt: timestamp("checked_in_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Checkin = typeof checkins.$inferSelect;
export type NewCheckin = typeof checkins.$inferInsert;
