import { db } from "@/server/db";
import { events, churches } from "@sanctuary/db";
import { eq, and, gte, ilike, or } from "drizzle-orm";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { EventCard } from "@/components/events/EventCard";
import { HeroSearchBar } from "@/components/browse/HeroSearchBar";
import { devEvents, devChurch } from "@/lib/dev-data";

type Props = {
  searchParams: Promise<{ q?: string; city?: string; page?: string }>;
};

function matchesQuery(text: string | null, term: string) {
  return text?.toLowerCase().includes(term.toLowerCase()) ?? false;
}

const PAGE_SIZE = 12;

async function searchEvents(q?: string, city?: string, page = 1) {
  const now = new Date();
  const offset = (page - 1) * PAGE_SIZE;

  try {
    const conditions = [
      eq(events.isPublic, true),
      gte(events.startsAt, now),
      q
        ? or(
            ilike(events.title, `%${q}%`),
            ilike(events.location, `%${q}%`),
            ilike(events.description, `%${q}%`)
          )
        : undefined,
      city ? ilike(events.location, `%${city}%`) : undefined,
    ].filter(Boolean) as Parameters<typeof and>;

    // Fetch one extra to detect if there are more pages
    const rows = await db
      .select({
        event: events,
        churchSlug: churches.slug,
        churchName: churches.name,
      })
      .from(events)
      .innerJoin(churches, eq(events.churchId, churches.id))
      .where(and(...conditions))
      .orderBy(events.startsAt)
      .limit(PAGE_SIZE + 1)
      .offset(offset);

    const hasNextPage = rows.length > PAGE_SIZE;
    return { rows: rows.slice(0, PAGE_SIZE), hasNextPage };
  } catch {
    // Dev fallback — filter in-memory when DB is unavailable
    if (process.env.NODE_ENV === "development") {
      const all = devEvents
        .filter((e) => {
          if (!e.isPublic || new Date(e.startsAt) < now) return false;
          if (q && !matchesQuery(e.title, q) && !matchesQuery(e.location, q) && !matchesQuery(e.description, q)) return false;
          if (city && !matchesQuery(e.location, city)) return false;
          return true;
        })
        .map((e) => ({ event: e, churchSlug: devChurch.slug, churchName: devChurch.name }));
      const rows = all.slice(offset, offset + PAGE_SIZE);
      return { rows, hasNextPage: all.length > offset + PAGE_SIZE };
    }
    return { rows: [], hasNextPage: false };
  }
}

export default async function SearchPage({ searchParams }: Props) {
  const { q, city, page: pageStr } = await searchParams;
  const page = Math.max(1, parseInt(pageStr ?? "1", 10) || 1);
  const { rows: results, hasNextPage } = await searchEvents(q, city, page);

  const hasQuery = !!(q || city);
  const label = [q, city].filter(Boolean).join(" · ");

  function pageUrl(p: number) {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (city) params.set("city", city);
    if (p > 1) params.set("page", String(p));
    return `/search?${params.toString()}`;
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      <SiteHeader />

      {/* Search header */}
      <section className="border-b border-white/5 bg-[#0f0f0f]/80 backdrop-blur-sm sticky top-0 z-40 py-4">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <HeroSearchBar />
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        {/* Result header */}
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            {hasQuery ? (
              <>
                <h1 className="text-2xl font-bold text-white">
                  {results.length > 0 ? "Events found" : "No events found"}
                </h1>
                <p className="text-white/40 text-sm mt-1">
                  {label && `Searching for "${label}"`}
                  {page > 1 && ` · Page ${page}`}
                </p>
              </>
            ) : (
              <h1 className="text-2xl font-bold text-white">
                All upcoming events{page > 1 ? ` · Page ${page}` : ""}
              </h1>
            )}
          </div>
        </div>

        {results.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {results.map(({ event, churchSlug, churchName }) => (
                <div key={event.id} className="flex flex-col gap-2">
                  <EventCard event={event} churchSlug={churchSlug} />
                  <p className="text-xs text-white/30 px-1 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/60 flex-none" />
                    {churchName}
                  </p>
                </div>
              ))}
            </div>

            {/* Prev / Next pagination */}
            <div className="flex items-center justify-center gap-3 mt-10">
              {page > 1 && (
                <a
                  href={pageUrl(page - 1)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1a1a1a] border border-white/10 text-sm font-semibold text-white/60 hover:text-white hover:border-white/20 transition-colors"
                >
                  <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
                    <path d="M10 4l-4 4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Previous
                </a>
              )}
              <span className="text-sm text-white/30 px-2">Page {page}</span>
              {hasNextPage && (
                <a
                  href={pageUrl(page + 1)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1a1a1a] border border-white/10 text-sm font-semibold text-white/60 hover:text-white hover:border-white/20 transition-colors"
                >
                  Next
                  <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
                    <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </a>
              )}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="w-16 h-16 rounded-full bg-[#1a1a1a] flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
              </svg>
            </div>
            <p className="text-white/40 text-lg font-medium">
              {hasQuery ? "No events matched your search" : "No upcoming events yet"}
            </p>
            <p className="text-white/20 text-sm mt-1">
              {hasQuery ? "Try a different keyword or city" : "Check back soon"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
