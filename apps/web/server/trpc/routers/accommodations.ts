import { z } from "zod";
import { eq } from "drizzle-orm";
import { router, publicProcedure } from "../init";
import { events } from "@sanctuary/db";
import { searchNearbyHotels } from "@/lib/google-places";

export const accommodationsRouter = router({
  nearby: publicProcedure
    .input(z.object({ eventId: z.string() }))
    .query(async ({ ctx, input }) => {
      const [event] = await ctx.db
        .select({ latitude: events.latitude, longitude: events.longitude })
        .from(events)
        .where(eq(events.id, input.eventId))
        .limit(1);

      if (!event?.latitude || !event?.longitude) return [];

      try {
        return await searchNearbyHotels(event.latitude, event.longitude);
      } catch {
        return [];
      }
    }),
});
