// Revalidate church pages every 5 minutes — balances freshness with DB load.
// On-demand revalidation can be added when events are created/updated.
export const revalidate = 300;

import Image from "next/image";
import { db } from "@/server/db";
import { churches, events } from "@sanctuary/db";
import { eq, and, gte, isNull, sql } from "drizzle-orm";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SelectableEventSection } from "@/components/events/SelectableEventSection";
import { getDevData } from "@/lib/dev-data";
import type { Church, Event } from "@sanctuary/db";

type Props = {
  params: Promise<{ slug: string }>;
};

async function fetchChurchData(
  slug: string
): Promise<{ church: Church; upcomingEvents: Event[]; sessionCounts: Record<string, number> } | null> {
  try {
    const [church] = await db
      .select()
      .from(churches)
      .where(eq(churches.slug, slug))
      .limit(1);

    if (!church) return null;

    const now = new Date();

    // Single query: parent events + session count via correlated subquery
    const rows = await db
      .select({
        event: events,
        sessionCount: sql<number>`(
          SELECT COUNT(*) FROM events s WHERE s.parent_event_id = ${events.id}
        )`.mapWith(Number),
      })
      .from(events)
      .where(and(eq(events.churchId, church.id), isNull(events.parentEventId), gte(events.startsAt, now)))
      .orderBy(events.startsAt)
      .limit(12);

    const upcomingEvents = rows.map((r) => r.event);
    const sessionCounts: Record<string, number> = Object.fromEntries(
      rows.filter((r) => r.sessionCount > 0).map((r) => [r.event.id, r.sessionCount])
    );

    return { church, upcomingEvents, sessionCounts };
  } catch {
    // DB unavailable — fall back to static dev data in development
    if (process.env.NODE_ENV === "development") {
      const devData = getDevData(slug);
      if (!devData) return null;
      return { church: devData.church, upcomingEvents: devData.events, sessionCounts: {} };
    }
    throw new Error("Database unavailable");
  }
}

export default async function ChurchPage({ params }: Props) {
  const { slug } = await params;

  const data = await fetchChurchData(slug);
  if (!data) notFound();

  const { church, upcomingEvents, sessionCounts } = data;

  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      <SiteHeader />

      {/* Church Hero */}
      <section className="relative h-72 md:h-96 bg-[#1a1a1a] overflow-hidden">
        {church.logoUrl && (
          <Image
            src={church.logoUrl}
            alt={church.name}
            fill
            className="object-cover opacity-30"
            priority
          />
        )}
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f0f] via-[#0f0f0f]/60 to-transparent" />
        {/* Brand colour radial glow */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            background: `radial-gradient(ellipse at 50% 100%, ${church.brandColour}66, transparent 70%)`,
          }}
        />

        <div className="absolute bottom-0 left-0 right-0 px-6 md:px-10 pb-8 max-w-7xl mx-auto">
          <div className="flex items-end gap-4">
            {/* Logo avatar */}
            <div
              className="w-16 h-16 md:w-20 md:h-20 rounded-2xl flex-none flex items-center justify-center text-white text-2xl font-bold shadow-xl"
              style={{ backgroundColor: church.brandColour }}
            >
              {church.name.charAt(0)}
            </div>
            <div>
              <h1 className="text-3xl md:text-5xl font-extrabold text-white leading-tight">
                {church.name}
              </h1>
              {church.address && (
                <p className="text-white/40 text-sm mt-1 flex items-center gap-1">
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  {church.address}
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Events section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white">Upcoming Events</h2>
            <span className="text-white/30 text-sm">
              {upcomingEvents.length} event{upcomingEvents.length !== 1 ? "s" : ""}
            </span>
          </div>
          <a
            href={`/${slug}/admin/events/new`}
            className="flex items-center gap-1.5 text-sm font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
              <path d="M8 2v12M2 8h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            Add event
          </a>
        </div>

        <SelectableEventSection
            events={upcomingEvents}
            churchSlug={slug}
            churchName={church.name}
            sessionCounts={sessionCounts}
            initialHasMore={upcomingEvents.length === 12}
          />
      </section>
    </div>
  );
}
