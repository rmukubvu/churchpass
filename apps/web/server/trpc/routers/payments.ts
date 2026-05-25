import { z } from "zod";
import { eq, and, desc } from "drizzle-orm";
import { router, protectedProcedure } from "../init";
import { payments, rsvps, attendees } from "@sanctuary/db";
import { getStripe } from "@/lib/stripe";
import { requireChurchAdminForEventId } from "@/lib/auth/guards";

export const paymentsRouter = router({
  /** List all payments for an event (admin use) */
  listByEvent: protectedProcedure
    .input(z.object({ eventId: z.string() }))
    .query(async ({ ctx, input }) => {
      await requireChurchAdminForEventId(ctx.db, input.eventId);

      return ctx.db
        .select({
          payment: payments,
          rsvp: { id: rsvps.id, status: rsvps.status },
        })
        .from(payments)
        .innerJoin(rsvps, eq(rsvps.id, payments.rsvpId))
        .where(eq(rsvps.eventId, input.eventId))
        .orderBy(desc(payments.createdAt));
    }),

  /** Issue a full refund for a payment */
  refund: protectedProcedure
    .input(z.object({ paymentId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const [payment] = await ctx.db
        .select()
        .from(payments)
        .where(eq(payments.id, input.paymentId))
        .limit(1);

      if (!payment) throw new Error("Payment not found");

      const [rsvpRow] = await ctx.db
        .select({ eventId: rsvps.eventId })
        .from(rsvps)
        .where(eq(rsvps.id, payment.rsvpId))
        .limit(1);
      if (rsvpRow) {
        await requireChurchAdminForEventId(ctx.db, rsvpRow.eventId);
      }

      if (payment.status !== "succeeded") throw new Error("Payment is not refundable");

      if (!payment.stripePaymentIntentId) throw new Error("No payment intent on record");

      const stripe = getStripe();
      await stripe.refunds.create({
        payment_intent: payment.stripePaymentIntentId,
      });

      const [updated] = await ctx.db
        .update(payments)
        .set({ status: "refunded", refundedAt: new Date() })
        .where(eq(payments.id, input.paymentId))
        .returning();

      // Cancel the associated RSVP
      await ctx.db
        .update(rsvps)
        .set({ status: "cancelled" })
        .where(eq(rsvps.id, payment.rsvpId));

      return updated;
    }),

  /** Get the payment record for the current user's RSVP to an event */
  myPayment: protectedProcedure
    .input(z.object({ eventId: z.string() }))
    .query(async ({ ctx, input }) => {
      const result = await ctx.db
        .select({ payment: payments })
        .from(payments)
        .innerJoin(rsvps, eq(rsvps.id, payments.rsvpId))
        .innerJoin(attendees, eq(attendees.id, rsvps.attendeeId))
        .where(
          and(
            eq(rsvps.eventId, input.eventId),
            eq(attendees.clerkUserId, ctx.clerkUserId)
          )
        )
        .limit(1);

      return result[0]?.payment ?? null;
    }),
});
