import { auth } from "@clerk/nextjs/server";
import { db } from "@/server/db";
import { churches } from "@sanctuary/db";
import { and, eq } from "drizzle-orm";

/**
 * Returns true if the signed-in user is allowed to admin the given church slug.
 *
 * Access is granted when ANY of the following is true:
 * 1. `publicMetadata.role === "superadmin"` — global admin
 * 2. `publicMetadata.adminOf` array contains the church slug (JWT-based)
 * 3. `churches.ownerClerkUserId === userId` — DB-based, works immediately after registration
 * 4. `ADMIN_USER_IDS` env var contains the user's Clerk ID (dev convenience)
 */
export async function isChurchAdmin(churchSlug: string): Promise<boolean> {
  const { userId, sessionClaims } = await auth();
  if (!userId) return false;

  // Dev convenience: comma-separated list of Clerk user IDs in env
  const adminIds = process.env.ADMIN_USER_IDS ?? "";
  if (adminIds.split(",").map((s) => s.trim()).includes(userId)) return true;

  const meta = (sessionClaims?.publicMetadata ?? {}) as Record<string, unknown>;

  // Superadmin — access to all churches
  if (meta.role === "superadmin") return true;

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
