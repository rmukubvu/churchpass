import { db } from "@/server/db";
import { rsvps, attendees, events, churches, checkins } from "@sanctuary/db";
import { eq, and } from "drizzle-orm";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { CheckInConfirmButton } from "@/components/rsvp/CheckInConfirmButton";
import { formatDate } from "@/lib/utils";

type Props = { params: Promise<{ token: string }> };

async function fetchByToken(token: string) {
  const [rsvp] = await db
    .select()
    .from(rsvps)
    .where(eq(rsvps.walletPassToken, token))
    .limit(1);

  if (!rsvp) return null;

  const [attendee] = await db
    .select()
    .from(attendees)
    .where(eq(attendees.id, rsvp.attendeeId))
    .limit(1);

  const [event] = await db
    .select()
    .from(events)
    .where(eq(events.id, rsvp.eventId))
    .limit(1);

  if (!attendee || !event) return null;

  const [church] = await db
    .select({ name: churches.name, brandColour: churches.brandColour, slug: churches.slug })
    .from(churches)
    .where(eq(churches.id, event.churchId))
    .limit(1);

  const [existingCheckin] = await db
    .select()
    .from(checkins)
    .where(and(eq(checkins.rsvpId, rsvp.id), eq(checkins.eventId, event.id)))
    .limit(1);

  return { rsvp, attendee, event, church, existingCheckin: existingCheckin ?? null };
}

export default async function CheckInPage({ params }: Props) {
  const { token } = await params;

  let data;
  try {
    data = await fetchByToken(token);
  } catch {
    data = null;
  }

  if (!data) notFound();

  const { rsvp, attendee, event, church, existingCheckin } = data;
  const alreadyCheckedIn = !!existingCheckin;

  const brandColour = church?.brandColour ?? "#4F46E5";
  const churchName = church?.name ?? "Church";

  return (
    <div className="min-h-screen bg-[#0f0f0f] flex flex-col">
      <SiteHeader />

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">

          {/* Card */}
          <div className="bg-[#1a1a1a] border border-white/5 rounded-3xl overflow-hidden shadow-2xl shadow-black/60">

            {/* Coloured header strip */}
            <div
              className="h-2 w-full"
              style={{ backgroundColor: brandColour }}
            />

            <div className="p-6 sm:p-8 space-y-6">

              {/* Church + event */}
              <div className="text-center">
                <div
                  className="w-12 h-12 rounded-2xl mx-auto mb-3 flex items-center justify-center text-white font-bold text-lg"
                  style={{ backgroundColor: brandColour }}
                >
                  {churchName.charAt(0)}
                </div>
                <p
                  className="text-xs font-bold uppercase tracking-widest mb-1"
                  style={{ color: brandColour }}
                >
                  {churchName}
                </p>
                <h1 className="text-xl font-extrabold text-white leading-snug">
                  {event.title}
                </h1>
                <p className="text-sm text-white/40 mt-1">
                  {formatDate(event.startsAt)}
                </p>
                {event.location && (
                  <p className="text-xs text-white/30 mt-0.5">{event.location}</p>
                )}
              </div>

              {/* Divider */}
              <div className="border-t border-dashed border-white/10" />

              {/* Attendee info */}
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex-none flex items-center justify-center text-white font-bold"
                  style={{ backgroundColor: brandColour + "33", border: `1px solid ${brandColour}55` }}
                >
                  <span style={{ color: brandColour }}>
                    {(attendee.firstName?.[0] ?? "?").toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">
                    {attendee.firstName} {attendee.lastName}
                    {rsvp.isFirstTimer && (
                      <span className="ml-2 text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-400/10 border border-amber-400/20 px-1.5 py-0.5 rounded-full">
                        First timer
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-white/40">{attendee.email}</p>
                </div>
              </div>

              {/* Check-in status / button */}
              {alreadyCheckedIn ? (
                <div className="flex flex-col items-center gap-2 py-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
                    <svg className="w-8 h-8 text-emerald-400" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M5 13l4 4L19 7"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <p className="text-base font-bold text-emerald-400">Already checked in</p>
                  <p className="text-xs text-white/30">
                    {existingCheckin?.checkedInAt
                      ? new Intl.DateTimeFormat("en-US", {
                          hour: "numeric",
                          minute: "2-digit",
                          month: "short",
                          day: "numeric",
                        }).format(existingCheckin.checkedInAt)
                      : ""}
                  </p>
                </div>
              ) : (
                <CheckInConfirmButton
                  rsvpId={rsvp.id}
                  eventId={event.id}
                  attendeeName={`${attendee.firstName} ${attendee.lastName}`}
                  brandColour={brandColour}
                />
              )}

              {/* RSVP token (last 8 chars as ref) */}
              <p className="text-center text-[10px] text-white/20 font-mono tracking-widest">
                REF: {token.slice(-8).toUpperCase()}
              </p>
            </div>

            {/* Bottom strip */}
            <div
              className="h-1.5 w-full opacity-40"
              style={{ backgroundColor: brandColour }}
            />
          </div>

        </div>
      </div>
    </div>
  );
}
