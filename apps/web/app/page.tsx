// Revalidate home page every 5 minutes so new events appear without a full redeploy.
export const revalidate = 300;

import { db } from "@/server/db";
import { events, churches } from "@sanctuary/db";
import { eq, and, gte, isNull } from "drizzle-orm";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { FeaturedEventsBanner } from "@/components/browse/FeaturedEventsBanner";
import { UpcomingEventsGrid } from "@/components/browse/UpcomingEventsGrid";
import { devEvents, devChurch } from "@/lib/dev-data";

async function fetchUpcomingEvents() {
  try {
    return await db
      .select({
        event: events,
        churchSlug: churches.slug,
        churchName: churches.name,
      })
      .from(events)
      .innerJoin(churches, eq(events.churchId, churches.id))
      .where(and(eq(events.isPublic, true), gte(events.startsAt, new Date()), isNull(events.parentEventId)))
      .orderBy(events.startsAt)
      .limit(12);
  } catch {
    if (process.env.NODE_ENV === "development") {
      const now = new Date();
      return devEvents
        .filter((e) => e.isPublic && new Date(e.startsAt) >= now)
        .map((e) => ({ event: e, churchSlug: devChurch.slug, churchName: devChurch.name }));
    }
    return [];
  }
}

export default async function HomePage() {
  const rows = await fetchUpcomingEvents();

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Header sits on top of the hero (transparent until scroll) */}
      <SiteHeader />
      <FeaturedEventsBanner />

      {/* Upcoming events feed */}
      <section className="max-w-7xl mx-auto px-5 sm:px-8 py-10">
        <div className="flex items-end justify-between mb-8 gap-4">
          <div>
            <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-1.5">
              All events · Free to attend
            </p>
            <h2 className="text-2xl font-extrabold text-white tracking-tight">Upcoming Events</h2>
          </div>
          {rows.length > 0 && (
            <span className="text-sm text-white/25 font-medium flex-none">
              {rows.length} event{rows.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        <UpcomingEventsGrid rows={rows} />
      </section>

      <SiteFooter />
    </div>
  );
}
