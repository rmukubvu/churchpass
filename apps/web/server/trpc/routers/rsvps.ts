import { z } from "zod";
import { eq, and, inArray } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { currentUser } from "@clerk/nextjs/server";
import { router, protectedProcedure } from "../init";
import { rsvps, attendees, events, churches, type Db } from "@sanctuary/db";
import { sendRsvpConfirmation } from "@/lib/sendgrid";
import { sendRsvpSms } from "@/lib/sms";
import { checkInUrl } from "@/lib/qrcode";

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

/** Upsert the attendee record with real Clerk profile data */
async function syncAttendee(
  db: Db,
  churchId: string,
  clerkUserId: string
) {
  const user = await currentUser();

  const email = user?.emailAddresses?.[0]?.emailAddress ?? "";
  const firstName = user?.firstName ?? "";
  const lastName = user?.lastName ?? "";

  const [attendee] = await db
    .insert(attendees)
    .values({ churchId, clerkUserId, email, firstName, lastName })
    .onConflictDoUpdate({
      target: [attendees.churchId, attendees.clerkUserId],
      set: { email, firstName, lastName },
    })
    .returning();

  if (!attendee) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to sync attendee" });

  return { attendee, email, firstName, lastName };
}

export const rsvpsRouter = router({
  /** Single-event RSVP (existing — now with Clerk profile sync) */
  create: protectedProcedure
    .input(z.object({ eventId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const [event] = await ctx.db
        .select()
        .from(events)
        .where(eq(events.id, input.eventId))
        .limit(1);

      if (!event) throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" });

      // Fetch church for email
      const [church] = await ctx.db
        .select({ name: churches.name, slug: churches.slug })
        .from(churches)
        .where(eq(churches.id, event.churchId))
        .limit(1);

      const { attendee, email, firstName } = await syncAttendee(
        ctx.db,
        event.churchId,
        ctx.clerkUserId
      );

      const isFirstTimer = false;

      const [existing] = await ctx.db
        .select()
        .from(rsvps)
        .where(and(eq(rsvps.eventId, input.eventId), eq(rsvps.attendeeId, attendee.id)))
        .limit(1);

      if (existing) return existing;

      const [rsvp] = await ctx.db
        .insert(rsvps)
        .values({ eventId: input.eventId, attendeeId: attendee.id, isFirstTimer })
        .returning();

      const singleEventPayload = {
        id: event.id,
        title: event.title,
        startsAt: event.startsAt,
        endsAt: event.endsAt ?? null,
        location: event.location ?? null,
        bannerUrl: event.bannerUrl ?? null,
        conditions: event.conditions ?? null,
      };

      // Send confirmation email with QR code (non-blocking)
      sendRsvpConfirmation({
        firstName: firstName || "there",
        email,
        churchName: church?.name ?? "",
        churchSlug: church?.slug ?? "",
        events: [singleEventPayload],
        walletPassTokens: [rsvp!.walletPassToken],
        appUrl,
      }).catch((err) => console.error("[rsvp.create] email error:", err));

      // Send SMS confirmation (non-blocking)
      const attendeeRecord = await ctx.db
        .select({ phone: attendees.phone })
        .from(attendees)
        .where(eq(attendees.id, attendee.id))
        .limit(1);

      if (attendeeRecord[0]?.phone) {
        sendRsvpSms({
          toPhone: attendeeRecord[0].phone,
          firstName: firstName || "there",
          churchName: church?.name ?? "",
          events: [{
            title: event.title,
            startsAt: event.startsAt,
            checkInUrl: checkInUrl(rsvp!.walletPassToken),
          }],
        }).catch((err) => console.error("[rsvp.create] sms error:", err));
      }

      return rsvp;
    }),

  /** Batch RSVP — select multiple events at once */
  createBatch: protectedProcedure
    .input(
      z.object({
        eventIds: z.array(z.string()).min(1).max(20),
        churchSlug: z.string(),
        churchName: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { eventIds, churchSlug, churchName } = input;

      // 1. Load all requested events
      const foundEvents = await ctx.db
        .select()
        .from(events)
        .where(inArray(events.id, eventIds));

      if (!foundEvents.length)
        throw new TRPCError({ code: "NOT_FOUND", message: "No events found" });

      // All events must belong to the same church (security check)
      const churchId = foundEvents[0]!.churchId;
      if (foundEvents.some((e) => e.churchId !== churchId)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Events must belong to the same church" });
      }

      // 2. Upsert attendee with Clerk profile
      const { attendee, email, firstName } = await syncAttendee(
        ctx.db,
        churchId,
        ctx.clerkUserId
      );

      // 3. Check which RSVPs already exist
      const existingRsvps = await ctx.db
        .select({ eventId: rsvps.eventId })
        .from(rsvps)
        .where(
          and(
            inArray(rsvps.eventId, eventIds),
            eq(rsvps.attendeeId, attendee.id)
          )
        );

      const alreadyRsvpd = new Set(existingRsvps.map((r) => r.eventId));
      const newEventIds = eventIds.filter((id) => !alreadyRsvpd.has(id));

      // 4. Insert new RSVPs
      let newRsvps: any[] = [];
      if (newEventIds.length > 0) {
        newRsvps = await ctx.db
          .insert(rsvps)
          .values(
            newEventIds.map((eventId) => ({
              eventId,
              attendeeId: attendee.id,
              isFirstTimer: false,
            }))
          )
          .returning();
      }

      // 5. Fetch all RSVPs (existing + new) to get walletPassTokens for QR codes
      const allRsvps = await ctx.db
        .select({ eventId: rsvps.eventId, walletPassToken: rsvps.walletPassToken })
        .from(rsvps)
        .where(
          and(
            inArray(rsvps.eventId, eventIds),
            eq(rsvps.attendeeId, attendee.id)
          )
        );

      const tokenByEventId = new Map(allRsvps.map((r) => [r.eventId, r.walletPassToken]));

      // 6. Send confirmation email for ALL selected events (including already-RSVPd)
      const emailEvents = foundEvents.map((e) => ({
        id: e.id,
        title: e.title,
        startsAt: e.startsAt,
        endsAt: e.endsAt ?? null,
        location: e.location ?? null,
        bannerUrl: e.bannerUrl ?? null,
        conditions: e.conditions ?? null,
      }));

      const walletPassTokens = foundEvents.map((e) => tokenByEventId.get(e.id) ?? null);

      sendRsvpConfirmation({
        firstName: firstName || "there",
        email,
        churchName,
        churchSlug,
        events: emailEvents,
        walletPassTokens,
        appUrl,
      }).catch((err) => console.error("[rsvp.createBatch] email error:", err));

      // Send SMS (non-blocking)
      const attendeePhone = await ctx.db
        .select({ phone: attendees.phone })
        .from(attendees)
        .where(eq(attendees.id, attendee.id))
        .limit(1);

      if (attendeePhone[0]?.phone) {
        sendRsvpSms({
          toPhone: attendeePhone[0].phone,
          firstName: firstName || "there",
          churchName,
          events: foundEvents.map((e) => {
            const token = tokenByEventId.get(e.id);
            const entry: { title: string; startsAt: Date; checkInUrl?: string } = {
              title: e.title,
              startsAt: e.startsAt,
            };
            if (token) entry.checkInUrl = checkInUrl(token);
            return entry;
          }),
        }).catch((err) => console.error("[rsvp.createBatch] sms error:", err));
      }

      return {
        created: newRsvps.length,
        alreadyExisted: alreadyRsvpd.size,
        total: eventIds.length,
      };
    }),

  list: protectedProcedure
    .input(z.object({ eventId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db
        .select()
        .from(rsvps)
        .where(eq(rsvps.eventId, input.eventId));
    }),

  cancel: protectedProcedure
    .input(z.object({ rsvpId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const [updated] = await ctx.db
        .update(rsvps)
        .set({ status: "cancelled" })
        .where(eq(rsvps.id, input.rsvpId))
        .returning();
      return updated;
    }),
});
