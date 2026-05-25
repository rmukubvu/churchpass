import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { churches, events, type Db } from "@sanctuary/db";
import { isChurchAdmin } from "./isChurchAdmin";
import { isSystemAdmin } from "./isSystemAdmin";

export async function requireChurchAdmin(churchSlug: string): Promise<void> {
  if (!(await isChurchAdmin(churchSlug))) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Not authorized to administer this church",
    });
  }
}

export async function requireSystemAdmin(): Promise<void> {
  if (!(await isSystemAdmin())) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Platform admin access required",
    });
  }
}

export async function requireChurchAdminForChurchId(
  db: Db,
  churchId: string
): Promise<{ slug: string }> {
  const [church] = await db
    .select({ slug: churches.slug })
    .from(churches)
    .where(eq(churches.id, churchId))
    .limit(1);

  if (!church) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Church not found" });
  }

  await requireChurchAdmin(church.slug);
  return { slug: church.slug };
}

export async function requireChurchAdminForEventId(
  db: Db,
  eventId: string
): Promise<{ churchId: string; slug: string }> {
  const [event] = await db
    .select({ churchId: events.churchId })
    .from(events)
    .where(eq(events.id, eventId))
    .limit(1);

  if (!event) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" });
  }

  const { slug } = await requireChurchAdminForChurchId(db, event.churchId);
  return { churchId: event.churchId, slug };
}
