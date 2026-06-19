import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { db } from "@/server/db";
import { churches, events, rsvps, checkins } from "@sanctuary/db";
import { eq, and, gte, count, desc } from "drizzle-orm";
import { SiteHeader } from "@/components/layout/SiteHeader";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { CATEGORY_LABELS } from "@/lib/constants";
import { isChurchAdmin } from "@/lib/auth/isChurchAdmin";
import { FeatureButton } from "@/components/admin/FeatureButton";

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
      featuredUntil: e.featuredUntil,
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

      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-[88px] pb-10">
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
          <div className="flex items-center gap-3">
            <Link
              href={`/${slug}/admin/analytics`}
              className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
            >
              <svg viewBox="0 0 20 20" className="w-4 h-4 fill-current">
                <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zm6-4a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zm6-3a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
              </svg>
              Analytics
            </Link>
            <Link
              href={`/${slug}/admin/stripe`}
              className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.594-7.305h.003z" />
              </svg>
              Payments
            </Link>
            <Link
              href={`/${slug}/admin/settings/social`}
              className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.532-4.697 1.313 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.886v2.268h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>
              </svg>
              Social
            </Link>
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
        </div>

        {/* Verification alert card */}
        {!church.isVerified && (
          <div className="mb-8 p-5 rounded-2xl border border-amber-500/10 bg-amber-500/5 backdrop-blur-sm flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 flex-shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m0-6h.01M5.071 19h13.858c1.395 0 2.247-1.52 1.52-2.708l-6.93-11.83C12.817 3.28 11.18 3.28 10.48 4.46L3.55 16.29c-.727 1.187.125 2.708 1.52 2.708z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-bold text-amber-400 flex items-center gap-1.5">
                Verification Required for Ticket Sales
              </h3>
              <p className="text-xs text-white/60 mt-1 max-w-2xl leading-relaxed">
                Your profile is currently under review by our safety team. To protect attendees from fraud, you can create and publish free events, but paid event ticket sales will remain locked until your ID or registration certificate is approved.
              </p>
            </div>
          </div>
        )}

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

        {/* Quick Actions (Luma-inspired Event Hub) */}
        <div className="mb-10">
          <h2 className="text-lg font-bold text-white mb-4">Event Templates</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                title: "One-Time Event (Free)",
                desc: "A single session event like a service, workshop or meetup.",
                features: ["Free RSVP", "Capacity Limit", "Waitlists"],
                href: `/${slug}/admin/events/new?type=onetime&pricing=free`,
                locked: false,
                btnText: "Create Free Event"
              },
              {
                title: "One-Time Event (Paid)",
                desc: "A single ticketed event. Sell multiple custom ticket tiers.",
                features: ["Paid Tickets", "Custom Tiers", "Capacity Control"],
                href: `/${slug}/admin/events/new?type=onetime&pricing=paid`,
                locked: !church.isVerified,
                btnText: "Create Paid Event"
              },
              {
                title: "Recurring Event (Free)",
                desc: "A repeating weekly or monthly gathering (e.g. services, groups).",
                features: ["Repeating Sessions", "Free RSVP", "Capacity Limit"],
                href: `/${slug}/admin/events/new?type=recurring&pricing=free`,
                locked: false,
                btnText: "Create Recurring"
              },
              {
                title: "Recurring Event (Paid)",
                desc: "A ticketed series or repeating paid class sessions.",
                features: ["Repeating Sessions", "Paid Tickets", "Capacity Control"],
                href: `/${slug}/admin/events/new?type=recurring&pricing=paid`,
                locked: !church.isVerified,
                btnText: "Create Recurring Paid"
              }
            ].map((tmpl, idx) => (
              <div
                key={idx}
                className="bg-[#1a1a1a] border border-white/5 hover:border-white/10 rounded-2xl p-5 flex flex-col justify-between transition-all"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <h3 className="text-sm font-bold text-white leading-snug">{tmpl.title}</h3>
                    {tmpl.locked && (
                      <span className="text-[10px] font-bold text-amber-400 bg-amber-400/10 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                        <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 16 16">
                          <path d="M8 1a3 3 0 013 3v3h.5A1.5 1.5 0 0113 8.5v5a1.5 1.5 0 01-1.5 1.5h-7A1.5 1.5 0 013 13.5v-5A1.5 1.5 0 014.5 7H5V4a3 3 0 013-3zm2 6V4a2 2 0 10-4 0v3h4z" />
                        </svg>
                        Locked
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-white/40 mt-1.5 leading-relaxed">{tmpl.desc}</p>
                  
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {tmpl.features.map((f, fIdx) => (
                      <span key={fIdx} className="text-[9px] font-medium text-white/50 bg-white/5 px-2 py-1 rounded-md">
                        ✓ {f}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-6">
                  {tmpl.locked ? (
                    <div className="text-[11px] text-amber-400/80 text-center font-medium bg-amber-400/5 border border-amber-400/10 py-2 rounded-xl">
                      Requires Verification
                    </div>
                  ) : (
                    <Link
                      href={tmpl.href}
                      className="block text-center text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 py-2.5 rounded-xl transition-all"
                    >
                      {tmpl.btnText}
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Promotion & Advertising Card */}
        <div className="mb-10 bg-gradient-to-r from-indigo-950/20 via-[#151525] to-amber-950/10 border border-white/5 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="max-w-xl">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2.5 py-1 rounded-full mb-3 inline-block">
              ★ Grow Your Audience
            </span>
            <h3 className="text-lg font-bold text-white">Promote your events on ChurchPass</h3>
            <p className="text-xs text-white/40 mt-1 leading-relaxed">
              Create rotating banner ads featured directly on our homepage slider. Reach thousands of local event attendees looking for services, conferences, and community gatherings.
            </p>
          </div>
          <Link
            href={`/advertise?name=${encodeURIComponent(church.name)}&email=${encodeURIComponent(church.publicEmail || "")}`}
            className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs px-5 py-3 rounded-xl transition-all flex-shrink-0"
          >
            Create Banner Advert
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>
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
  featuredUntil: Date | null;
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
                {event.isUpcoming && (
                  <FeatureButton
                    eventId={event.id}
                    isFeatured={
                      event.featuredUntil !== null &&
                      event.featuredUntil > new Date()
                    }
                  />
                )}
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
