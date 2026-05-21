import { z } from "zod";
import { eq } from "drizzle-orm";
import { router, protectedProcedure } from "../init";
import { attendees, churches } from "@sanctuary/db";
import { isChurchAdmin } from "@/lib/auth/isChurchAdmin";
import { TRPCError } from "@trpc/server";

export const attendeesRouter = router({
  list: protectedProcedure
    .input(z.object({ churchId: z.string() }))
    .query(async ({ ctx, input }) => {
      const [church] = await ctx.db
        .select({ slug: churches.slug })
        .from(churches)
        .where(eq(churches.id, input.churchId))
        .limit(1);

      if (!church) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Church not found" });
      }

      if (!(await isChurchAdmin(church.slug))) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized to view attendee list" });
      }

      return ctx.db
        .select()
        .from(attendees)
        .where(eq(attendees.churchId, input.churchId));
    }),
});
