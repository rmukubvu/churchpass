import { createTRPCClient, httpBatchLink } from "@trpc/client";
import superjson from "superjson";
import type { AppRouter } from "@/server/trpc/router";

/**
 * Typed tRPC vanilla client for use in client components.
 * Uses superjson transformer to match the server — dates, Maps, Sets etc.
 * are serialised/deserialised automatically.
 *
 * Usage:
 *   import { trpc } from "@/lib/trpc-client";
 *   const event = await trpc.events.get.query({ eventId });
 *   const rsvp  = await trpc.rsvps.create.mutate({ eventId });
 */
export const trpc = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: "/api/trpc",
      transformer: superjson,
    }),
  ],
});
