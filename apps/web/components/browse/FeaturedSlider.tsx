"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { CATEGORY_LABELS } from "@/lib/constants";

// Fallback church atmosphere backgrounds used when an event has no banner
const FALLBACK_IMAGES = [
  "/banners/church-bg-1.jpg",
  "/banners/church-bg-2.jpg",
  "/banners/church-bg-3.jpg",
  "/banners/church-bg-4.jpg",
  "/banners/church-bg-5.jpg",
];

export type FeaturedEvent = {
  id: string;
  title: string;
  bannerUrl: string | null;
  startsAt: Date;
  location: string | null;
  category: string;
  churchSlug: string;
  churchName: string;
  brandColour: string;
};

type Props = {
  events: FeaturedEvent[];
};

export function FeaturedSlider({ events }: Props) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  const total = events.length;

  const next = useCallback(() => {
    setActive((i) => (i + 1) % total);
  }, [total]);

  // Auto-advance every 5 s
  useEffect(() => {
    if (paused || total <= 1) return;
    const id = setInterval(next, 5000);
    return () => clearInterval(id);
  }, [paused, next, total]);

  if (total === 0) return null;

  const event = events[active]!;
  // Each event without a banner gets a consistent fallback based on its index
  const bgImage = event.bannerUrl ?? FALLBACK_IMAGES[active % FALLBACK_IMAGES.length]!;

  return (
    <div
      className="relative overflow-hidden rounded-2xl"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Background image — always use a real photo */}
      <div className="relative aspect-[21/9] sm:aspect-[3/1] overflow-hidden">
        <Image
          key={event.id}
          src={bgImage}
          alt={event.title}
          fill
          className="object-cover transition-opacity duration-700"
          priority
        />

        {/* Dark overlay — stronger bottom so text is always readable */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10" />

        {/* Content */}
        <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6">
          {/* Sponsored + category */}
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-400">
              Featured
            </span>
            <span className="text-xs text-white/50 font-medium">
              {CATEGORY_LABELS[event.category] ?? event.category}
            </span>
            <span className="text-white/30 text-xs">·</span>
            <span className="text-xs text-white/50 font-medium">{event.churchName}</span>
          </div>

          <h3 className="text-lg sm:text-2xl font-extrabold text-white leading-tight mb-1.5 line-clamp-2">
            {event.title}
          </h3>

          <p className="text-xs text-white/50">
            {formatDate(event.startsAt)}
            {event.location && ` · ${event.location}`}
          </p>

          <Link
            href={`/${event.churchSlug}/events/${event.id}`}
            className="inline-flex items-center gap-1.5 mt-3 text-xs font-semibold px-3.5 py-1.5 rounded-full text-white transition-opacity hover:opacity-80"
            style={{ background: event.brandColour }}
          >
            View event →
          </Link>
        </div>
      </div>

      {/* Dot indicators */}
      {total > 1 && (
        <div className="flex items-center justify-center gap-1.5 py-2.5">
          {events.map((_, i) => (
            <button
              key={i}
              onClick={() => { setActive(i); setPaused(true); }}
              className={`rounded-full transition-all ${
                i === active ? "w-4 h-1.5 bg-white" : "w-1.5 h-1.5 bg-white/20 hover:bg-white/40"
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
