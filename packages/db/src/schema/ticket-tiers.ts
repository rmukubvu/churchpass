import { pgTable, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { events } from "./events";
import { createId } from "../utils/id";

export const ticketTiers = pgTable("ticket_tiers", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  eventId: text("event_id")
    .notNull()
    .references(() => events.id, { onDelete: "cascade" }),

  name: text("name").notNull(),           // e.g. "General Admission", "VIP", "Student"
  description: text("description"),
  price: integer("price").notNull().default(0),  // cents; 0 = free tier
  capacity: integer("capacity"),          // null = unlimited
  sortOrder: integer("sort_order").notNull().default(0),

  // Early bird
  earlyBirdPrice: integer("early_bird_price"),    // cents
  earlyBirdEndsAt: timestamp("early_bird_ends_at", { withTimezone: true }),

  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type TicketTier = typeof ticketTiers.$inferSelect;
export type NewTicketTier = typeof ticketTiers.$inferInsert;
