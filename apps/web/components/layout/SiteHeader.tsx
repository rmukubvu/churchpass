"use client";

import Link from "next/link";
import { SignInButton, SignedIn, SignedOut, UserButton, useUser } from "@clerk/nextjs";

/** Shows "My Church" for church admins and "Admin" for super-admins */
function AdminLink() {
  const { user, isLoaded } = useUser();
  if (!isLoaded || !user) return null;

  const isSuperAdmin =
    user.publicMetadata?.role === "admin" ||
    // local dev convenience: NEXT_PUBLIC_ADMIN_USER_IDS env var
    (process.env["NEXT_PUBLIC_ADMIN_USER_IDS"] ?? "")
      .split(",")
      .map((id) => id.trim())
      .includes(user.id);

  const adminOf = user.publicMetadata?.adminOf as string[] | undefined;
  const churchSlug = adminOf?.[0];

  return (
    <>
      {churchSlug && (
        <Link
          href={`/${churchSlug}/admin`}
          className="text-sm text-white/70 hover:text-white transition-colors"
        >
          My Church
        </Link>
      )}
      {isSuperAdmin && (
        <Link
          href="/admin"
          className="text-sm text-white/70 hover:text-white transition-colors"
        >
          Admin
        </Link>
      )}
    </>
  );
}

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 bg-[#0f0f0f]/90 backdrop-blur border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-indigo-600 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          <span className="font-bold text-white text-lg tracking-tight">Church Pass</span>
        </Link>

        {/* Nav — public links only */}
        <nav className="hidden md:flex items-center gap-6">
          <Link href="/" className="text-sm text-white/60 hover:text-white transition-colors">
            Browse
          </Link>
          <a
            href="mailto:help@churchpass.events"
            className="text-sm text-white/60 hover:text-white transition-colors"
          >
            Help
          </a>
        </nav>

        {/* Auth */}
        <div className="flex items-center gap-3">
          <SignedOut>
            <SignInButton mode="modal">
              <button className="text-sm font-semibold text-white/70 hover:text-white transition-colors">
                Sign in
              </button>
            </SignInButton>
            <Link
              href="/register"
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              Get started
            </Link>
          </SignedOut>

          <SignedIn>
            <Link
              href="/my-events"
              className="text-sm text-white/60 hover:text-white transition-colors hidden sm:block"
            >
              My Events
            </Link>
            {/* Only rendered for admin-role users */}
            <AdminLink />
            <UserButton
              appearance={{
                elements: { avatarBox: "w-8 h-8" },
              }}
            />
          </SignedIn>
        </div>
      </div>
    </header>
  );
}
