import { z } from "zod";
import { eq, and, ilike, or, desc, sql } from "drizzle-orm";
import { router, publicProcedure, protectedProcedure } from "../init";
import {
  serviceProviders,
  providerInquiries,
  providerCategoryEnum,
  PROVIDER_CATEGORY_LABELS,
} from "@sanctuary/db";

const categoryValues = Object.keys(PROVIDER_CATEGORY_LABELS) as [string, ...string[]];

export const providersRouter = router({

  // ─── Public ──────────────────────────────────────────────────────────────

  /** Public directory — search by category + city + text */
  list: publicProcedure
    .input(z.object({
      category: z.enum(categoryValues as [string, ...string[]]).optional(),
      city: z.string().optional(),
      q: z.string().optional(),
      limit: z.number().int().min(1).max(48).default(24),
      offset: z.number().int().min(0).default(0),
    }))
    .query(async ({ ctx, input }) => {
      const conditions = [eq(serviceProviders.status, "active")];

      if (input.category) {
        conditions.push(
          eq(serviceProviders.category, input.category as typeof serviceProviders.category._.data)
        );
      }
      if (input.city) {
        conditions.push(ilike(serviceProviders.city, `%${input.city}%`));
      }
      if (input.q) {
        conditions.push(
          or(
            ilike(serviceProviders.businessName, `%${input.q}%`),
            ilike(serviceProviders.description, `%${input.q}%`),
          )!
        );
      }

      return ctx.db
        .select()
        .from(serviceProviders)
        .where(and(...conditions))
        .orderBy(desc(serviceProviders.isVerified), desc(serviceProviders.inquiryCount))
        .limit(input.limit)
        .offset(input.offset);
    }),

  /** Single provider by slug */
  get: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      const [provider] = await ctx.db
        .select()
        .from(serviceProviders)
        .where(and(
          eq(serviceProviders.slug, input.slug),
          eq(serviceProviders.status, "active"),
        ))
        .limit(1);
      return provider ?? null;
    }),

  /** Up to 6 active providers near an event city — for the event creation form */
  nearEvent: publicProcedure
    .input(z.object({
      city: z.string(),
      category: z.enum(categoryValues as [string, ...string[]]).optional(),
    }))
    .query(async ({ ctx, input }) => {
      const conditions = [
        eq(serviceProviders.status, "active"),
        ilike(serviceProviders.city, `%${input.city}%`),
      ];
      if (input.category) {
        conditions.push(
          eq(serviceProviders.category, input.category as typeof serviceProviders.category._.data)
        );
      }
      return ctx.db
        .select()
        .from(serviceProviders)
        .where(and(...conditions))
        .orderBy(desc(serviceProviders.isVerified), desc(serviceProviders.inquiryCount))
        .limit(6);
    }),

  // ─── Provider self-service ────────────────────────────────────────────────

  /** Register as a service provider */
  register: protectedProcedure
    .input(z.object({
      businessName: z.string().min(1).max(200),
      slug: z.string().min(2).max(80).regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers and hyphens only"),
      category: z.enum(categoryValues as [string, ...string[]]),
      description: z.string().max(2000).optional(),
      city: z.string().min(1).max(200),
      country: z.string().default("GB"),
      contactEmail: z.string().email(),
      contactPhone: z.string().optional(),
      website: z.string().url().optional(),
      instagramHandle: z.string().optional(),
      priceFrom: z.number().int().positive().optional(),
      serviceRadius: z.number().int().positive().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Check slug not taken
      const [existing] = await ctx.db
        .select({ id: serviceProviders.id })
        .from(serviceProviders)
        .where(eq(serviceProviders.slug, input.slug))
        .limit(1);
      if (existing) throw new Error("That URL handle is already taken — please choose another.");

      const [provider] = await ctx.db
        .insert(serviceProviders)
        .values({
          clerkUserId: ctx.clerkUserId,
          businessName: input.businessName,
          slug: input.slug,
          category: input.category as typeof serviceProviders.category._.data,
          description: input.description ?? null,
          city: input.city,
          country: input.country,
          contactEmail: input.contactEmail,
          contactPhone: input.contactPhone ?? null,
          website: input.website ?? null,
          instagramHandle: input.instagramHandle ?? null,
          priceFrom: input.priceFrom ?? null,
          serviceRadius: input.serviceRadius ?? null,
          status: "active",
        })
        .returning();
      return provider;
    }),

  /** Update own profile */
  update: protectedProcedure
    .input(z.object({
      providerId: z.string(),
      businessName: z.string().min(1).max(200).optional(),
      description: z.string().max(2000).optional(),
      city: z.string().min(1).max(200).optional(),
      contactEmail: z.string().email().optional(),
      contactPhone: z.string().optional(),
      website: z.string().url().optional(),
      instagramHandle: z.string().optional(),
      priceFrom: z.number().int().positive().optional(),
      serviceRadius: z.number().int().positive().optional(),
      logoUrl: z.string().url().optional(),
      bannerUrl: z.string().url().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const [provider] = await ctx.db
        .select({ clerkUserId: serviceProviders.clerkUserId })
        .from(serviceProviders)
        .where(eq(serviceProviders.id, input.providerId))
        .limit(1);
      if (!provider || provider.clerkUserId !== ctx.clerkUserId) {
        throw new Error("Not authorised");
      }

      const { providerId, ...fields } = input;
      const [updated] = await ctx.db
        .update(serviceProviders)
        .set({ ...fields, updatedAt: new Date() })
        .where(eq(serviceProviders.id, providerId))
        .returning();
      return updated;
    }),

  /** Own profile (for dashboard) */
  myProfile: protectedProcedure
    .query(async ({ ctx }) => {
      const [provider] = await ctx.db
        .select()
        .from(serviceProviders)
        .where(eq(serviceProviders.clerkUserId, ctx.clerkUserId))
        .limit(1);
      return provider ?? null;
    }),

  // ─── Inquiries ────────────────────────────────────────────────────────────

  /** Church sends an inquiry to a provider */
  sendInquiry: protectedProcedure
    .input(z.object({
      providerId: z.string(),
      churchId: z.string(),
      churchName: z.string(),
      eventId: z.string().optional(),
      eventTitle: z.string().optional(),
      eventDate: z.date().optional(),
      contactName: z.string().min(1),
      contactEmail: z.string().email(),
      message: z.string().min(10).max(2000),
      guestCount: z.number().int().positive().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const [inquiry] = await ctx.db
        .insert(providerInquiries)
        .values({
          providerId: input.providerId,
          churchId: input.churchId,
          churchName: input.churchName,
          eventId: input.eventId ?? null,
          eventTitle: input.eventTitle ?? null,
          eventDate: input.eventDate ?? null,
          contactName: input.contactName,
          contactEmail: input.contactEmail,
          message: input.message,
          guestCount: input.guestCount ?? null,
        })
        .returning();

      // Increment inquiry counter
      await ctx.db
        .update(serviceProviders)
        .set({ inquiryCount: sql`${serviceProviders.inquiryCount} + 1` })
        .where(eq(serviceProviders.id, input.providerId));

      return inquiry;
    }),

  /** Provider views their own inquiries */
  myInquiries: protectedProcedure
    .query(async ({ ctx }) => {
      const [provider] = await ctx.db
        .select({ id: serviceProviders.id })
        .from(serviceProviders)
        .where(eq(serviceProviders.clerkUserId, ctx.clerkUserId))
        .limit(1);
      if (!provider) return [];

      return ctx.db
        .select()
        .from(providerInquiries)
        .where(eq(providerInquiries.providerId, provider.id))
        .orderBy(desc(providerInquiries.createdAt));
    }),

  /** Provider replies to an inquiry */
  replyInquiry: protectedProcedure
    .input(z.object({
      inquiryId: z.string(),
      reply: z.string().min(1).max(2000),
    }))
    .mutation(async ({ ctx, input }) => {
      // Verify ownership
      const [inquiry] = await ctx.db
        .select({ providerId: providerInquiries.providerId })
        .from(providerInquiries)
        .where(eq(providerInquiries.id, input.inquiryId))
        .limit(1);
      if (!inquiry) throw new Error("Inquiry not found");

      const [provider] = await ctx.db
        .select({ clerkUserId: serviceProviders.clerkUserId })
        .from(serviceProviders)
        .where(eq(serviceProviders.id, inquiry.providerId))
        .limit(1);
      if (!provider || provider.clerkUserId !== ctx.clerkUserId) {
        throw new Error("Not authorised");
      }

      const [updated] = await ctx.db
        .update(providerInquiries)
        .set({
          providerReply: input.reply,
          status: "replied",
          repliedAt: new Date(),
        })
        .where(eq(providerInquiries.id, input.inquiryId))
        .returning();
      return updated;
    }),

  /** Mark inquiry as read */
  markRead: protectedProcedure
    .input(z.object({ inquiryId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(providerInquiries)
        .set({ status: "read" })
        .where(and(
          eq(providerInquiries.id, input.inquiryId),
          eq(providerInquiries.status, "sent"),
        ));
    }),

  // ─── Admin ────────────────────────────────────────────────────────────────

  /** Platform admin — list all providers */
  all: protectedProcedure
    .input(z.object({
      status: z.enum(["pending", "active", "suspended"]).optional(),
    }))
    .query(async ({ ctx, input }) => {
      const conditions = input.status
        ? [eq(serviceProviders.status, input.status)]
        : [];
      return ctx.db
        .select()
        .from(serviceProviders)
        .where(conditions.length ? and(...conditions) : undefined)
        .orderBy(desc(serviceProviders.createdAt));
    }),

  /** Platform admin — verify a provider */
  verify: protectedProcedure
    .input(z.object({
      providerId: z.string(),
      verified: z.boolean(),
    }))
    .mutation(async ({ ctx, input }) => {
      const [updated] = await ctx.db
        .update(serviceProviders)
        .set({
          isVerified: input.verified,
          verifiedAt: input.verified ? new Date() : null,
          verifiedBy: input.verified ? ctx.clerkUserId : null,
        })
        .where(eq(serviceProviders.id, input.providerId))
        .returning();
      return updated;
    }),

  /** Platform admin — change status */
  setStatus: protectedProcedure
    .input(z.object({
      providerId: z.string(),
      status: z.enum(["pending", "active", "suspended"]),
    }))
    .mutation(async ({ ctx, input }) => {
      const [updated] = await ctx.db
        .update(serviceProviders)
        .set({ status: input.status })
        .where(eq(serviceProviders.id, input.providerId))
        .returning();
      return updated;
    }),
});
