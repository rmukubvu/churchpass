import { db } from "@/server/db";
import { events, churches } from "@sanctuary/db";
import { eq, and, gte } from "drizzle-orm";
import { SiteHeader } from "@/components/layout/SiteHeader";
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
      .where(and(eq(events.isPublic, true), gte(events.startsAt, new Date())))
      .orderBy(events.startsAt)
      .limit(24);
  } catch {
    // Fallback to dev data when DB is unavailable (e.g. pending migration in dev)
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
    <div className="min-h-screen bg-[#0f0f0f]">
      <SiteHeader />
      <FeaturedEventsBanner />

      {/* Upcoming events feed */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Upcoming Events</h2>
          <span className="text-sm text-white/30">
            {rows.length > 0 ? `${rows.length} event${rows.length !== 1 ? "s" : ""}` : ""}
          </span>
        </div>

        <UpcomingEventsGrid rows={rows} />
      </section>
    </div>
  );
}
