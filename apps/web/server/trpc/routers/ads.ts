import { z } from "zod";
import { eq, and, lte, gte, desc, sql } from "drizzle-orm";
import { router, publicProcedure, protectedProcedure } from "../init";
import { ads, AD_PRICES } from "@sanctuary/db";

const now = () => new Date();

export const adsRouter = router({
  /** Live approved ads for the homepage slider */
  live: publicProcedure.query(async ({ ctx }) => {
    const n = now();
    return ctx.db
      .select()
      .from(ads)
      .where(
        and(
          eq(ads.status, "approved"),
          lte(ads.startsAt, n),
          gte(ads.endsAt, n),
        )
      )
      .orderBy(ads.sortOrder)
      .limit(5);
  }),

  /** Record a click on an ad (fire-and-forget from client) */
  recordClick: publicProcedure
    .input(z.object({ adId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(ads)
        .set({ clicks: sql`${ads.clicks} + 1` })
        .where(eq(ads.id, input.adId));
    }),

  /** Record an impression (called by slider on mount) */
  recordImpression: publicProcedure
    .input(z.object({ adId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(ads)
        .set({ impressions: sql`${ads.impressions} + 1` })
        .where(eq(ads.id, input.adId));
    }),

  /** Advertiser: get their own ads */
  mine: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db
      .select()
      .from(ads)
      .where(eq(ads.clerkUserId, ctx.clerkUserId))
      .orderBy(desc(ads.createdAt));
  }),

  /** Platform admin: all ads pending review */
  pendingReview: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db
      .select()
      .from(ads)
      .where(eq(ads.status, "pending_review"))
      .orderBy(ads.createdAt);
  }),

  /** Platform admin: all ads */
  all: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db
      .select()
      .from(ads)
      .orderBy(desc(ads.createdAt))
      .limit(100);
  }),

  /** Platform admin: approve an ad */
  approve: protectedProcedure
    .input(z.object({ adId: z.string(), sortOrder: z.number().int().min(1).max(10).default(5) }))
    .mutation(async ({ ctx, input }) => {
      const [ad] = await ctx.db.select().from(ads).where(eq(ads.id, input.adId)).limit(1);
      if (!ad) throw new Error("Ad not found");

      const durationDays = ad.duration === "one_week" ? 7 : ad.duration === "two_weeks" ? 14 : 28;
      const startsAt = new Date();
      const endsAt = new Date(Date.now() + durationDays * 86_400_000);

      const [updated] = await ctx.db
        .update(ads)
        .set({
          status: "approved",
          startsAt,
          endsAt,
          sortOrder: input.sortOrder,
          reviewedBy: ctx.clerkUserId,
          reviewedAt: new Date(),
        })
        .where(eq(ads.id, input.adId))
        .returning();
      return updated;
    }),

  /** Platform admin: reject an ad */
  reject: protectedProcedure
    .input(z.object({ adId: z.string(), reason: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const [updated] = await ctx.db
        .update(ads)
        .set({
          status: "rejected",
          reviewedBy: ctx.clerkUserId,
          reviewNote: input.reason ?? null,
          reviewedAt: new Date(),
        })
        .where(eq(ads.id, input.adId))
        .returning();
      return updated;
    }),

  /** Get pricing info (public) */
  pricing: publicProcedure.query(() => AD_PRICES),
});
