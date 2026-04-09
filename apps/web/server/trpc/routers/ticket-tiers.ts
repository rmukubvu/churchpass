import { z } from "zod";
import { eq, and, asc } from "drizzle-orm";
import { router, publicProcedure, protectedProcedure } from "../init";
import { ticketTiers } from "@sanctuary/db";

export const ticketTiersRouter = router({
  /** List all active tiers for an event */
  list: publicProcedure
    .input(z.object({ eventId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db
        .select()
        .from(ticketTiers)
        .where(and(
          eq(ticketTiers.eventId, input.eventId),
          eq(ticketTiers.isActive, true),
        ))
        .orderBy(asc(ticketTiers.sortOrder));
    }),

  /** Create or replace all tiers for an event (upsert-by-replace pattern) */
  upsert: protectedProcedure
    .input(z.object({
      eventId: z.string(),
      tiers: z.array(z.object({
        id: z.string().optional(),           // omit for new tiers
        name: z.string().min(1),
        description: z.string().optional(),
        price: z.number().int().min(0),      // cents
        capacity: z.number().int().positive().optional(),
        sortOrder: z.number().int().default(0),
        earlyBirdPrice: z.number().int().min(0).optional(),
        earlyBirdEndsAt: z.date().optional(),
      })),
    }))
    .mutation(async ({ ctx, input }) => {
      // Deactivate all existing tiers, then re-insert current set
      await ctx.db
        .update(ticketTiers)
        .set({ isActive: false })
        .where(eq(ticketTiers.eventId, input.eventId));

      if (input.tiers.length === 0) return [];

      const rows = input.tiers.map((t, i) => ({
        eventId: input.eventId,
        name: t.name,
        description: t.description,
        price: t.price,
        capacity: t.capacity,
        sortOrder: t.sortOrder ?? i,
        earlyBirdPrice: t.earlyBirdPrice,
        earlyBirdEndsAt: t.earlyBirdEndsAt,
        isActive: true,
      }));

      return ctx.db.insert(ticketTiers).values(rows).returning();
    }),

  /** Get the currently active price for a tier (respects early bird) */
  activePrice: publicProcedure
    .input(z.object({ tierId: z.string() }))
    .query(async ({ ctx, input }) => {
      const [tier] = await ctx.db
        .select()
        .from(ticketTiers)
        .where(eq(ticketTiers.id, input.tierId))
        .limit(1);

      if (!tier) return null;

      const now = new Date();
      const isEarlyBird =
        tier.earlyBirdPrice !== null &&
        tier.earlyBirdEndsAt !== null &&
        tier.earlyBirdEndsAt > now;

      return {
        ...tier,
        activePrice: isEarlyBird ? tier.earlyBirdPrice! : tier.price,
        isEarlyBird,
      };
    }),
});
