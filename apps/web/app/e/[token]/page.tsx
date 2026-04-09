/**
 * Private event page — accessible only via secret token link.
 * URL: /e/[token]
 * The token is generated on event creation when visibility = 'private'.
 * This page is functionally identical to the public event detail page
 * but resolves by token instead of slug+id.
 */
import { notFound } from "next/navigation";
import { db } from "@/server/db";
import { events, churches } from "@sanctuary/db";
import { eq } from "drizzle-orm";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { RsvpButton } from "@/components/rsvp/RsvpButton";
import { MyTicket } from "@/components/rsvp/MyTicket";
import { SessionPicker } from "@/components/events/SessionPicker";
import { CATEGORY_LABELS } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";

// Never cache private event pages
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ token: string }> };

export default async function PrivateEventPage({ params }: Props) {
  const { token } = await params;

  const [event] = await db
    .select()
    .from(events)
    .where(eq(events.secretToken, token))
    .limit(1);

  if (!event) notFound();

  const [church] = await db
    .select()
    .from(churches)
    .where(eq(churches.id, event.churchId))
    .limit(1);

  if (!church) notFound();

  const sessions = await db
    .select()
    .from(events)
    .where(eq(events.parentEventId, event.id))
    .orderBy(events.startsAt);

  const hasSessions = sessions.length > 0;
  const brandColour = church.brandColour ?? "#4F46E5";

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <SiteHeader />

      {/* Private badge */}
      <div className="max-w-4xl mx-auto px-5 pt-6">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold">
          <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none">
            <path d="M8 1a3 3 0 00-3 3v1H4a1 1 0 00-1 1v7a1 1 0 001 1h8a1 1 0 001-1V6a1 1 0 00-1-1h-1V4a3 3 0 00-3-3zm-1 3a1 1 0 112 0v1H7V4z" fill="currentColor" />
          </svg>
          Private event — you were invited
        </div>
      </div>

      {/* Banner */}
      {event.bannerUrl && (
        <div className="relative w-full max-h-[420px] overflow-hidden mt-4">
          <Image
            src={event.bannerUrl}
            alt={event.title}
            width={1600}
            height={900}
            className="w-full object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-transparent to-transparent" />
        </div>
      )}

      <main className="max-w-4xl mx-auto px-5 py-8 space-y-8">
        {/* Header */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-white/40 uppercase tracking-widest">
            <span style={{ color: brandColour }}>{CATEGORY_LABELS[event.category] ?? event.category}</span>
            <span>·</span>
            <Link href={`/${church.slug}`} className="hover:text-white/70 transition-colors">
              {church.name}
            </Link>
          </div>
          <h1 className="text-3xl font-extrabold text-white leading-tight">{event.title}</h1>
        </div>

        {/* Date & Location */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-2xl bg-[#111118] border border-white/5 p-4 flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-none" style={{ background: `${brandColour}18` }}>
              <svg className="w-4.5 h-4.5" style={{ color: brandColour }} viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-white/40 font-medium mb-0.5">Date & Time</p>
              <p className="text-sm font-semibold text-white">{formatDate(event.startsAt)}</p>
              <p className="text-xs text-white/40">{event.timezone}</p>
            </div>
          </div>

          <div className="rounded-2xl bg-[#111118] border border-white/5 p-4 flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-none" style={{ background: `${brandColour}18` }}>
              <svg className="w-4.5 h-4.5" style={{ color: brandColour }} viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-white/40 font-medium mb-0.5">Location</p>
              {event.locationTbd ? (
                <p className="text-sm font-semibold text-white/50 italic">Venue to be announced</p>
              ) : event.locationType === "virtual" ? (
                <p className="text-sm font-semibold text-white">Online event</p>
              ) : (
                <p className="text-sm font-semibold text-white">{event.location ?? "See details"}</p>
              )}
              {event.locationDirections && (
                <p className="text-xs text-white/40 mt-0.5">{event.locationDirections}</p>
              )}
            </div>
          </div>
        </div>

        {/* Description */}
        {event.description && (
          <div className="prose prose-invert prose-sm max-w-none text-white/70">
            <p className="whitespace-pre-line">{event.description}</p>
          </div>
        )}

        {/* Sessions */}
        {hasSessions ? (
          <SessionPicker
            sessions={sessions}
            churchSlug={church.slug}
            churchName={church.name}
            brandColour={brandColour}
          />
        ) : (
          <RsvpButton eventId={event.id} brandColour={brandColour} />
        )}

        {/* My Ticket (QR) */}
        <MyTicket eventId={event.id} brandColour={brandColour} />
      </main>
    </div>
  );
}
