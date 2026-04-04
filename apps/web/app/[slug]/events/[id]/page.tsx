import Image from "next/image";
import Link from "next/link";
import { db } from "@/server/db";
import { events, churches } from "@sanctuary/db";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { RsvpButton } from "@/components/rsvp/RsvpButton";
import { MyTicket } from "@/components/rsvp/MyTicket";
import { NearbyStays } from "@/components/events/NearbyStays";
import { SessionPicker } from "@/components/events/SessionPicker";
import { CATEGORY_LABELS } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import { getDevData } from "@/lib/dev-data";
import type { Church, Event } from "@sanctuary/db";

type Props = {
  params: Promise<{ slug: string; id: string }>;
};

async function fetchEventData(
  slug: string,
  id: string
): Promise<{ event: Event; church: Church; sessions: Event[]; parentEvent: Event | null } | null> {
  try {
    const [event] = await db
      .select()
      .from(events)
      .where(eq(events.id, id))
      .limit(1);

    if (!event) return null;

    const [church] = await db
      .select()
      .from(churches)
      .where(eq(churches.id, event.churchId))
      .limit(1);

    if (!church) return null;

    // If this is a parent event, fetch its sessions
    const sessions = event.parentEventId === null
      ? await db
          .select()
          .from(events)
          .where(eq(events.parentEventId, event.id))
          .orderBy(events.startsAt)
      : [];

    // If this is a session, fetch its parent
    const parentEvent = event.parentEventId
      ? await db
          .select()
          .from(events)
          .where(eq(events.id, event.parentEventId))
          .limit(1)
          .then((rows) => rows[0] ?? null)
      : null;

    return { event, church, sessions, parentEvent };
  } catch {
    if (process.env.NODE_ENV === "development") {
      const devData = getDevData(slug);
      if (!devData) return null;
      const event = devData.events.find((e) => e.id === id);
      if (!event) return null;
      return { event, church: devData.church, sessions: [], parentEvent: null };
    }
    throw new Error("Database unavailable");
  }
}

export default async function EventPage({ params }: Props) {
  const { slug, id } = await params;
  const data = await fetchEventData(slug, id);
  if (!data) notFound();

  const { event, church, sessions, parentEvent } = data;
  const isParentConference = sessions.length > 0;

  const start = new Date(event.startsAt);
  const end = new Date(event.endsAt);

  const dateStr = formatDate(start, church.timezone);
  const endStr = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: church.timezone,
  }).format(end);

  const spotsLeft =
    event.capacity !== null ? event.capacity : null;

  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      <SiteHeader />

      {/* Full-bleed hero */}
      <section className="relative h-[55vh] md:h-[65vh] bg-[#1a1a1a] overflow-hidden">
        {event.bannerUrl ? (
          <Image
            src={event.bannerUrl}
            alt={event.title}
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/40 via-[#1a1a1a] to-purple-900/20" />
        )}

        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f0f] via-[#0f0f0f]/40 to-transparent" />
        <div
          className="absolute inset-0 opacity-10"
          style={{
            background: `radial-gradient(ellipse at 50% 100%, ${church.brandColour}99, transparent 70%)`,
          }}
        />

        {/* Back breadcrumb */}
        <div className="absolute top-6 left-6 flex items-center gap-2">
          <Link
            href={`/${slug}`}
            className="flex items-center gap-1.5 text-xs text-white/50 hover:text-white transition-colors bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/10"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {church.name}
          </Link>
          {parentEvent && (
            <>
              <span className="text-white/20 text-xs">/</span>
              <Link
                href={`/${slug}/events/${parentEvent.id}`}
                className="flex items-center gap-1.5 text-xs text-white/50 hover:text-white transition-colors bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/10 max-w-[200px] truncate"
              >
                {parentEvent.title}
              </Link>
            </>
          )}
        </div>

        {/* Hero text */}
        <div className="absolute bottom-0 left-0 right-0 px-6 md:px-10 pb-10 max-w-5xl mx-auto">
          <span
            className="inline-block text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full mb-3 border"
            style={{
              color: church.brandColour,
              backgroundColor: `${church.brandColour}20`,
              borderColor: `${church.brandColour}40`,
            }}
          >
            {CATEGORY_LABELS[event.category] ?? "Event"}
          </span>

          <h1 className="text-3xl md:text-5xl font-extrabold text-white leading-tight mb-3 max-w-3xl">
            {event.title}
          </h1>

          <p className="text-white/60 text-base md:text-lg">
            {dateStr} – {endStr}
            {event.location && (
              <span className="text-white/40"> · {event.location}</span>
            )}
          </p>
        </div>
      </section>

      {/* Body */}
      <div className="max-w-5xl mx-auto px-6 md:px-10 py-10 grid grid-cols-1 md:grid-cols-3 gap-10">
        {/* Left — description */}
        <div className="md:col-span-2 space-y-8">
          {event.description && (
            <div>
              <h2 className="text-lg font-bold text-white mb-3">About this event</h2>
              <p className="text-white/60 leading-relaxed whitespace-pre-line">{event.description}</p>
            </div>
          )}

          {/* Date & Time detail */}
          <div>
            <h2 className="text-lg font-bold text-white mb-3">Date & Time</h2>
            <div className="flex items-start gap-3 text-white/60 text-sm">
              <svg className="w-4 h-4 mt-0.5 flex-none text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <div>
                <p className="text-white font-medium">{dateStr}</p>
                <p>Ends {endStr}</p>
              </div>
            </div>
          </div>

          {/* Location */}
          {event.location && (
            <div>
              <h2 className="text-lg font-bold text-white mb-3">Location</h2>
              <div className="flex items-start gap-3 text-white/60 text-sm">
                <svg className="w-4 h-4 mt-0.5 flex-none text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <p className="text-white">{event.location}</p>
              </div>
            </div>
          )}
        </div>

        {/* Right — RSVP card (sticky) */}
        <div className="md:col-span-1">
          <div className="sticky top-24 rounded-2xl bg-[#1a1a1a] border border-white/5 p-6 space-y-5">
            {/* Hosted by */}
            <div className="flex items-center gap-3 pb-4 border-b border-white/5">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-none"
                style={{ backgroundColor: church.brandColour }}
              >
                {church.name.charAt(0)}
              </div>
              <div>
                <p className="text-[10px] text-white/30 uppercase tracking-wider">Hosted by</p>
                <p className="text-sm font-semibold text-white">{church.name}</p>
              </div>
            </div>

            {isParentConference ? (
              /* Session picker for multi-day conferences */
              <SessionPicker
                sessions={sessions}
                churchSlug={slug}
                churchName={church.name}
                brandColour={church.brandColour}
              />
            ) : (
              <>
                {/* Capacity */}
                {spotsLeft !== null && (
                  <div>
                    <div className="flex justify-between text-xs text-white/40 mb-1.5">
                      <span>Capacity</span>
                      <span>{spotsLeft.toLocaleString()} spots</span>
                    </div>
                    <div className="h-1 rounded-full bg-white/10">
                      <div className="h-1 rounded-full bg-indigo-500 w-[5%]" />
                    </div>
                  </div>
                )}

                {/* Entry type */}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/40">Entry</span>
                  <span className={event.rsvpRequired ? "text-amber-400 font-medium" : "text-emerald-400 font-medium"}>
                    {event.rsvpRequired ? "RSVP required" : "Free entry"}
                  </span>
                </div>

                {/* RSVP button */}
                <RsvpButton eventId={event.id} brandColour={church.brandColour} />

                <p className="text-[10px] text-white/20 text-center">
                  You&apos;ll receive a confirmation email with your QR ticket after registering.
                </p>

                {/* My Ticket — only rendered for signed-in users who have RSVPd */}
                <MyTicket eventId={event.id} brandColour={church.brandColour} />
              </>
            )}
          </div>
        </div>
      </div>

      {/* Nearby Stays */}
      <NearbyStays eventId={event.id} />

      {/* Sticky mobile RSVP bar — hidden for parent conferences (session picker in card) */}
      {!isParentConference && (
        <div className="fixed bottom-0 left-0 right-0 md:hidden z-50 p-4 bg-[#0f0f0f]/95 backdrop-blur border-t border-white/5">
          <RsvpButton eventId={event.id} brandColour={church.brandColour} />
        </div>
      )}
    </div>
  );
}
