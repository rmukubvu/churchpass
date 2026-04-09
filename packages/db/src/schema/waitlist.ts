import { pgTable, text, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { events } from "./events";
import { createId } from "../utils/id";

export const waitlistStatusEnum = pgEnum("waitlist_status", [
  "waiting",
  "promoted",
  "cancelled",
]);

export const waitlistEntries = pgTable("waitlist_entries", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  eventId: text("event_id")
    .notNull()
    .references(() => events.id, { onDelete: "cascade" }),

  clerkUserId: text("clerk_user_id").notNull(),
  email: text("email").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),

  status: waitlistStatusEnum("status").notNull().default("waiting"),
  promotedAt: timestamp("promoted_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type WaitlistEntry = typeof waitlistEntries.$inferSelect;
export type NewWaitlistEntry = typeof waitlistEntries.$inferInsert;
