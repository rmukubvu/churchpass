import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";

/**
 * Admin layout — requires:
 *   1. Clerk authentication (any sign-in)
 *   2. role === "admin" in Clerk publicMetadata  OR  user is in ADMIN_USER_IDS env var
 *
 * To grant admin access, go to Clerk Dashboard → Users → [user] → Metadata
 * and set publicMetadata = { "role": "admin" }
 *
 * Alternatively, add the user's Clerk userId to the ADMIN_USER_IDS env var
 * (comma-separated) for quick local dev without touching Clerk dashboard.
 */

function isAdminUser(userId: string, role: unknown): boolean {
  if (role === "admin") return true;

  const allowList = process.env["ADMIN_USER_IDS"] ?? "";
  if (!allowList) return false;

  return allowList.split(",").map((id) => id.trim()).includes(userId);
}

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: "⬛" },
  { href: "/admin/events", label: "Events", icon: "📅" },
  { href: "/admin/attendees", label: "Attendees", icon: "👥" },
] as const;

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in?redirect_url=/admin");

  const user = await currentUser();
  const role = user?.publicMetadata?.role;

  if (!isAdminUser(userId, role)) {
    // Not an admin — send them to a friendly access-denied page
    redirect("/?error=access_denied");
  }

  const displayName =
    user?.firstName ?? user?.emailAddresses?.[0]?.emailAddress ?? "Admin";

  return (
    <div className="flex min-h-screen bg-[#0f0f0f]">
      {/* Sidebar */}
      <aside className="w-60 bg-[#111111] border-r border-white/5 flex flex-col">
        {/* Branding */}
        <div className="px-5 py-5 border-b border-white/5">
          <Link href="/" className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 rounded bg-indigo-600 flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            <span className="text-sm font-bold text-white tracking-tight">Church Pass</span>
          </Link>
          <span className="text-[10px] font-semibold uppercase tracking-widest text-white/30">
            Admin Console
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/5 transition-colors"
            >
              <span className="text-xs">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-white/5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-indigo-600/30 flex items-center justify-center">
              <span className="text-xs font-bold text-indigo-400">
                {displayName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-white truncate">{displayName}</p>
              <p className="text-[10px] text-white/30">Church Admin</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
