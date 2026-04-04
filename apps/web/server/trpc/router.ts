import { router } from "./init";
import { eventsRouter } from "./routers/events";
import { rsvpsRouter } from "./routers/rsvps";
import { checkinsRouter } from "./routers/checkins";
import { attendeesRouter } from "./routers/attendees";
import { accommodationsRouter } from "./routers/accommodations";

export const appRouter = router({
  events: eventsRouter,
  rsvps: rsvpsRouter,
  checkins: checkinsRouter,
  attendees: attendeesRouter,
  accommodations: accommodationsRouter,
});

export type AppRouter = typeof appRouter;
