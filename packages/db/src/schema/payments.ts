import { pgTable, text, integer, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { rsvps } from "./rsvps";
import { createId } from "../utils/id";

export const paymentStatusEnum = pgEnum("payment_status", [
  "pending",
  "succeeded",
  "refunded",
  "failed",
]);

export const payments = pgTable("payments", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  rsvpId: text("rsvp_id")
    .notNull()
    .references(() => rsvps.id, { onDelete: "cascade" }),

  stripePaymentIntentId: text("stripe_payment_intent_id").unique(),
  stripeAccountId: text("stripe_account_id"), // church's connected account

  amountTotal: integer("amount_total").notNull(),  // cents — what attendee paid
  amountFee: integer("amount_fee").notNull(),       // cents — platform 2% cut
  currency: text("currency").notNull().default("gbp"),

  status: paymentStatusEnum("status").notNull().default("pending"),
  refundedAt: timestamp("refunded_at", { withTimezone: true }),

  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;
