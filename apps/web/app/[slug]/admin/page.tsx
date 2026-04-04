import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import { db } from "@/server/db";
import { churches, events, rsvps, checkins } from "@sanctuary/db";
import { eq, and, gte, count, desc } from "drizzle-orm";
import { SiteHeader } from "@/components/layout/SiteHeader";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { CATEGORY_LABELS } from "@/lib/constants";
import { isChurchAdmin } from "@/lib/auth/isChurchAdmin";

type Props = { params: Promise<{ slug: string }> };

async function fetchAdminData(slug: string) {
  const [church] = await db
    .select()
    .from(churches)
    .where(eq(churches.slug, slug))
    .limit(1);

  if (!church) return null;

  // All events for this church (past + upcoming), newest first
  const allEvents = await db
    .select()
    .from(events)
    .where(eq(events.churchId, church.id))
    .orderBy(desc(events.startsAt))
    .limit(50);

  // RSVP counts per event
  const rsvpCounts = await db
    .select({ eventId: rsvps.eventId, count: count() })
    .from(rsvps)
    .where(
      and(
        eq(rsvps.status, "confirmed")
      )
    )
    .groupBy(rsvps.eventId);

  // Attended counts per event
  const attendedCounts = await db
    .select({ eventId: rsvps.eventId, count: count() })
    .from(rsvps)
    .where(eq(rsvps.status, "attended"))
    .groupBy(rsvps.eventId);

  const rsvpMap = new Map(rsvpCounts.map((r) => [r.eventId, r.count]));
  const attendedMap = new Map(attendedCounts.map((r) => [r.eventId, r.count]));

  const now = new Date();

  return {
    church,
    events: allEvents.map((e) => ({
      ...e,
      rsvpCount: (rsvpMap.get(e.id) ?? 0) + (attendedMap.get(e.id) ?? 0),
      checkedIn: attendedMap.get(e.id) ?? 0,
      isUpcoming: e.startsAt >= now,
    })),
  };
}

export default async function AdminOverviewPage({ params }: Props) {
  const { userId } = await auth();
  const { slug } = await params;

  if (!userId) redirect(`/sign-in?redirect_url=/${slug}/admin`);
  if (!(await isChurchAdmin(slug))) redirect(`/register`);

  let data;
  try {
    data = await fetchAdminData(slug);
  } catch {
    data = null;
  }

  if (!data) notFound();

  const { church, events: eventRows } = data;
  const upcoming = eventRows.filter((e) => e.isUpcoming);
  const past = eventRows.filter((e) => !e.isUpcoming);
  const totalRsvps = eventRows.reduce((sum, e) => sum + e.rsvpCount, 0);

  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      <SiteHeader />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-indigo-400 mb-1">
              Admin
            </p>
            <h1 className="text-3xl font-extrabold text-white">{church.name}</h1>
            <p className="text-white/40 text-sm mt-1">
              {eventRows.length} events · {totalRsvps} total RSVPs
            </p>
          </div>
          <Link
            href={`/${slug}/admin/events/new`}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
              <path d="M8 2v12M2 8h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            New event
          </Link>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
          {[
            { label: "Upcoming events", value: upcoming.length },
            { label: "Past events", value: past.length },
            { label: "Total RSVPs", value: totalRsvps },
            {
              label: "Checked in",
              value: eventRows.reduce((sum, e) => sum + e.checkedIn, 0),
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-[#1a1a1a] border border-white/5 rounded-2xl px-5 py-4"
            >
              <p className="text-2xl font-extrabold text-white">{stat.value}</p>
              <p className="text-xs text-white/40 mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Upcoming events */}
        <EventTable
          title="Upcoming events"
          rows={upcoming}
          slug={slug}
          emptyMsg="No upcoming events — create one above."
        />

        {past.length > 0 && (
          <div className="mt-10">
            <EventTable
              title="Past events"
              rows={past}
              slug={slug}
              emptyMsg=""
              muted
            />
          </div>
        )}
      </div>
    </div>
  );
}

type EventRow = {
  id: string;
  title: string;
  category: string;
  startsAt: Date;
  location: string | null;
  capacity: number | null;
  isPublic: boolean;
  rsvpCount: number;
  checkedIn: number;
  isUpcoming: boolean;
};

function EventTable({
  title,
  rows,
  slug,
  emptyMsg,
  muted = false,
}: {
  title: string;
  rows: EventRow[];
  slug: string;
  emptyMsg: string;
  muted?: boolean;
}) {
  return (
    <section>
      <h2 className={`text-lg font-bold mb-4 ${muted ? "text-white/40" : "text-white"}`}>
        {title}
      </h2>

      {rows.length === 0 ? (
        <p className="text-white/30 text-sm py-8 text-center border border-white/5 rounded-2xl">
          {emptyMsg}
        </p>
      ) : (
        <div className="rounded-2xl border border-white/5 overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-[1fr_auto_auto_auto] gap-4 px-5 py-3 bg-[#141414] border-b border-white/5 text-xs font-semibold uppercase tracking-wider text-white/30">
            <span>Event</span>
            <span className="text-right">RSVPs</span>
            <span className="text-right">Checked in</span>
            <span className="text-right">Actions</span>
          </div>

          {rows.map((event, i) => (
            <div
              key={event.id}
              className={`grid grid-cols-[1fr_auto_auto_auto] gap-4 items-center px-5 py-4 ${
                i < rows.length - 1 ? "border-b border-white/5" : ""
              } hover:bg-white/[0.02] transition-colors`}
            >
              {/* Event info */}
              <div className="min-w-0">
                <p className={`font-semibold text-sm truncate ${muted ? "text-white/50" : "text-white"}`}>
                  {event.title}
                </p>
                <p className="text-xs text-white/30 mt-0.5 flex items-center gap-2">
                  <span>{formatDate(event.startsAt)}</span>
                  {event.location && (
                    <>
                      <span className="text-white/10">·</span>
                      <span className="truncate max-w-[160px]">{event.location}</span>
                    </>
                  )}
                  <span className="text-white/10">·</span>
                  <span className="capitalize">{CATEGORY_LABELS[event.category] ?? event.category}</span>
                </p>
              </div>

              {/* RSVP count */}
              <div className="text-right">
                <span className="text-sm font-bold text-white">{event.rsvpCount}</span>
                {event.capacity && (
                  <span className="text-xs text-white/30"> / {event.capacity}</span>
                )}
              </div>

              {/* Checked-in count + bar */}
              <div className="text-right w-20">
                <span className="text-sm font-bold text-emerald-400">{event.checkedIn}</span>
                {event.rsvpCount > 0 && (
                  <div className="mt-1 h-1 w-full bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: `${Math.min(100, (event.checkedIn / event.rsvpCount) * 100)}%` }}
                    />
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 justify-end">
                <Link
                  href={`/${slug}/admin/events/${event.id}/edit`}
                  className="text-xs font-semibold text-white/40 hover:text-white/70 transition-colors whitespace-nowrap"
                >
                  Edit
                </Link>
                <Link
                  href={`/${slug}/admin/events/${event.id}/attendees`}
                  className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors whitespace-nowrap"
                >
                  Guest list →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
