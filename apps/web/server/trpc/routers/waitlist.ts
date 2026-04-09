import { z } from "zod";
import { eq, and, count } from "drizzle-orm";
import { router, protectedProcedure, publicProcedure } from "../init";
import { waitlistEntries, events, rsvps } from "@sanctuary/db";

export const waitlistRouter = router({
  /** Join the waitlist for an event */
  join: protectedProcedure
    .input(z.object({
      eventId: z.string(),
      email: z.string().email(),
      firstName: z.string(),
      lastName: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Prevent duplicate entries
      const [existing] = await ctx.db
        .select()
        .from(waitlistEntries)
        .where(and(
          eq(waitlistEntries.eventId, input.eventId),
          eq(waitlistEntries.clerkUserId, ctx.clerkUserId),
        ))
        .limit(1);

      if (existing) return existing;

      const [entry] = await ctx.db
        .insert(waitlistEntries)
        .values({
          eventId: input.eventId,
          clerkUserId: ctx.clerkUserId,
          email: input.email,
          firstName: input.firstName,
          lastName: input.lastName,
        })
        .returning();

      return entry;
    }),

  /** Cancel a waitlist spot */
  cancel: protectedProcedure
    .input(z.object({ entryId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const [updated] = await ctx.db
        .update(waitlistEntries)
        .set({ status: "cancelled" })
        .where(and(
          eq(waitlistEntries.id, input.entryId),
          eq(waitlistEntries.clerkUserId, ctx.clerkUserId),
        ))
        .returning();
      return updated;
    }),

  /** Promote the next person on the waitlist (called when an RSVP is cancelled) */
  promoteNext: protectedProcedure
    .input(z.object({ eventId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const [next] = await ctx.db
        .select()
        .from(waitlistEntries)
        .where(and(
          eq(waitlistEntries.eventId, input.eventId),
          eq(waitlistEntries.status, "waiting"),
        ))
        .orderBy(waitlistEntries.createdAt)
        .limit(1);

      if (!next) return null;

      const [promoted] = await ctx.db
        .update(waitlistEntries)
        .set({ status: "promoted", promotedAt: new Date() })
        .where(eq(waitlistEntries.id, next.id))
        .returning();

      // TODO: send promotion email via SendGrid
      return promoted;
    }),

  /** Check if the current user is on the waitlist for an event */
  myStatus: protectedProcedure
    .input(z.object({ eventId: z.string() }))
    .query(async ({ ctx, input }) => {
      const [entry] = await ctx.db
        .select()
        .from(waitlistEntries)
        .where(and(
          eq(waitlistEntries.eventId, input.eventId),
          eq(waitlistEntries.clerkUserId, ctx.clerkUserId),
        ))
        .limit(1);
      return entry ?? null;
    }),

  /** Count of people waiting (public — shown on event page) */
  count: publicProcedure
    .input(z.object({ eventId: z.string() }))
    .query(async ({ ctx, input }) => {
      const [result] = await ctx.db
        .select({ count: count() })
        .from(waitlistEntries)
        .where(and(
          eq(waitlistEntries.eventId, input.eventId),
          eq(waitlistEntries.status, "waiting"),
        ));
      return result?.count ?? 0;
    }),
});
