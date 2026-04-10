/**
 * /[slug]/admin/analytics
 * Per-church analytics dashboard showing RSVP trends, revenue, and check-in rates.
 */
import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import { db } from "@/server/db";
import { churches, events, rsvps, checkins, payments } from "@sanctuary/db";
import { eq, and, gte, desc, count, sum, sql } from "drizzle-orm";
import { SiteHeader } from "@/components/layout/SiteHeader";
import Link from "next/link";
import { formatDate } from "@/lib/utils";

export const revalidate = 300;

type Props = { params: Promise<{ slug: string }> };

async function fetchAnalytics(slug: string) {
  const [church] = await db
    .select()
    .from(churches)
    .where(eq(churches.slug, slug))
    .limit(1);

  if (!church) return null;

  const thirtyDaysAgo = new Date(Date.now() - 30 * 86_400_000);
  const ninetyDaysAgo = new Date(Date.now() - 90 * 86_400_000);

  // Top 10 events by RSVP count
  const topEvents = await db
    .select({
      id: events.id,
      title: events.title,
      startsAt: events.startsAt,
      rsvpCount: count(rsvps.id).as("rsvp_count"),
      checkinCount: sql<number>`COUNT(DISTINCT ${checkins.id})`.mapWith(Number),
    })
    .from(events)
    .leftJoin(rsvps, and(eq(rsvps.eventId, events.id), sql`${rsvps.status} != 'cancelled'`))
    .leftJoin(checkins, eq(checkins.eventId, events.id))
    .where(and(eq(events.churchId, church.id), gte(events.startsAt, ninetyDaysAgo)))
    .groupBy(events.id)
    .orderBy(desc(count(rsvps.id)))
    .limit(10);

  // Total RSVPs last 30 days
  const [rsvpTotal30] = await db
    .select({ count: count() })
    .from(rsvps)
    .innerJoin(events, eq(events.id, rsvps.eventId))
    .where(and(
      eq(events.churchId, church.id),
      gte(rsvps.createdAt, thirtyDaysAgo),
      sql`${rsvps.status} != 'cancelled'`,
    ));

  // Revenue last 30 days (paid tickets)
  const [revenue30] = await db
    .select({ total: sum(payments.amountTotal) })
    .from(payments)
    .innerJoin(rsvps, eq(rsvps.id, payments.rsvpId))
    .innerJoin(events, eq(events.id, rsvps.eventId))
    .where(and(
      eq(events.churchId, church.id),
      gte(payments.createdAt, thirtyDaysAgo),
      eq(payments.status, "succeeded"),
    ));

  // RSVPs by day (last 30 days) — for sparkline
  const rsvpsByDay = await db
    .select({
      day: sql<string>`DATE(${rsvps.createdAt})`.mapWith(String),
      count: count(),
    })
    .from(rsvps)
    .innerJoin(events, eq(events.id, rsvps.eventId))
    .where(and(
      eq(events.churchId, church.id),
      gte(rsvps.createdAt, thirtyDaysAgo),
      sql`${rsvps.status} != 'cancelled'`,
    ))
    .groupBy(sql`DATE(${rsvps.createdAt})`)
    .orderBy(sql`DATE(${rsvps.createdAt})`);

  return {
    church,
    topEvents,
    rsvpTotal30: rsvpTotal30?.count ?? 0,
    revenue30: Number(revenue30?.total ?? 0),
    rsvpsByDay,
  };
}

export default async function AdminAnalyticsPage({ params }: Props) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const { slug } = await params;
  const data = await fetchAnalytics(slug);
  if (!data) notFound();

  const { church, topEvents, rsvpTotal30, revenue30, rsvpsByDay } = data;

  const maxCount = Math.max(...rsvpsByDay.map((d) => d.count), 1);

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <SiteHeader />

      <main className="max-w-5xl mx-auto px-5 pt-[88px] pb-12 space-y-10">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-white/40">
          <Link href={`/${slug}/admin`} className="hover:text-white/70 transition-colors">Admin</Link>
          <span>›</span>
          <span className="text-white/70">Analytics</span>
        </nav>

        <div>
          <h1 className="text-2xl font-extrabold text-white">Analytics</h1>
          <p className="text-sm text-white/40 mt-1">{church.name} · Last 90 days</p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[
            { label: "RSVPs (30d)", value: rsvpTotal30.toLocaleString() },
            {
              label: "Revenue (30d)",
              value: revenue30 > 0 ? `£${(revenue30 / 100).toFixed(2)}` : "—",
            },
            {
              label: "Check-in rate",
              value: topEvents.length > 0
                ? `${Math.round(topEvents.reduce((s, e) => s + e.checkinCount, 0) / Math.max(topEvents.reduce((s, e) => s + e.rsvpCount, 0), 1) * 100)}%`
                : "—",
            },
          ].map((stat) => (
            <div key={stat.label} className="rounded-2xl bg-[#111118] border border-white/5 px-5 py-4">
              <p className="text-2xl font-extrabold text-white">{stat.value}</p>
              <p className="text-xs text-white/40 mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* RSVP Sparkline */}
        {rsvpsByDay.length > 0 && (
          <div className="rounded-2xl bg-[#111118] border border-white/5 p-5">
            <p className="text-xs font-bold text-white/40 uppercase tracking-wider mb-4">RSVPs per day (30d)</p>
            <div className="flex items-end gap-1 h-16">
              {rsvpsByDay.map((d) => (
                <div
                  key={d.day}
                  className="flex-1 rounded-sm bg-indigo-500/70 min-w-[4px]"
                  style={{ height: `${Math.round((d.count / maxCount) * 64)}px` }}
                  title={`${d.day}: ${d.count}`}
                />
              ))}
            </div>
          </div>
        )}

        {/* Top events table */}
        <div className="rounded-2xl bg-[#111118] border border-white/5 overflow-hidden">
          <div className="px-5 py-4 border-b border-white/5">
            <p className="text-sm font-bold text-white">Top events (90d)</p>
          </div>
          <div className="divide-y divide-white/5">
            {topEvents.length === 0 ? (
              <p className="px-5 py-6 text-sm text-white/30">No events in the last 90 days.</p>
            ) : (
              topEvents.map((ev) => {
                const checkinRate = ev.rsvpCount > 0 ? Math.round((ev.checkinCount / ev.rsvpCount) * 100) : 0;
                return (
                  <div key={ev.id} className="px-5 py-3.5 flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{ev.title}</p>
                      <p className="text-xs text-white/40">{formatDate(ev.startsAt)}</p>
                    </div>
                    <div className="text-right flex-none">
                      <p className="text-sm font-bold text-white">{ev.rsvpCount.toLocaleString()}</p>
                      <p className="text-xs text-white/40">RSVPs</p>
                    </div>
                    <div className="text-right flex-none w-16">
                      <p className="text-sm font-bold text-white">{checkinRate}%</p>
                      <p className="text-xs text-white/40">check-in</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <Link href={`/${slug}/admin`} className="inline-flex items-center gap-1 text-xs text-white/40 hover:text-white/70 transition-colors">
          ← Back to admin
        </Link>
      </main>
    </div>
  );
}
