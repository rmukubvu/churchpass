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

    const sessions =
      event.parentEventId === null
        ? await db
            .select()
            .from(events)
            .where(eq(events.parentEventId, event.id))
            .orderBy(events.startsAt)
        : [];

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

  const spotsLeft = event.capacity !== null ? event.capacity : null;

  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      <SiteHeader />

      {/* Page container */}
      <div className="max-w-6xl mx-auto px-5 sm:px-8" style={{ paddingTop: "96px" }}>

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-5 text-sm">
          <Link
            href={`/${slug}`}
            className="text-white/40 hover:text-white/70 transition-colors"
          >
            {church.name}
          </Link>
          {parentEvent && (
            <>
              <span className="text-white/20">›</span>
              <Link
                href={`/${slug}/events/${parentEvent.id}`}
                className="text-white/40 hover:text-white/70 transition-colors truncate max-w-[200px]"
              >
                {parentEvent.title}
              </Link>
            </>
          )}
          <span className="text-white/20">›</span>
          <span className="text-white/60 truncate">{event.title}</span>
        </div>

        {/* Title row — above the photo like Wander */}
        <div className="mb-6">
          <span
            className="inline-block text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full mb-3 border"
            style={{
              color: church.brandColour,
              backgroundColor: `${church.brandColour}18`,
              borderColor: `${church.brandColour}35`,
            }}
          >
            {CATEGORY_LABELS[event.category] ?? "Event"}
          </span>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight tracking-tight mb-2">
            {event.title}
          </h1>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-white/50">
            <span className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {dateStr}
            </span>
            {event.location && (
              <span className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {event.location}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              {church.name}
            </span>
          </div>
        </div>

        {/* Photo — full image visible, blurred background fills the wide frame */}
        <div
          className="relative w-full rounded-2xl overflow-hidden mb-10 bg-[#1a1a1a]"
          style={{ aspectRatio: "16/7" }}
        >
          {/* Blurred background layer — fills the wide frame */}
          <Image
            src={event.bannerUrl ?? "/banners/event_place_holder.jpg"}
            alt=""
            fill
            priority
            aria-hidden
            className="object-cover scale-110"
            style={{ filter: "blur(24px)", opacity: 0.35 }}
            sizes="(max-width: 1280px) 100vw, 1200px"
          />
          {/* Dark vignette over the blur */}
          <div className="absolute inset-0 bg-black/40" />
          {/* Foreground — full image, no crop */}
          <Image
            src={event.bannerUrl ?? "/banners/event_place_holder.jpg"}
            alt={event.title}
            fill
            priority
            className={event.bannerUrl ? "object-contain" : "object-cover"}
            sizes="(max-width: 1280px) 100vw, 1200px"
          />
        </div>

        {/* Main content grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 pb-20">

          {/* Left — details */}
          <div className="md:col-span-2 space-y-10">

            {/* Hosted by */}
            <div className="flex items-center gap-4 pb-8 border-b border-white/5">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-lg flex-none"
                style={{ backgroundColor: church.brandColour }}
              >
                {church.name.charAt(0)}
              </div>
              <div>
                <p className="text-xs text-white/30 uppercase tracking-wider mb-0.5">Hosted by</p>
                <p className="text-base font-bold text-white">{church.name}</p>
              </div>
            </div>

            {/* Description */}
            {event.description && (
              <div className="pb-8 border-b border-white/5">
                <h2 className="text-lg font-bold text-white mb-3">About this event</h2>
                <p className="text-white/55 leading-relaxed whitespace-pre-line text-[15px]">
                  {event.description}
                </p>
              </div>
            )}

            {/* Date & Time */}
            <div className="pb-8 border-b border-white/5">
              <h2 className="text-lg font-bold text-white mb-4">Date & Time</h2>
              <div className="flex items-start gap-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center flex-none"
                  style={{ background: `${church.brandColour}20` }}
                >
                  <svg className="w-5 h-5" style={{ color: church.brandColour }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-white font-semibold">{dateStr}</p>
                  <p className="text-white/45 text-sm mt-0.5">Ends at {endStr}</p>
                </div>
              </div>
            </div>

            {/* Location */}
            {event.location && (
              <div className="pb-8 border-b border-white/5">
                <h2 className="text-lg font-bold text-white mb-4">Location</h2>
                <div className="flex items-start gap-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center flex-none"
                    style={{ background: `${church.brandColour}20` }}
                  >
                    <svg className="w-5 h-5" style={{ color: church.brandColour }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-white font-semibold">{event.location}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right — sticky RSVP card */}
          <div className="md:col-span-1">
            <div
              className="sticky rounded-2xl border border-white/8 p-6 space-y-5"
              style={{ top: "96px", background: "#141414" }}
            >
              {isParentConference ? (
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
                  <div className="flex items-center justify-between text-sm pb-4 border-b border-white/5">
                    <span className="text-white/40">Entry</span>
                    <span
                      className={
                        event.rsvpRequired
                          ? "text-amber-400 font-semibold"
                          : "text-emerald-400 font-semibold"
                      }
                    >
                      {event.rsvpRequired ? "RSVP required" : "Free entry"}
                    </span>
                  </div>

                  {/* RSVP button */}
                  <RsvpButton eventId={event.id} brandColour={church.brandColour} />

                  <p className="text-[10px] text-white/20 text-center leading-relaxed">
                    You&apos;ll receive a confirmation email with your QR ticket after registering.
                  </p>

                  <MyTicket eventId={event.id} brandColour={church.brandColour} />
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Nearby Stays */}
      <NearbyStays eventId={event.id} />

      {/* Sticky mobile RSVP bar */}
      {!isParentConference && (
        <div className="fixed bottom-0 left-0 right-0 md:hidden z-50 p-4 bg-[#0f0f0f]/95 backdrop-blur border-t border-white/5">
          <RsvpButton eventId={event.id} brandColour={church.brandColour} />
        </div>
      )}
    </div>
  );
}
