import { z } from "zod";
import { eq, and, gte, desc, ilike, or, isNull } from "drizzle-orm";
import { router, publicProcedure, protectedProcedure } from "../init";
import { events, churches } from "@sanctuary/db";
import { geocodeAddress } from "@/lib/geocode";

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
      const church = await ctx.db
        .select()
        .from(churches)
        .where(eq(churches.slug, input.churchSlug))
        .limit(1);

      if (!church[0]) return [];

      const now = new Date();
      return ctx.db
        .select()
        .from(events)
        .where(
          and(
            eq(events.churchId, church[0].id),
            eq(events.isPublic, true),
            isNull(events.parentEventId),
            input.upcoming ? gte(events.startsAt, now) : undefined
          )
        )
        .orderBy(desc(events.startsAt))
        .limit(input.limit)
        .offset(input.offset);
    }),

  get: publicProcedure
    .input(z.object({ eventId: z.string() }))
    .query(async ({ ctx, input }) => {
      const result = await ctx.db
        .select()
        .from(events)
        .where(eq(events.id, input.eventId))
        .limit(1);
      return result[0] ?? null;
    }),

  /** Fetch all sessions for a parent event, ordered by start time */
  sessions: publicProcedure
    .input(z.object({ parentEventId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db
        .select()
        .from(events)
        .where(eq(events.parentEventId, input.parentEventId))
        .orderBy(events.startsAt);
    }),

  /** All upcoming public events across every church — for home feed */
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
        .where(and(eq(events.isPublic, true), gte(events.startsAt, now), isNull(events.parentEventId)))
        .orderBy(events.startsAt)
        .limit(input.limit)
        .offset(input.offset);
    }),

  /** Full-text search across all churches, with optional city filter */
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
        gte(events.startsAt, now),
        q
          ? or(
              ilike(events.title, `%${q}%`),
              ilike(events.location, `%${q}%`),
              ilike(events.description, `%${q}%`)
            )
          : undefined,
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
        location: z.string().optional(),
        category: z
          .enum(["worship", "conference", "outreach", "youth", "family", "other"])
          .default("other"),
        startsAt: z.date(),
        endsAt: z.date(),
        capacity: z.number().int().positive().optional(),
        rsvpRequired: z.boolean().default(true),
        isPublic: z.boolean().default(true),
      })
    )
    .mutation(async ({ ctx, input }) => {
      let coords: { latitude?: number; longitude?: number } = {};
      if (input.location) {
        const geo = await geocodeAddress(input.location).catch(() => null);
        if (geo) coords = { latitude: geo.lat, longitude: geo.lng };
      }
      const [event] = await ctx.db
        .insert(events)
        .values({ ...input, ...coords })
        .returning();
      return event;
    }),

  update: protectedProcedure
    .input(
      z.object({
        eventId: z.string(),
        title: z.string().min(1).max(200).optional(),
        description: z.string().optional(),
        location: z.string().optional(),
        category: z
          .enum(["worship", "conference", "outreach", "youth", "family", "other"])
          .optional(),
        startsAt: z.date().optional(),
        endsAt: z.date().optional(),
        capacity: z.number().int().positive().optional(),
        rsvpRequired: z.boolean().optional(),
        isPublic: z.boolean().optional(),
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
});
