import Link from "next/link";
import Image from "next/image";
import { cn, formatShortDate } from "@/lib/utils";
import { CATEGORY_LABELS } from "@/lib/constants";
import type { Event } from "@sanctuary/db";

type EventCardProps = {
  event: Event;
  churchSlug: string;
  className?: string;
};

export function EventCard({ event, churchSlug, className }: EventCardProps) {
  const dateLabel = formatShortDate(event.startsAt);
  const [month, day] = dateLabel.split(" ");

  return (
    <Link
      href={`/${churchSlug}/events/${event.id}`}
      className={cn(
        "group relative flex flex-col h-full rounded-2xl overflow-hidden bg-[#1c1c30] border border-indigo-900/30",
        "hover:-translate-y-1 hover:shadow-2xl hover:shadow-indigo-950/60 hover:border-indigo-700/40",
        "transition-all duration-200",
        className
      )}
    >
      {/* Banner image — 4:3 for stronger visual presence */}
      <div className="relative aspect-[4/3] w-full bg-[#1a1a28] overflow-hidden flex-none">
        <Image
          src={event.bannerUrl ?? "/banners/event_place_holder.jpg"}
          alt={event.title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px"
        />
      </div>

      {/* Info */}
      <div className="flex flex-col flex-1 gap-2 px-4 py-3.5">
        {/* Date + category row */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-bold text-indigo-400 uppercase tracking-wide">
            {month} {day}
          </span>
          <span className="text-[11px] font-semibold text-white/30 uppercase tracking-wider truncate">
            {CATEGORY_LABELS[event.category] ?? "Event"}
          </span>
        </div>

        {/* Title */}
        <h3 className="font-bold text-white text-[15px] leading-snug line-clamp-2 group-hover:text-indigo-200 transition-colors">
          {event.title}
        </h3>

        {/* Location */}
        {event.location && (
          <p className="text-xs text-white/35 truncate flex items-center gap-1 mt-0.5">
            <svg className="w-3 h-3 flex-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            </svg>
            {event.location}
          </p>
        )}

        {/* CTA footer */}
        <div className="mt-auto pt-3 flex items-center justify-between">
          <span className="text-xs font-semibold text-white/25 uppercase tracking-wider">
            {event.rsvpRequired ? "RSVP" : "Free entry"}
          </span>
          <span className="text-xs font-bold text-indigo-400 group-hover:text-indigo-300 transition-colors">
            View →
          </span>
        </div>
      </div>
    </Link>
  );
}
