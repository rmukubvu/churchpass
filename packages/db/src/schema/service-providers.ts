import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  real,
  pgEnum,
} from "drizzle-orm/pg-core";
import { createId } from "../utils/id";

// ─── Enums ────────────────────────────────────────────────────────────────────

export const providerCategoryEnum = pgEnum("provider_category", [
  "av_production",    // sound, lighting, projectors
  "catering",
  "furniture_hire",   // chairs, tables, staging
  "photography",
  "videography",
  "security",
  "flowers_decor",
  "transportation",
  "printing",         // programmes, banners, lanyards
  "music",            // bands, worship teams for hire
  "other",
]);

export const providerStatusEnum = pgEnum("provider_status", [
  "pending",    // just registered, awaiting admin activation
  "active",     // publicly visible in /services
  "suspended",  // removed by admin
]);

export const inquiryStatusEnum = pgEnum("inquiry_status", [
  "sent",
  "read",
  "replied",
  "closed",
]);

// ─── service_providers ───────────────────────────────────────────────────────

export const serviceProviders = pgTable("service_providers", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),

  clerkUserId: text("clerk_user_id").notNull().unique(),

  // Identity
  businessName: text("business_name").notNull(),
  slug: text("slug").notNull().unique(),
  logoUrl: text("logo_url"),
  bannerUrl: text("banner_url"),
  description: text("description"),
  category: providerCategoryEnum("category").notNull(),

  // Location
  city: text("city").notNull(),
  country: text("country").notNull().default("GB"),
  latitude: real("latitude"),
  longitude: real("longitude"),
  serviceRadius: integer("service_radius"), // km — null = nationwide

  // Contact
  contactEmail: text("contact_email").notNull(),
  contactPhone: text("contact_phone"),
  website: text("website"),
  instagramHandle: text("instagram_handle"),

  // Pricing hint (pence GBP, displayed as "From £X")
  priceFrom: integer("price_from"),
  priceCurrency: text("price_currency").notNull().default("GBP"),

  // Verification & status
  status: providerStatusEnum("status").notNull().default("active"), // auto-approve MVP
  isVerified: boolean("is_verified").notNull().default(false),
  verifiedAt: timestamp("verified_at", { withTimezone: true }),
  verifiedBy: text("verified_by"),

  // Denormalised stats
  inquiryCount: integer("inquiry_count").notNull().default(0),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─── provider_inquiries ───────────────────────────────────────────────────────

export const providerInquiries = pgTable("provider_inquiries", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),

  providerId: text("provider_id")
    .notNull()
    .references(() => serviceProviders.id, { onDelete: "cascade" }),

  // Church context (no strict FK — church table uses text id too)
  churchId: text("church_id").notNull(),
  churchName: text("church_name").notNull(),

  // Optional event context
  eventId: text("event_id"),
  eventTitle: text("event_title"),
  eventDate: timestamp("event_date", { withTimezone: true }),

  // Inquiry body
  contactName: text("contact_name").notNull(),
  contactEmail: text("contact_email").notNull(),
  message: text("message").notNull(),
  guestCount: integer("guest_count"),

  // Status & reply
  status: inquiryStatusEnum("status").notNull().default("sent"),
  providerReply: text("provider_reply"),
  repliedAt: timestamp("replied_at", { withTimezone: true }),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─── Types ───────────────────────────────────────────────────────────────────

export type ServiceProvider = typeof serviceProviders.$inferSelect;
export type NewServiceProvider = typeof serviceProviders.$inferInsert;
export type ProviderInquiry = typeof providerInquiries.$inferSelect;
export type NewProviderInquiry = typeof providerInquiries.$inferInsert;

export const PROVIDER_CATEGORY_LABELS: Record<string, string> = {
  av_production:  "AV & Production",
  catering:       "Catering",
  furniture_hire: "Furniture Hire",
  photography:    "Photography",
  videography:    "Videography",
  security:       "Security",
  flowers_decor:  "Flowers & Décor",
  transportation: "Transportation",
  printing:       "Printing",
  music:          "Music & Worship",
  other:          "Other",
};
