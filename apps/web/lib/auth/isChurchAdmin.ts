import { auth } from "@clerk/nextjs/server";

/**
 * Returns true if the signed-in user is allowed to admin the given church slug.
 *
 * Access is granted when ANY of the following is true:
 * 1. `publicMetadata.role === "superadmin"` — global admin
 * 2. `publicMetadata.adminOf` array contains the church slug
 * 3. `ADMIN_USER_IDS` env var contains the user's Clerk ID (dev convenience)
 *
 * Set publicMetadata via the Clerk Dashboard or Clerk Backend API:
 *   { "role": "superadmin" }               — full access everywhere
 *   { "adminOf": ["koinonia", "bethel"] }  — per-church access
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

  // Per-church access
  const adminOf = meta.adminOf;
  if (Array.isArray(adminOf) && adminOf.includes(churchSlug)) return true;

  return false;
}
