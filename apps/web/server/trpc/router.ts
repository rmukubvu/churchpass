import { router } from "./init";
import { eventsRouter } from "./routers/events";
import { rsvpsRouter } from "./routers/rsvps";
import { checkinsRouter } from "./routers/checkins";
import { attendeesRouter } from "./routers/attendees";
import { accommodationsRouter } from "./routers/accommodations";
import { waitlistRouter } from "./routers/waitlist";
import { ticketTiersRouter } from "./routers/ticket-tiers";

export const appRouter = router({
  events: eventsRouter,
  rsvps: rsvpsRouter,
  checkins: checkinsRouter,
  attendees: attendeesRouter,
  accommodations: accommodationsRouter,
  waitlist: waitlistRouter,
  ticketTiers: ticketTiersRouter,
});

export type AppRouter = typeof appRouter;
