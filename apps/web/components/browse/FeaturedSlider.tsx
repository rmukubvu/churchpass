"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { CATEGORY_LABELS } from "@/lib/constants";
import { trpc } from "@/lib/trpc-client";

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

export type SliderAd = {
  id: string;
  imageUrl: string;
  headline: string;
  subheadline: string | null;
  ctaText: string;
  clickUrl: string;
  advertiserName: string;
};

type SlideItem =
  | { type: "event"; data: FeaturedEvent; index: number }
  | { type: "ad"; data: SliderAd };

type Props = {
  events: FeaturedEvent[];
  adSlots?: SliderAd[];
};

export function FeaturedSlider({ events, adSlots = [] }: Props) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [impressionTracked, setImpressionTracked] = useState<Set<string>>(new Set());

  // Interleave ads roughly every 3 event slides
  const slides: SlideItem[] = [];
  let adIdx = 0;
  events.forEach((ev, i) => {
    slides.push({ type: "event", data: ev, index: i });
    if ((i + 1) % 3 === 0 && adIdx < adSlots.length) {
      slides.push({ type: "ad", data: adSlots[adIdx++]! });
    }
  });
  // Append remaining ads
  while (adIdx < adSlots.length) {
    slides.push({ type: "ad", data: adSlots[adIdx++]! });
  }

  const total = slides.length;

  const next = useCallback(() => setActive((i) => (i + 1) % total), [total]);

  // Auto-advance every 5s
  useEffect(() => {
    if (paused || total <= 1) return;
    const id = setInterval(next, 5000);
    return () => clearInterval(id);
  }, [paused, next, total]);

  // Track impression when an ad slide becomes active
  useEffect(() => {
    const slide = slides[active];
    if (!slide || slide.type !== "ad") return;
    const adId = slide.data.id;
    if (impressionTracked.has(adId)) return;
    setImpressionTracked((s) => new Set([...s, adId]));
    trpc.ads.recordImpression.mutate({ adId }).catch(() => {});
  }, [active]); // eslint-disable-line react-hooks/exhaustive-deps

  if (total === 0) return null;

  const slide = slides[active]!;

  // For events: use banner or cycling fallback photo
  const bgImage = slide.type === "event"
    ? (slide.data.bannerUrl ?? FALLBACK_IMAGES[slide.index % FALLBACK_IMAGES.length]!)
    : slide.data.imageUrl;

  return (
    <div
      className="relative overflow-hidden rounded-2xl"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="relative aspect-[21/9] sm:aspect-[3/1] overflow-hidden">
        <Image
          key={`${slide.type}-${slide.type === "event" ? slide.data.id : slide.data.id}`}
          src={bgImage}
          alt={slide.type === "event" ? slide.data.title : slide.data.headline}
          fill
          className="object-cover transition-opacity duration-700"
          priority
          unoptimized={slide.type === "ad"} // external URLs may not be on allowed domains
        />

        {/* Dark overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10" />

        {/* Content */}
        <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6">
          {slide.type === "event" ? (
            // ── Church event slide ──
            <>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-400">
                  Featured
                </span>
                <span className="text-xs text-white/50 font-medium">
                  {CATEGORY_LABELS[slide.data.category] ?? slide.data.category}
                </span>
                <span className="text-white/30 text-xs">·</span>
                <span className="text-xs text-white/50 font-medium">{slide.data.churchName}</span>
              </div>
              <h3 className="text-lg sm:text-2xl font-extrabold text-white leading-tight mb-1.5 line-clamp-2">
                {slide.data.title}
              </h3>
              <p className="text-xs text-white/50">
                {formatDate(slide.data.startsAt)}
                {slide.data.location && ` · ${slide.data.location}`}
              </p>
              <Link
                href={`/${slide.data.churchSlug}/events/${slide.data.id}`}
                className="inline-flex items-center gap-1.5 mt-3 text-xs font-semibold px-3.5 py-1.5 rounded-full text-white transition-opacity hover:opacity-80"
                style={{ background: slide.data.brandColour }}
              >
                View event →
              </Link>
            </>
          ) : (
            // ── Commercial ad slide ──
            <>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/10 border border-white/20 text-white/50">
                  Sponsored
                </span>
                <span className="text-xs text-white/40">{slide.data.advertiserName}</span>
              </div>
              <h3 className="text-lg sm:text-2xl font-extrabold text-white leading-tight mb-1.5 line-clamp-2">
                {slide.data.headline}
              </h3>
              {slide.data.subheadline && (
                <p className="text-xs text-white/50">{slide.data.subheadline}</p>
              )}
              <a
                href={slide.data.clickUrl}
                target="_blank"
                rel="noopener noreferrer sponsored"
                onClick={() => trpc.ads.recordClick.mutate({ adId: slide.data.id }).catch(() => {})}
                className="inline-flex items-center gap-1.5 mt-3 text-xs font-semibold px-3.5 py-1.5 rounded-full bg-white text-black transition-opacity hover:opacity-80"
              >
                {slide.data.ctaText} →
              </a>
            </>
          )}
        </div>
      </div>

      {/* Dot indicators */}
      {total > 1 && (
        <div className="flex items-center justify-center gap-1.5 py-2.5 bg-[#0a0a0f]">
          {slides.map((s, i) => (
            <button
              key={i}
              onClick={() => { setActive(i); setPaused(true); }}
              className={`rounded-full transition-all ${
                i === active
                  ? "w-4 h-1.5 bg-white"
                  : s.type === "ad"
                  ? "w-1.5 h-1.5 bg-amber-400/40 hover:bg-amber-400/70"
                  : "w-1.5 h-1.5 bg-white/20 hover:bg-white/40"
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
