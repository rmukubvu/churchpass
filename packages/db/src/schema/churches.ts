import { pgTable, text, timestamp, pgEnum, integer, boolean } from "drizzle-orm/pg-core";
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

export const churchLocationTypeEnum = pgEnum("church_location_type", [
  "physical",
  "virtual",
  "both",
]);

export const churches = pgTable("churches", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  logoUrl: text("logo_url"),
  bannerUrl: text("banner_url"),
  brandColour: text("brand_colour").notNull().default("#4F46E5"),
  timezone: text("timezone").notNull().default("UTC"),
  address: text("address"),
  plan: churchPlanEnum("plan").notNull().default("free"),
  ownerClerkUserId: text("owner_clerk_user_id"),

  // Profile
  description: text("description"),
  registrationDocUrl: text("registration_doc_url"),
  foundedYear: integer("founded_year"),
  website: text("website"),
  denomination: text("denomination"),
  primaryLanguage: text("primary_language").default("English"),
  otherLanguages: text("other_languages").array().default([]),
  congregationSize: text("congregation_size"), // e.g. "1-50", "51-200", "201-500", "500+"

  // Location & contact
  locationType: churchLocationTypeEnum("location_type").default("physical"),
  publicEmail: text("public_email"),
  publicPhone: text("public_phone"),

  // Social handles
  instagramHandle: text("instagram_handle"),
  twitterHandle: text("twitter_handle"),
  facebookHandle: text("facebook_handle"),
  youtubeHandle: text("youtube_handle"),

  // Stripe Connect — for paid ticket payouts
  stripeAccountId: text("stripe_account_id"),
  stripeConnectStatus: stripeConnectStatusEnum("stripe_connect_status"),

  // Meta (Facebook + Instagram) social auto-posting
  fbPageId: text("fb_page_id"),
  fbPageName: text("fb_page_name"),
  fbPageAccessToken: text("fb_page_access_token"),   // long-lived Page token (60 days)
  fbUserAccessToken: text("fb_user_access_token"),   // long-lived User token for re-auth
  fbTokenExpiresAt: timestamp("fb_token_expires_at", { withTimezone: true }),
  igAccountId: text("ig_account_id"),                // IG Business Account ID linked to Page
  autoPostFacebook: boolean("auto_post_facebook").notNull().default(false),
  autoPostInstagram: boolean("auto_post_instagram").notNull().default(false),

  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Church = typeof churches.$inferSelect;
export type NewChurch = typeof churches.$inferInsert;
