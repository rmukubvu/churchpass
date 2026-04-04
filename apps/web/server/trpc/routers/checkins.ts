import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { router, publicProcedure, protectedProcedure } from "../init";
import { checkins, rsvps } from "@sanctuary/db";

export const checkinsRouter = router({
  // Called by kiosk app — uses wallet pass token for lookup
  create: publicProcedure
    .input(
      z.object({
        walletPassToken: z.string(),
        eventId: z.string(),
        readerId: z.string().optional(),
        method: z
          .enum(["nfc_pass", "nfc_card", "qr", "manual"])
          .default("nfc_pass"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [rsvp] = await ctx.db
        .select()
        .from(rsvps)
        .where(eq(rsvps.walletPassToken, input.walletPassToken))
        .limit(1);

      if (!rsvp) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Invalid pass token" });
      }

      const [checkin] = await ctx.db
        .insert(checkins)
        .values({
          eventId: input.eventId,
          rsvpId: rsvp.id,
          attendeeId: rsvp.attendeeId,
          method: input.method,
          readerId: input.readerId,
        })
        .returning();

      // Mark RSVP as attended
      await ctx.db
        .update(rsvps)
        .set({ status: "attended" })
        .where(eq(rsvps.id, rsvp.id));

      return checkin;
    }),

  /** Manual check-in from the admin guest list */
  manual: protectedProcedure
    .input(z.object({ rsvpId: z.string(), eventId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const [rsvp] = await ctx.db
        .select()
        .from(rsvps)
        .where(eq(rsvps.id, input.rsvpId))
        .limit(1);

      if (!rsvp) throw new TRPCError({ code: "NOT_FOUND", message: "RSVP not found" });

      // Idempotent — return existing check-in if already done
      const [existing] = await ctx.db
        .select()
        .from(checkins)
        .where(and(eq(checkins.rsvpId, input.rsvpId), eq(checkins.eventId, input.eventId)))
        .limit(1);

      if (existing) return existing;

      const [checkin] = await ctx.db
        .insert(checkins)
        .values({
          eventId: input.eventId,
          rsvpId: rsvp.id,
          attendeeId: rsvp.attendeeId,
          method: "manual",
        })
        .returning();

      await ctx.db
        .update(rsvps)
        .set({ status: "attended" })
        .where(eq(rsvps.id, rsvp.id));

      return checkin;
    }),

  /** Undo a manual check-in */
  undoManual: protectedProcedure
    .input(z.object({ rsvpId: z.string(), eventId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(checkins)
        .where(and(eq(checkins.rsvpId, input.rsvpId), eq(checkins.eventId, input.eventId)));

      await ctx.db
        .update(rsvps)
        .set({ status: "confirmed" })
        .where(eq(rsvps.id, input.rsvpId));

      return { ok: true };
    }),

  list: protectedProcedure
    .input(z.object({ eventId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db
        .select()
        .from(checkins)
        .where(eq(checkins.eventId, input.eventId));
    }),
});
