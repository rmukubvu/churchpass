"use client";

import { useState, useCallback, useMemo } from "react";
import type { Event } from "@sanctuary/db";
import { cn } from "@/lib/utils";
import { SelectableEventCard } from "./SelectableEventCard";
import { MultiRsvpBar } from "@/components/rsvp/MultiRsvpBar";
import { LoadMoreButton } from "@/components/browse/LoadMoreButton";
import { trpc } from "@/lib/trpc-client";

const CATEGORIES = [
  { value: "all", label: "All Events" },
  { value: "conference", label: "Conference" },
  { value: "worship", label: "Worship" },
  { value: "outreach", label: "Outreach" },
  { value: "youth", label: "Youth" },
  { value: "family", label: "Family" },
  { value: "other", label: "Other" },
] as const;

type CategoryValue = (typeof CATEGORIES)[number]["value"];

const PAGE_SIZE = 12;

type SelectableEventSectionProps = {
  events: Event[];
  churchSlug: string;
  churchName: string;
  sessionCounts?: Record<string, number>;
  initialHasMore?: boolean;
};

export function SelectableEventSection({
  events: initialEvents,
  churchSlug,
  churchName,
  sessionCounts = {},
  initialHasMore = false,
}: SelectableEventSectionProps) {
  const [allEvents, setAllEvents] = useState<Event[]>(initialEvents);
  const [offset, setOffset] = useState(initialEvents.length);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [activeCategory, setActiveCategory] = useState<CategoryValue>("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Only show categories that actually have events
  const availableCategories = useMemo(() => {
    const usedCategories = new Set(allEvents.map((e) => e.category));
    return CATEGORIES.filter(
      (c) => c.value === "all" || usedCategories.has(c.value as Event["category"])
    );
  }, [allEvents]);

  const filteredEvents = useMemo(
    () =>
      activeCategory === "all"
        ? allEvents
        : allEvents.filter((e) => e.category === activeCategory),
    [allEvents, activeCategory]
  );

  const handleCategoryChange = useCallback((cat: CategoryValue) => {
    setActiveCategory(cat);
    setSelectedIds(new Set());
  }, []);

  const handleToggle = useCallback((eventId: string) => {
    // Parent conference events (with sessions) are not directly RSVPable
    const event = allEvents.find((e) => e.id === eventId);
    if (event && (sessionCounts[eventId] ?? 0) > 0) return;

    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(eventId)) {
        next.delete(eventId);
      } else {
        next.add(eventId);
      }
      return next;
    });
  }, [allEvents, sessionCounts]);

  const handleSuccess = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  async function loadMore(): Promise<boolean> {
    try {
      const newEvents = await trpc.events.list.query({ churchSlug, limit: PAGE_SIZE, offset });
      setAllEvents((prev) => {
        const existingIds = new Set(prev.map((e) => e.id));
        return [...prev, ...newEvents.filter((e) => !existingIds.has(e.id))];
      });
      setOffset((o) => o + newEvents.length);
      const more = newEvents.length === PAGE_SIZE;
      setHasMore(more);
      return more;
    } catch {
      return false;
    }
  }

  return (
    <>
      {/* Category tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none mb-6">
        {availableCategories.map((cat) => (
          <button
            key={cat.value}
            onClick={() => handleCategoryChange(cat.value)}
            className={cn(
              "flex-none px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap",
              activeCategory === cat.value
                ? "bg-indigo-600 text-white"
                : "bg-[#1a1a1a] text-white/50 hover:text-white hover:bg-[#252525]"
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Tap-to-select hint */}
      <p className="text-xs text-white/30 mb-4 flex items-center gap-1.5">
        <svg className="w-3.5 h-3.5 flex-none" viewBox="0 0 16 16" fill="none">
          <path
            d="M8 2a2.5 2.5 0 011.5 4.5V13a1.5 1.5 0 01-3 0V6.5A2.5 2.5 0 018 2z"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
        </svg>
        Tap events to select — RSVP to multiple in one shot · Multi-day conferences let you pick individual sessions
      </p>

      {filteredEvents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <p className="text-white/30 text-base font-medium">No {activeCategory === "all" ? "upcoming" : activeCategory} events</p>
          <p className="text-white/20 text-sm mt-1">Check back soon</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => (
              <SelectableEventCard
                key={event.id}
                event={event}
                churchSlug={churchSlug}
                selected={selectedIds.has(event.id)}
                onToggle={handleToggle}
                sessionCount={sessionCounts[event.id] ?? 0}
              />
            ))}
          </div>

          {activeCategory === "all" && hasMore && (
            <LoadMoreButton onLoadMore={loadMore} />
          )}
        </>
      )}

      <MultiRsvpBar
        selectedIds={Array.from(selectedIds)}
        churchSlug={churchSlug}
        churchName={churchName}
        onSuccess={handleSuccess}
      />
    </>
  );
}
