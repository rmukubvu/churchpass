import { db } from "@/server/db";
import { events } from "@sanctuary/db";
import { eq } from "drizzle-orm";
import { searchNearbyHotels } from "@/lib/google-places";
import { HotelCarousel } from "@/components/accommodation/HotelCarousel";

async function fetchNearbyHotels(eventId: string) {
  try {
    const [event] = await db
      .select({ latitude: events.latitude, longitude: events.longitude })
      .from(events)
      .where(eq(events.id, eventId))
      .limit(1);

    if (!event?.latitude || !event?.longitude) return [];
    return await searchNearbyHotels(event.latitude, event.longitude);
  } catch (err) {
    console.error("[NearbyStays] fetchNearbyHotels error:", err);
    return [];
  }
}

export async function NearbyStays({ eventId }: { eventId: string }) {
  const hotels = await fetchNearbyHotels(eventId);
  if (!hotels.length) return null;

  return (
    <section className="max-w-5xl mx-auto px-6 md:px-10 py-10 border-t border-white/5">
      <HotelCarousel hotels={hotels} />
    </section>
  );
}
