import { z } from "zod";
import { eq } from "drizzle-orm";
import { router, protectedProcedure } from "../init";
import { churches } from "@sanctuary/db";

export const socialRouter = router({

  /** Returns FB + IG connection status for a church — never exposes raw tokens */
  getConnections: protectedProcedure
    .input(z.object({ churchSlug: z.string() }))
    .query(async ({ ctx, input }) => {
      const [church] = await ctx.db
        .select({
          fbPageId: churches.fbPageId,
          fbPageName: churches.fbPageName,
          igAccountId: churches.igAccountId,
          autoPostFacebook: churches.autoPostFacebook,
          autoPostInstagram: churches.autoPostInstagram,
          fbTokenExpiresAt: churches.fbTokenExpiresAt,
        })
        .from(churches)
        .where(eq(churches.slug, input.churchSlug))
        .limit(1);

      if (!church) return null;

      return {
        fbConnected: !!church.fbPageId,
        fbPageName: church.fbPageName ?? null,
        igConnected: !!church.igAccountId,
        autoPostFacebook: church.autoPostFacebook,
        autoPostInstagram: church.autoPostInstagram,
        tokenExpiresAt: church.fbTokenExpiresAt ?? null,
        // Warn if expiring within 7 days
        tokenExpiringSoon: church.fbTokenExpiresAt
          ? church.fbTokenExpiresAt.getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000
          : false,
      };
    }),

  /** Update auto-post preferences */
  setAutoPost: protectedProcedure
    .input(z.object({
      churchSlug: z.string(),
      facebook: z.boolean(),
      instagram: z.boolean(),
    }))
    .mutation(async ({ ctx, input }) => {
      const [church] = await ctx.db
        .select({ id: churches.id, igAccountId: churches.igAccountId })
        .from(churches)
        .where(eq(churches.slug, input.churchSlug))
        .limit(1);

      if (!church) throw new Error("Church not found");

      await ctx.db
        .update(churches)
        .set({
          autoPostFacebook: input.facebook,
          // Can only enable IG auto-post if IG account is connected
          autoPostInstagram: input.instagram && !!church.igAccountId,
        })
        .where(eq(churches.id, church.id));
    }),

  /** Disconnect Facebook (and by extension Instagram) */
  disconnectAccount: protectedProcedure
    .input(z.object({ churchSlug: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const [church] = await ctx.db
        .select({ id: churches.id })
        .from(churches)
        .where(eq(churches.slug, input.churchSlug))
        .limit(1);

      if (!church) throw new Error("Church not found");

      await ctx.db
        .update(churches)
        .set({
          fbPageId: null,
          fbPageName: null,
          fbPageAccessToken: null,
          fbUserAccessToken: null,
          fbTokenExpiresAt: null,
          igAccountId: null,
          autoPostFacebook: false,
          autoPostInstagram: false,
        })
        .where(eq(churches.id, church.id));
    }),
});
