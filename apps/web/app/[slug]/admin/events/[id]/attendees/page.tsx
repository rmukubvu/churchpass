import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import { db } from "@/server/db";
import { churches, events, rsvps, attendees, checkins } from "@sanctuary/db";
import { eq, and } from "drizzle-orm";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { CheckInButton } from "@/components/admin/CheckInButton";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { isChurchAdmin } from "@/lib/auth/isChurchAdmin";

type Props = { params: Promise<{ slug: string; id: string }> };

async function fetchGuestList(slug: string, eventId: string) {
  const [church] = await db
    .select({ id: churches.id, name: churches.name, slug: churches.slug })
    .from(churches)
    .where(eq(churches.slug, slug))
    .limit(1);

  if (!church) return null;

  const [event] = await db
    .select()
    .from(events)
    .where(and(eq(events.id, eventId), eq(events.churchId, church.id)))
    .limit(1);

  if (!event) return null;

  // Join rsvps → attendees → checkins
  const rows = await db
    .select({
      rsvpId: rsvps.id,
      rsvpStatus: rsvps.status,
      rsvpCreatedAt: rsvps.createdAt,
      isFirstTimer: rsvps.isFirstTimer,
      attendeeId: attendees.id,
      firstName: attendees.firstName,
      lastName: attendees.lastName,
      email: attendees.email,
      phone: attendees.phone,
      checkinId: checkins.id,
      checkedInAt: checkins.checkedInAt,
      checkinMethod: checkins.method,
    })
    .from(rsvps)
    .innerJoin(attendees, eq(rsvps.attendeeId, attendees.id))
    .leftJoin(
      checkins,
      and(eq(checkins.rsvpId, rsvps.id), eq(checkins.eventId, eventId))
    )
    .where(eq(rsvps.eventId, eventId))
    .orderBy(rsvps.createdAt);

  return { church, event, rows };
}

export default async function AttendeesPage({ params }: Props) {
  const { userId } = await auth();
  const { slug, id } = await params;

  if (!userId) redirect(`/sign-in?redirect_url=/${slug}/admin/events/${id}/attendees`);
  if (!(await isChurchAdmin(slug))) redirect(`/${slug}`);

  let data;
  try {
    data = await fetchGuestList(slug, id);
  } catch {
    data = null;
  }

  if (!data) notFound();

  const { church, event, rows } = data;

  const totalRsvps = rows.length;
  const checkedInCount = rows.filter((r) => !!r.checkinId).length;
  const cancelledCount = rows.filter((r) => r.rsvpStatus === "cancelled").length;
  const firstTimers = rows.filter((r) => r.isFirstTimer).length;

  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      <SiteHeader />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-[88px] pb-10">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-white/30 mb-6">
          <Link href={`/${slug}/admin`} className="hover:text-white/60 transition-colors">
            {church.name}
          </Link>
          <span>/</span>
          <span className="text-white/50 truncate max-w-[200px]">{event.title}</span>
        </nav>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-extrabold text-white">{event.title}</h1>
            <p className="text-white/40 text-sm mt-1">{formatDate(event.startsAt)}</p>
          </div>

          {/* Export CSV */}
          <a
            href={`/api/export/${slug}/events/${id}`}
            className="flex items-center gap-2 text-sm font-semibold text-indigo-400 hover:text-indigo-300 border border-indigo-500/30 hover:border-indigo-400/50 px-4 py-2 rounded-xl transition-colors whitespace-nowrap"
          >
            <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
              <path d="M8 2v8M5 7l3 3 3-3M2 13h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Export CSV
          </a>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {[
            { label: "Total RSVPs", value: totalRsvps, color: "text-white" },
            { label: "Checked in", value: checkedInCount, color: "text-emerald-400" },
            { label: "Cancelled", value: cancelledCount, color: "text-red-400" },
            { label: "First timers", value: firstTimers, color: "text-indigo-400" },
          ].map((s) => (
            <div key={s.label} className="bg-[#1a1a1a] border border-white/5 rounded-2xl px-5 py-4">
              <p className={`text-2xl font-extrabold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-white/40 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Progress bar */}
        {totalRsvps > 0 && (
          <div className="mb-8">
            <div className="flex justify-between text-xs text-white/40 mb-1.5">
              <span>Check-in progress</span>
              <span>{checkedInCount} / {totalRsvps} ({Math.round((checkedInCount / totalRsvps) * 100)}%)</span>
            </div>
            <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all"
                style={{ width: `${Math.min(100, (checkedInCount / totalRsvps) * 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Guest list */}
        {rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 border border-white/5 rounded-2xl text-center">
            <p className="text-white/30 font-medium">No RSVPs yet</p>
            <p className="text-white/20 text-sm mt-1">Share the event to start collecting RSVPs</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-white/5 overflow-hidden">
            {/* Table header */}
            <div className="hidden sm:grid grid-cols-[1fr_1fr_auto_auto] gap-4 px-5 py-3 bg-[#141414] border-b border-white/5 text-xs font-semibold uppercase tracking-wider text-white/30">
              <span>Attendee</span>
              <span>Email</span>
              <span className="text-right">RSVP'd</span>
              <span className="text-right">Status</span>
            </div>

            {rows.map((row, i) => {
              const isCheckedIn = !!row.checkinId;
              const isCancelled = row.rsvpStatus === "cancelled";

              return (
                <div
                  key={row.rsvpId}
                  className={`grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto_auto] gap-3 sm:gap-4 items-center px-5 py-4 ${
                    i < rows.length - 1 ? "border-b border-white/5" : ""
                  } ${isCancelled ? "opacity-40" : "hover:bg-white/[0.02]"} transition-colors`}
                >
                  {/* Name + badges */}
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-indigo-600/30 border border-indigo-500/20 flex-none flex items-center justify-center text-xs font-bold text-indigo-300">
                      {(row.firstName?.[0] ?? "?").toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white truncate">
                        {row.firstName} {row.lastName}
                        {row.isFirstTimer && (
                          <span className="ml-2 text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-400/10 border border-amber-400/20 px-1.5 py-0.5 rounded-full">
                            First timer
                          </span>
                        )}
                      </p>
                      {row.phone && (
                        <p className="text-xs text-white/30 truncate">{row.phone}</p>
                      )}
                    </div>
                  </div>

                  {/* Email */}
                  <p className="text-xs text-white/40 truncate">{row.email}</p>

                  {/* RSVP date */}
                  <p className="text-xs text-white/30 text-right whitespace-nowrap">
                    {new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(row.rsvpCreatedAt)}
                  </p>

                  {/* Check-in button */}
                  <div className="flex justify-end">
                    {isCancelled ? (
                      <span className="text-xs text-red-400/70">Cancelled</span>
                    ) : (
                      <CheckInButton
                        rsvpId={row.rsvpId}
                        eventId={event.id}
                        initialCheckedIn={isCheckedIn}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
