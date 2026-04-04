import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { churches } from "./churches";
import { createId } from "../utils/id";

export const familyUnits = pgTable("family_units", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  churchId: text("church_id")
    .notNull()
    .references(() => churches.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const familyUnitMembers = pgTable("family_unit_members", {
  familyUnitId: text("family_unit_id")
    .notNull()
    .references(() => familyUnits.id, { onDelete: "cascade" }),
  attendeeId: text("attendee_id").notNull(),
});

export type FamilyUnit = typeof familyUnits.$inferSelect;
