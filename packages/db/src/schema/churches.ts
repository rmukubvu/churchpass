import { pgTable, text, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createId } from "../utils/id";

export const churchPlanEnum = pgEnum("church_plan", [
  "free",
  "starter",
  "growth",
  "network",
]);

export const stripeConnectStatusEnum = pgEnum("stripe_connect_status", [
  "pending",
  "active",
  "restricted",
]);

export const churches = pgTable("churches", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  logoUrl: text("logo_url"),
  brandColour: text("brand_colour").notNull().default("#4F46E5"),
  timezone: text("timezone").notNull().default("UTC"),
  address: text("address"),
  plan: churchPlanEnum("plan").notNull().default("free"),
  ownerClerkUserId: text("owner_clerk_user_id"),

  // Stripe Connect — for paid ticket payouts
  stripeAccountId: text("stripe_account_id"),
  stripeConnectStatus: stripeConnectStatusEnum("stripe_connect_status"),

  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Church = typeof churches.$inferSelect;
export type NewChurch = typeof churches.$inferInsert;
