import { pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { churches } from "./churches";
import { createId } from "../utils/id";

export const attendees = pgTable(
  "attendees",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    churchId: text("church_id")
      .notNull()
      .references(() => churches.id, { onDelete: "cascade" }),
    // Auth lookup key only — Clerk owns the identity, church owns the data
    clerkUserId: text("clerk_user_id").notNull(),
    email: text("email").notNull(),
    phone: text("phone"),
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    // Nullable — only set when church issues a persistent NFC credential (Phase 2)
    nfcToken: text("nfc_token").unique(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [uniqueIndex("attendees_church_clerk_idx").on(t.churchId, t.clerkUserId)]
);

export type Attendee = typeof attendees.$inferSelect;
export type NewAttendee = typeof attendees.$inferInsert;
