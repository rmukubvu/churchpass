import { router } from "./init";
import { eventsRouter } from "./routers/events";
import { rsvpsRouter } from "./routers/rsvps";
import { checkinsRouter } from "./routers/checkins";
import { attendeesRouter } from "./routers/attendees";
import { accommodationsRouter } from "./routers/accommodations";
import { waitlistRouter } from "./routers/waitlist";
import { ticketTiersRouter } from "./routers/ticket-tiers";
import { paymentsRouter } from "./routers/payments";
import { adsRouter } from "./routers/ads";

export const appRouter = router({
  events: eventsRouter,
  rsvps: rsvpsRouter,
  checkins: checkinsRouter,
  attendees: attendeesRouter,
  accommodations: accommodationsRouter,
  waitlist: waitlistRouter,
  ticketTiers: ticketTiersRouter,
  payments: paymentsRouter,
  ads: adsRouter,
});

export type AppRouter = typeof appRouter;
