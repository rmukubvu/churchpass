import { pgTable, text, timestamp, integer, pgEnum } from "drizzle-orm/pg-core";
import { createId } from "../utils/id";

export const adStatusEnum = pgEnum("ad_status", [
  "pending_payment",  // created, awaiting Stripe payment
  "pending_review",   // paid, awaiting platform admin approval
  "approved",         // live in slider
  "rejected",         // rejected by admin
  "expired",          // past end date
  "paused",           // admin paused
]);

export const adDurationEnum = pgEnum("ad_duration", [
  "one_week",
  "two_weeks",
  "four_weeks",
]);

export const ads = pgTable("ads", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),

  // Advertiser info
  advertiserName: text("advertiser_name").notNull(),
  advertiserEmail: text("advertiser_email").notNull(),
  clerkUserId: text("clerk_user_id"),

  // Creative
  imageUrl: text("image_url").notNull(),
  headline: text("headline").notNull(),
  subheadline: text("subheadline"),
  ctaText: text("cta_text").notNull().default("Learn More"),
  clickUrl: text("click_url").notNull(),

  // Scheduling
  duration: adDurationEnum("duration").notNull().default("one_week"),
  startsAt: timestamp("starts_at", { withTimezone: true }),
  endsAt: timestamp("ends_at", { withTimezone: true }),
  sortOrder: integer("sort_order").default(99),

  // Payment
  amountPaid: integer("amount_paid"),       // cents
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  stripeSessionId: text("stripe_session_id"),

  // Status & tracking
  status: adStatusEnum("status").notNull().default("pending_payment"),
  impressions: integer("impressions").notNull().default(0),
  clicks: integer("clicks").notNull().default(0),

  // Admin
  reviewedBy: text("reviewed_by"),
  reviewNote: text("review_note"),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),

  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Ad = typeof ads.$inferSelect;
export type NewAd = typeof ads.$inferInsert;

// Pricing in pence (GBP)
export const AD_PRICES: Record<string, number> = {
  one_week: 4900,     // £49
  two_weeks: 8900,    // £89
  four_weeks: 14900,  // £149
};
