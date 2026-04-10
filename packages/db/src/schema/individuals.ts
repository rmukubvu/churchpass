import { pgTable, text, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createId } from "../utils/id";

export const individualIdTypeEnum = pgEnum("individual_id_type", [
  "passport",
  "drivers_license",
  "national_id",
  "other",
]);

export const individualRoleEnum = pgEnum("individual_role", [
  "artist",
  "musician",
  "organizer",
  "speaker",
  "volunteer",
  "other",
]);

export const individuals = pgTable("individuals", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  clerkUserId: text("clerk_user_id").notNull().unique(),

  // Identity
  legalName: text("legal_name").notNull(),
  idType: individualIdTypeEnum("id_type"),
  idDocUrl: text("id_doc_url"), // uploaded ID document URL
  description: text("description"),
  role: individualRoleEnum("role"),
  address: text("address"),

  // Profile
  profileImageUrl: text("profile_image_url"),
  website: text("website"),
  instagramHandle: text("instagram_handle"),
  twitterHandle: text("twitter_handle"),

  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Individual = typeof individuals.$inferSelect;
export type NewIndividual = typeof individuals.$inferInsert;
