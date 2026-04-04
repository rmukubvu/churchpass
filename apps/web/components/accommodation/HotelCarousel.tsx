"use client";

import { useRef } from "react";
import { HotelCard } from "./HotelCard";
import type { NearbyHotel } from "@/lib/google-places";

export function HotelCarousel({ hotels }: { hotels: NearbyHotel[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  function scroll(dir: "left" | "right") {
    const el = scrollRef.current;
    if (!el) return;
    // Scroll by one card width + gap
    el.scrollBy({ left: dir === "right" ? 304 : -304, behavior: "smooth" });
  }

  return (
    <div>
      {/* Header with chevrons */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-bold text-white">Nearby Stays</h2>
          <p className="text-sm text-white/40 mt-0.5">Hotels close to the venue</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-white/20 mr-3">Powered by Google</span>
          <button
            onClick={() => scroll("left")}
            aria-label="Scroll left"
            className="w-9 h-9 flex items-center justify-center rounded-full bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 hover:text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={() => scroll("right")}
            aria-label="Scroll right"
            className="w-9 h-9 flex items-center justify-center rounded-full bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 hover:text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Carousel */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory"
      >
        {hotels.map((hotel) => (
          <div key={hotel.placeId} className="snap-start flex-none">
            <HotelCard hotel={hotel} />
          </div>
        ))}
      </div>
    </div>
  );
}
