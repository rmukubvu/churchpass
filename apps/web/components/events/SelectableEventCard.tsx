"use client";

import Image from "next/image";
import Link from "next/link";
import { cn, formatShortDate } from "@/lib/utils";
import { CATEGORY_LABELS } from "@/lib/constants";
import type { Event } from "@sanctuary/db";

type SelectableEventCardProps = {
  event: Event;
  churchSlug: string;
  selected: boolean;
  onToggle: (eventId: string) => void;
};

export function SelectableEventCard({
  event,
  churchSlug,
  selected,
  onToggle,
}: SelectableEventCardProps) {
  const dateLabel = formatShortDate(event.startsAt);
  const [month, day] = dateLabel.split(" ");

  return (
    <div className="relative group">
      {/* Clickable overlay for selection — covers card but not the "Details" link */}
      <button
        type="button"
        onClick={() => onToggle(event.id)}
        aria-pressed={selected}
        aria-label={`${selected ? "Deselect" : "Select"} ${event.title}`}
        className="absolute inset-0 z-10 rounded-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500"
      />

      {/* Selection ring */}
      <div
        className={cn(
          "relative flex flex-col rounded-2xl overflow-hidden bg-[#1a1a1a] border transition-all duration-200",
          selected
            ? "border-indigo-500 shadow-lg shadow-indigo-900/30 ring-1 ring-indigo-500/60"
            : "border-white/5 group-hover:border-indigo-500/40 group-hover:shadow-lg group-hover:shadow-indigo-900/20"
        )}
      >
        {/* Checkbox badge — top-right of image */}
        <div
          className={cn(
            "absolute top-3 right-3 z-20 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-150",
            selected
              ? "bg-indigo-600 border-indigo-500"
              : "bg-black/60 border-white/30 backdrop-blur-sm"
          )}
        >
          {selected && (
            <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 12 12" fill="none">
              <path
                d="M2 6l3 3 5-5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </div>

        {/* Banner image */}
        <div className="relative aspect-[16/9] w-full bg-[#252525] overflow-hidden">
          {event.bannerUrl ? (
            <>
              <Image
                src={event.bannerUrl}
                alt={event.title}
                fill
                className={cn(
                  "object-cover transition-transform duration-500",
                  selected ? "scale-105" : "group-hover:scale-105"
                )}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1a] via-transparent to-transparent opacity-60" />
            </>
          ) : (
            <div
              className={cn(
                "absolute inset-0 bg-gradient-to-br transition-opacity",
                selected
                  ? "from-indigo-800/60 via-[#252525] to-purple-800/40"
                  : "from-indigo-900/40 via-[#252525] to-purple-900/20"
              )}
            />
          )}

          {/* Date badge */}
          <div className="absolute top-3 left-3 flex flex-col items-center bg-black/70 backdrop-blur-sm rounded-lg px-2.5 py-1.5 min-w-[44px] border border-white/10 z-10">
            <span className="text-[10px] font-black uppercase text-indigo-400 leading-none tracking-wider">
              {month}
            </span>
            <span className="text-xl font-black text-white leading-none mt-0.5">
              {day}
            </span>
          </div>

          {/* Category badge — hidden when checkbox visible */}
          {!selected && (
            <div className="absolute top-3 right-3 z-10">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-white/60 bg-black/50 backdrop-blur-sm border border-white/10 px-2 py-1 rounded-md">
                {CATEGORY_LABELS[event.category] ?? "Event"}
              </span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col gap-2 p-4">
          <h3
            className={cn(
              "font-bold text-base leading-snug line-clamp-2 transition-colors",
              selected ? "text-indigo-300" : "text-white group-hover:text-indigo-300"
            )}
          >
            {event.title}
          </h3>

          <div className="flex flex-col gap-1">
            {event.location && (
              <p className="text-xs text-white/40 truncate flex items-center gap-1">
                <svg className="w-3 h-3 flex-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                </svg>
                {event.location}
              </p>
            )}
          </div>

          {/* Bottom row: RSVP label + details link */}
          <div className="mt-1 pt-3 border-t border-white/5 flex items-center justify-between">
            <span
              className={cn(
                "text-xs uppercase tracking-wider font-medium",
                selected ? "text-indigo-400" : "text-white/30"
              )}
            >
              {selected ? "✓ Selected" : event.rsvpRequired ? "RSVP required" : "Free entry"}
            </span>
            {/* Details link escapes the selection overlay via z-index */}
            <Link
              href={`/${churchSlug}/events/${event.id}`}
              onClick={(e) => e.stopPropagation()}
              className="relative z-20 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              Details →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
