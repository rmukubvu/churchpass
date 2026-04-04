import type { Event } from "@sanctuary/db";
import { EventCard } from "./EventCard";

type EventGridProps = {
  events: Event[];
  churchSlug: string;
};

export function EventGrid({ events, churchSlug }: EventGridProps) {
  if (events.length === 0) {
    return (
      <p className="text-foreground/50 text-center py-16">
        No upcoming events. Check back soon.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {events.map((event) => (
        <EventCard key={event.id} event={event} churchSlug={churchSlug} />
      ))}
    </div>
  );
}
