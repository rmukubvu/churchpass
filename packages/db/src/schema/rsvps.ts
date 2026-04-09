import { pgTable, text, timestamp, boolean, pgEnum } from "drizzle-orm/pg-core";
import { events } from "./events";
import { attendees } from "./attendees";
import { ticketTiers } from "./ticket-tiers";
import { createId } from "../utils/id";

export const rsvpStatusEnum = pgEnum("rsvp_status", [
  "pending",
  "confirmed",
  "cancelled",
  "attended",
]);

export const rsvps = pgTable("rsvps", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  eventId: text("event_id")
    .notNull()
    .references(() => events.id, { onDelete: "cascade" }),
  attendeeId: text("attendee_id")
    .notNull()
    .references(() => attendees.id, { onDelete: "cascade" }),
  // Unique token embedded in wallet pass NFC payload and QR code
  walletPassToken: text("wallet_pass_token")
    .notNull()
    .unique()
    .$defaultFn(() => createId()),
  ticketTierId: text("ticket_tier_id")
    .references(() => ticketTiers.id, { onDelete: "set null" }),
  status: rsvpStatusEnum("status").notNull().default("confirmed"),
  isFirstTimer: boolean("is_first_timer").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Rsvp = typeof rsvps.$inferSelect;
export type NewRsvp = typeof rsvps.$inferInsert;
