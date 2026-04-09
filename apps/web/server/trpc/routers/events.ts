import { z } from "zod";
import { eq, and, gte, ilike, isNull, sql } from "drizzle-orm";
import { router, publicProcedure, protectedProcedure } from "../init";
import { events, churches } from "@sanctuary/db";
import { geocodeAddress } from "@/lib/geocode";
import { createId } from "@sanctuary/db";

const categoryEnum = z.enum(["worship", "conference", "outreach", "youth", "family", "other"]);
const locationTypeEnum = z.enum(["in_person", "virtual", "hybrid"]);
const ticketTypeEnum = z.enum(["free", "paid", "donation"]);
const processingFeeModeEnum = z.enum(["absorb", "pass"]);
const recurringFrequencyEnum = z.enum(["weekly", "biweekly", "monthly"]);

export const eventsRouter = router({
  list: publicProcedure
    .input(
      z.object({
        churchSlug: z.string(),
        upcoming: z.boolean().optional().default(true),
        limit: z.number().int().min(1).max(48).default(12),
        offset: z.number().int().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const [church] = await ctx.db
        .select()
        .from(churches)
        .where(eq(churches.slug, input.churchSlug))
        .limit(1);

      if (!church) return [];

      const now = new Date();
      return ctx.db
        .select()
        .from(events)
        .where(
          and(
            eq(events.churchId, church.id),
            eq(events.isPublic, true),
            eq(events.isDraft, false),
            isNull(events.parentEventId),
            input.upcoming ? gte(events.startsAt, now) : undefined
          )
        )
        .orderBy(events.startsAt)
        .limit(input.limit)
        .offset(input.offset);
    }),

  get: publicProcedure
    .input(z.object({ eventId: z.string() }))
    .query(async ({ ctx, input }) => {
      const [event] = await ctx.db
        .select()
        .from(events)
        .where(eq(events.id, input.eventId))
        .limit(1);
      return event ?? null;
    }),

  /** Resolve a private event by its secret token */
  getByToken: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ ctx, input }) => {
      const [event] = await ctx.db
        .select()
        .from(events)
        .where(eq(events.secretToken, input.token))
        .limit(1);
      return event ?? null;
    }),

  sessions: publicProcedure
    .input(z.object({ parentEventId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db
        .select()
        .from(events)
        .where(eq(events.parentEventId, input.parentEventId))
        .orderBy(events.startsAt);
    }),

  upcomingAll: publicProcedure
    .input(z.object({
      limit: z.number().int().min(1).max(48).default(12),
      offset: z.number().int().min(0).default(0),
    }))
    .query(async ({ ctx, input }) => {
      const now = new Date();
      return ctx.db
        .select({
          event: events,
          churchSlug: churches.slug,
          churchName: churches.name,
        })
        .from(events)
        .innerJoin(churches, eq(events.churchId, churches.id))
        .where(and(
          eq(events.isPublic, true),
          eq(events.isDraft, false),
          gte(events.startsAt, now),
          isNull(events.parentEventId),
        ))
        .orderBy(events.startsAt)
        .limit(input.limit)
        .offset(input.offset);
    }),

  /** Featured events for the homepage ad slider */
  featured: publicProcedure
    .query(async ({ ctx }) => {
      const now = new Date();
      return ctx.db
        .select({
          event: events,
          churchSlug: churches.slug,
          churchName: churches.name,
        })
        .from(events)
        .innerJoin(churches, eq(events.churchId, churches.id))
        .where(and(
          eq(events.isPublic, true),
          eq(events.isDraft, false),
          gte(events.startsAt, now),
          isNull(events.parentEventId),
          sql`${events.featuredUntil} > now()`,
        ))
        .orderBy(events.featuredOrder)
        .limit(5);
    }),

  search: publicProcedure
    .input(
      z.object({
        q: z.string().optional(),
        city: z.string().optional(),
        limit: z.number().int().min(1).max(48).default(24),
      })
    )
    .query(async ({ ctx, input }) => {
      const now = new Date();
      const { q, city, limit } = input;

      const conditions = [
        eq(events.isPublic, true),
        eq(events.isDraft, false),
        gte(events.startsAt, now),
        isNull(events.parentEventId),
        q ? sql`${events.searchVector} @@ plainto_tsquery('english', ${q})` : undefined,
        city ? ilike(events.location, `%${city}%`) : undefined,
      ].filter(Boolean) as Parameters<typeof and>;

      return ctx.db
        .select({
          event: events,
          churchSlug: churches.slug,
          churchName: churches.name,
        })
        .from(events)
        .innerJoin(churches, eq(events.churchId, churches.id))
        .where(and(...conditions))
        .orderBy(events.startsAt)
        .limit(limit);
    }),

  create: protectedProcedure
    .input(
      z.object({
        churchId: z.string(),
        title: z.string().min(1).max(200),
        description: z.string().optional(),
        bannerUrl: z.string().url().optional(),
        category: categoryEnum.default("other"),
        tags: z.array(z.string()).optional().default([]),
        conditions: z.string().optional(),

        // Visibility
        visibility: z.enum(["public", "private"]).default("public"),
        isDraft: z.boolean().default(false),

        // Location
        locationType: locationTypeEnum.default("in_person"),
        location: z.string().optional(),
        locationDirections: z.string().optional(),
        locationUrl: z.string().url().optional(),
        locationTbd: z.boolean().default(false),

        // Dates
        timezone: z.string().default("UTC"),
        startsAt: z.date(),
        endsAt: z.date(),

        // Recurring
        isRecurring: z.boolean().default(false),
        recurringFrequency: recurringFrequencyEnum.optional(),
        recurringEndsAt: z.date().optional(),
        recurringEndsAfter: z.number().int().positive().optional(),

        // Parent (session)
        parentEventId: z.string().optional(),

        // Capacity & waitlist
        capacity: z.number().int().positive().optional(),
        waitlistEnabled: z.boolean().default(false),
        waitlistCapacity: z.number().int().positive().optional(),
        waitlistAutoPromote: z.boolean().default(true),

        // RSVP
        rsvpRequired: z.boolean().default(true),
        isPublic: z.boolean().default(true),

        // Ticketing
        ticketType: ticketTypeEnum.default("free"),
        processingFeeMode: processingFeeModeEnum.default("absorb"),
        donationMinimum: z.number().int().positive().optional(),
        donationSuggestedAmounts: z.array(z.number().int().positive()).optional().default([]),
        refundPolicy: z.enum(["none", "full", "custom"]).optional(),
        refundDays: z.number().int().positive().optional(),
        refundPolicyDetails: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      let coords: { latitude?: number; longitude?: number } = {};
      if (input.location) {
        const geo = await geocodeAddress(input.location).catch(() => null);
        if (geo) coords = { latitude: geo.lat, longitude: geo.lng };
      }

      // Generate secret token for private events
      const secretToken = input.visibility === "private" ? createId() : undefined;

      const [event] = await ctx.db
        .insert(events)
        .values({ ...input, ...coords, secretToken })
        .returning();
      return event;
    }),

  update: protectedProcedure
    .input(
      z.object({
        eventId: z.string(),
        title: z.string().min(1).max(200).optional(),
        description: z.string().optional(),
        bannerUrl: z.string().url().optional(),
        category: categoryEnum.optional(),
        tags: z.array(z.string()).optional(),
        conditions: z.string().optional(),

        visibility: z.enum(["public", "private"]).optional(),
        isDraft: z.boolean().optional(),

        locationType: locationTypeEnum.optional(),
        location: z.string().optional(),
        locationDirections: z.string().optional(),
        locationUrl: z.string().url().optional(),
        locationTbd: z.boolean().optional(),

        timezone: z.string().optional(),
        startsAt: z.date().optional(),
        endsAt: z.date().optional(),

        isRecurring: z.boolean().optional(),
        recurringFrequency: recurringFrequencyEnum.optional(),
        recurringEndsAt: z.date().optional(),
        recurringEndsAfter: z.number().int().positive().optional(),

        capacity: z.number().int().positive().optional(),
        waitlistEnabled: z.boolean().optional(),
        waitlistCapacity: z.number().int().positive().optional(),
        waitlistAutoPromote: z.boolean().optional(),

        rsvpRequired: z.boolean().optional(),
        isPublic: z.boolean().optional(),

        ticketType: ticketTypeEnum.optional(),
        processingFeeMode: processingFeeModeEnum.optional(),
        donationMinimum: z.number().int().positive().optional(),
        donationSuggestedAmounts: z.array(z.number().int().positive()).optional(),
        refundPolicy: z.enum(["none", "full", "custom"]).optional(),
        refundDays: z.number().int().positive().optional(),
        refundPolicyDetails: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { eventId, ...data } = input;
      let coords: { latitude?: number; longitude?: number } = {};
      if (data.location) {
        const geo = await geocodeAddress(data.location).catch(() => null);
        if (geo) coords = { latitude: geo.lat, longitude: geo.lng };
      }
      const [updated] = await ctx.db
        .update(events)
        .set({ ...data, ...coords })
        .where(eq(events.id, eventId))
        .returning();
      return updated;
    }),

  /**
   * Generate child occurrences from a recurring parent event.
   * Idempotent: skips dates that already have a child event.
   */
  generateRecurring: protectedProcedure
    .input(z.object({ parentEventId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const [parent] = await ctx.db
        .select()
        .from(events)
        .where(eq(events.id, input.parentEventId))
        .limit(1);

      if (!parent) throw new Error("Event not found");
      if (!parent.isRecurring || !parent.recurringFrequency) {
        throw new Error("Event is not recurring");
      }

      // How many ms to advance per occurrence
      const intervalMs =
        parent.recurringFrequency === "weekly" ? 7 * 86_400_000 :
        parent.recurringFrequency === "biweekly" ? 14 * 86_400_000 :
        30 * 86_400_000; // monthly (approx)

      const durationMs = parent.endsAt.getTime() - parent.startsAt.getTime();

      // Determine how many occurrences to generate
      const maxOccurrences = parent.recurringEndsAfter ?? 52; // default: 1 year
      const hardStop = parent.recurringEndsAt ?? new Date(Date.now() + 365 * 86_400_000);

      // Existing children
      const existing = await ctx.db
        .select({ startsAt: events.startsAt })
        .from(events)
        .where(eq(events.parentEventId, parent.id));

      const existingTimes = new Set(existing.map((e) => e.startsAt.getTime()));

      const toInsert: typeof events.$inferInsert[] = [];
      let cursor = parent.startsAt.getTime();

      for (let i = 0; i < maxOccurrences; i++) {
        cursor += intervalMs;
        const start = new Date(cursor);
        if (start > hardStop) break;
        if (existingTimes.has(start.getTime())) continue;

        toInsert.push({
          churchId: parent.churchId,
          parentEventId: parent.id,
          title: parent.title,
          description: parent.description,
          bannerUrl: parent.bannerUrl,
          category: parent.category,
          location: parent.location,
          latitude: parent.latitude,
          longitude: parent.longitude,
          locationType: parent.locationType,
          timezone: parent.timezone,
          startsAt: start,
          endsAt: new Date(start.getTime() + durationMs),
          capacity: parent.capacity,
          rsvpRequired: parent.rsvpRequired,
          ticketType: parent.ticketType,
          isPublic: parent.isPublic,
          visibility: parent.visibility,
        });
      }

      if (toInsert.length === 0) return [];
      return ctx.db.insert(events).values(toInsert).returning();
    }),

  /** Toggle featured status on an event (admin only) */
  setFeatured: protectedProcedure
    .input(z.object({
      eventId: z.string(),
      /** Duration in days — 0 removes featured status */
      durationDays: z.number().int().min(0).max(90),
      /** Sort position in the slider (1–5) */
      sortOrder: z.number().int().min(1).max(5).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const featuredUntil = input.durationDays > 0
        ? new Date(Date.now() + input.durationDays * 86_400_000)
        : null;
      const [updated] = await ctx.db
        .update(events)
        .set({ featuredUntil, featuredOrder: input.durationDays > 0 ? (input.sortOrder ?? 1) : null })
        .where(eq(events.id, input.eventId))
        .returning();
      return updated;
    }),
});
