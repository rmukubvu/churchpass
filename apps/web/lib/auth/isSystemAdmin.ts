import { auth, currentUser } from "@/lib/auth";

const SYSTEM_ADMIN_EMAILS = [
  "rmukubvu@googlemail.com",
  "rmukubvu@gmail.com",
];

/**
 * Returns true if the current user is a global platform admin.
 * Checks Clerk roles, hardcoded staging email fallbacks, and env vars.
 */
export async function isSystemAdmin(): Promise<boolean> {
  const { userId } = await auth();
  if (!userId) return false;

  const user = await currentUser();
  if (!user) return false;

  // 1. Clerk publicMetadata role check
  const role = user.publicMetadata?.role;
  if (role === "admin" || role === "superadmin") return true;

  // 2. Email address fallback (staging convenience)
  const userEmails = user.emailAddresses.map((e) => e.emailAddress.toLowerCase());
  if (userEmails.some((email) => SYSTEM_ADMIN_EMAILS.includes(email))) {
    return true;
  }

  // 3. User ID allowlist from environment variables
  const envAdminIds =
    (process.env.ADMIN_USER_IDS ?? "") + "," + (process.env.NEXT_PUBLIC_ADMIN_USER_IDS ?? "");
  if (
    envAdminIds
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean)
      .includes(userId)
  ) {
    return true;
  }

  return false;
}
