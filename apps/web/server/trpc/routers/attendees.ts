import { z } from "zod";
import { eq } from "drizzle-orm";
import { router, protectedProcedure } from "../init";
import { attendees } from "@sanctuary/db";

export const attendeesRouter = router({
  list: protectedProcedure
    .input(z.object({ churchId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db
        .select()
        .from(attendees)
        .where(eq(attendees.churchId, input.churchId));
    }),
});
