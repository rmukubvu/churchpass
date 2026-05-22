import { auth } from "@clerk/nextjs/server";
import { db } from "@/server/db";
import { churches } from "@sanctuary/db";
import { and, eq } from "drizzle-orm";
import { isSystemAdmin } from "./isSystemAdmin";

/**
 * Returns true if the signed-in user is allowed to admin the given church slug.
 *
 * Access is granted when ANY of the following is true:
 * 1. User is a global platform system admin
 * 2. `publicMetadata.adminOf` array contains the church slug (JWT-based)
 * 3. `churches.ownerClerkUserId === userId` — DB-based, works immediately after registration
 */
export async function isChurchAdmin(churchSlug: string): Promise<boolean> {
  // Global admin override
  if (await isSystemAdmin()) return true;

  const { userId, sessionClaims } = await auth();
  if (!userId) return false;

  const meta = (sessionClaims?.publicMetadata ?? {}) as Record<string, unknown>;

  // Per-church access via JWT (fast path, cached in token)
  const adminOf = meta.adminOf;
  if (Array.isArray(adminOf) && adminOf.includes(churchSlug)) return true;

  // DB fallback — works immediately after registration before JWT refreshes
  const [row] = await db
    .select({ id: churches.id })
    .from(churches)
    .where(and(eq(churches.slug, churchSlug), eq(churches.ownerClerkUserId, userId)))
    .limit(1);
  if (row) return true;

  return false;
}


