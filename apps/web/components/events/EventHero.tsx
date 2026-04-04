import Image from "next/image";
import type { Event, Church } from "@sanctuary/db";
import { formatDate } from "@/lib/utils";
import { CATEGORY_LABELS } from "@/lib/constants";

type EventHeroProps = {
  event: Event;
  church: Church | null;
};

export function EventHero({ event, church }: EventHeroProps) {
  return (
    <section className="relative min-h-[50vh] flex items-end bg-surface">
      {/* Full-bleed banner */}
      {event.bannerUrl && (
        <Image
          src={event.bannerUrl}
          alt={event.title}
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
      )}

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/60 to-transparent" />

      {/* Content */}
      <div className="relative z-10 w-full px-6 pb-10 max-w-4xl mx-auto space-y-3">
        {/* Category badge */}
        <span className="inline-block text-xs font-semibold uppercase tracking-widest text-brand bg-brand/10 border border-brand/30 rounded-full px-3 py-1">
          {CATEGORY_LABELS[event.category] ?? "Event"}
        </span>

        <h1 className="text-4xl md:text-5xl font-bold text-foreground leading-tight">
          {event.title}
        </h1>

        <p className="text-foreground/70 text-lg">
          {formatDate(event.startsAt, church?.timezone)}
          {event.location && ` · ${event.location}`}
        </p>
      </div>
    </section>
  );
}
