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
        "group relative flex flex-col rounded-2xl overflow-hidden bg-[#1a1a1a] border border-white/5",
        "hover:border-indigo-500/40 hover:shadow-lg hover:shadow-indigo-900/20",
        "transition-all duration-200",
        className
      )}
    >
      {/* Banner image */}
      <div className="relative aspect-[16/9] w-full bg-[#252525] overflow-hidden">
        {event.bannerUrl ? (
          <>
            <Image
              src={event.bannerUrl}
              alt={event.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1a] via-transparent to-transparent opacity-60" />
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/40 via-[#252525] to-purple-900/20" />
        )}

        {/* Date badge — top-left, like a ticket stub */}
        <div className="absolute top-3 left-3 flex flex-col items-center bg-black/70 backdrop-blur-sm rounded-lg px-2.5 py-1.5 min-w-[44px] border border-white/10">
          <span className="text-[10px] font-black uppercase text-indigo-400 leading-none tracking-wider">
            {month}
          </span>
          <span className="text-xl font-black text-white leading-none mt-0.5">
            {day}
          </span>
        </div>

        {/* Category badge — top-right */}
        <div className="absolute top-3 right-3">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-white/60 bg-black/50 backdrop-blur-sm border border-white/10 px-2 py-1 rounded-md">
            {CATEGORY_LABELS[event.category] ?? "Event"}
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="flex flex-col gap-2 p-4">
        <h3 className="font-bold text-white text-base leading-snug line-clamp-2 group-hover:text-indigo-300 transition-colors">
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
          {event.capacity && (
            <p className="text-xs text-white/30 flex items-center gap-1">
              <svg className="w-3 h-3 flex-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0" />
              </svg>
              {event.capacity} capacity
            </p>
          )}
        </div>

        {/* RSVP CTA */}
        <div className="mt-1 pt-3 border-t border-white/5 flex items-center justify-between">
          <span className="text-xs text-white/30 uppercase tracking-wider font-medium">
            {event.rsvpRequired ? "RSVP required" : "Free entry"}
          </span>
          <span className="text-xs font-semibold text-indigo-400 group-hover:text-indigo-300 transition-colors">
            Get tickets →
          </span>
        </div>
      </div>
    </Link>
  );
}
