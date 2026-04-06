"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { EventCard } from "@/components/events/EventCard";
import { LoadMoreButton } from "@/components/browse/LoadMoreButton";
import Link from "next/link";
import type { Event } from "@sanctuary/db";
import { trpc } from "@/lib/trpc-client";

const CATEGORIES = [
  { value: "all", label: "All Events" },
  { value: "conference", label: "Conference" },
  { value: "worship", label: "Worship" },
  { value: "outreach", label: "Outreach" },
  { value: "youth", label: "Youth" },
  { value: "family", label: "Family" },
] as const;

type CategoryValue = (typeof CATEGORIES)[number]["value"];

type EventRow = {
  event: Event;
  churchSlug: string;
  churchName: string;
};

const PAGE_SIZE = 12;

export function UpcomingEventsGrid({ rows: initialRows }: { rows: EventRow[] }) {
  const [active, setActive] = useState<CategoryValue>("all");
  const [allRows, setAllRows] = useState<EventRow[]>(initialRows);
  const [offset, setOffset] = useState(initialRows.length);
  const [hasMore, setHasMore] = useState(initialRows.length === PAGE_SIZE);

  const filtered =
    active === "all" ? allRows : allRows.filter((r) => r.event.category === active);

  async function loadMore(): Promise<boolean> {
    try {
      const newRows = await trpc.events.upcomingAll.query({ limit: PAGE_SIZE, offset });
      setAllRows((prev) => {
        const existingIds = new Set(prev.map((r) => r.event.id));
        return [...prev, ...newRows.filter((r) => !existingIds.has(r.event.id))];
      });
      setOffset((o) => o + newRows.length);
      const more = newRows.length === PAGE_SIZE;
      setHasMore(more);
      return more;
    } catch {
      return false;
    }
  }

  return (
    <div id="browse">
      {/* Category tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none mb-8">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setActive(cat.value)}
            className={cn(
              "flex-none px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap",
              active === cat.value
                ? "bg-indigo-600 text-white"
                : "bg-[#1a1a2e] border border-white/5 text-white/50 hover:text-white hover:bg-[#1e1e38]"
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {filtered.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtered.map(({ event, churchSlug, churchName }) => (
              <div key={event.id} className="flex flex-col gap-2">
                <EventCard event={event} churchSlug={churchSlug} className="flex-1" />
                <p className="text-xs text-white/30 px-1 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/60 flex-none" />
                  {churchName}
                </p>
              </div>
            ))}
          </div>

          {/* Only show load more when on "all" tab — filtered tabs show subset of loaded data */}
          {active === "all" && hasMore && (
            <LoadMoreButton onLoadMore={loadMore} />
          )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-14 h-14 rounded-full bg-[#1a1a1a] flex items-center justify-center mb-4">
            <svg className="w-7 h-7 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 9v7.5" />
            </svg>
          </div>
          <p className="text-white/40">No {active === "all" ? "" : active + " "}events yet</p>
          <Link
            href="/admin"
            className="mt-5 text-sm font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            Add your church →
          </Link>
        </div>
      )}
    </div>
  );
}
