"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { SignInButton, SignedIn, SignedOut, UserButton, useUser } from "@clerk/nextjs";
import { useRouter, usePathname } from "next/navigation";

function AdminLink() {
  const { user, isLoaded } = useUser();
  if (!isLoaded || !user) return null;

  const isSuperAdmin =
    user.publicMetadata?.role === "admin" ||
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
          className="text-sm font-medium text-white/60 hover:text-white transition-colors"
        >
          My Church
        </Link>
      )}
      {isSuperAdmin && (
        <Link
          href="/admin"
          className="text-sm font-medium text-white/60 hover:text-white transition-colors"
        >
          Admin
        </Link>
      )}
    </>
  );
}

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [what, setWhat] = useState("");
  const [where, setWhere] = useState("");
  const router = useRouter();
  const pathname = usePathname();

  // On event detail pages show Sign In; elsewhere show List Events
  const isEventPage = /^\/[^/]+\/events\/[^/]+/.test(pathname);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (what) params.set("q", what);
    if (where) params.set("city", where);
    router.push(`/search?${params.toString()}`);
  }

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-[#0a0a0f]/95 backdrop-blur-md border-b border-white/5 shadow-lg shadow-black/20"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-5 sm:px-8 flex items-center" style={{ height: "72px" }}>

        {/* Left: Logo — fixed width so search can truly center */}
        <div className="flex-1 flex items-center">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-900/40 group-hover:bg-indigo-500 transition-colors">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            <span className="font-bold text-white text-[17px] tracking-tight">ChurchPass</span>
          </Link>
        </div>

        {/* Center: search bar — absolutely centered */}
        <form
          onSubmit={handleSearch}
          className="hidden md:flex items-center rounded-full overflow-hidden transition-all duration-200 flex-none"
          style={{
            background: "rgba(255,255,255,0.95)",
            border: "1px solid rgba(255,255,255,0.15)",
            boxShadow: "0 2px 16px rgba(0,0,0,0.25)",
            height: "46px",
            width: "480px",
          }}
        >
          {/* What */}
          <div className="flex flex-col justify-center flex-1 px-4 border-r border-gray-200" style={{ minWidth: 0 }}>
            <label className="text-[9px] font-bold uppercase tracking-widest leading-none mb-0.5 text-gray-400">What</label>
            <input
              type="text"
              placeholder="Events, churches, revivals…"
              value={what}
              onChange={(e) => setWhat(e.target.value)}
              className="w-full bg-transparent text-gray-800 font-medium outline-none placeholder:text-gray-400 truncate"
              style={{ fontSize: "12px" }}
            />
          </div>
          {/* Where */}
          <div className="flex flex-col justify-center px-4" style={{ width: "140px", flexShrink: 0 }}>
            <label className="text-[9px] font-bold uppercase tracking-widest leading-none mb-0.5 text-gray-400">Where</label>
            <input
              type="text"
              placeholder="City or state"
              value={where}
              onChange={(e) => setWhere(e.target.value)}
              className="w-full bg-transparent text-gray-800 font-medium outline-none placeholder:text-gray-400"
              style={{ fontSize: "12px" }}
            />
          </div>
          {/* Search button */}
          <div className="pr-1.5 flex-none">
            <button
              type="submit"
              className="flex items-center justify-center rounded-full transition-colors"
              style={{ width: "36px", height: "36px", background: "#4F46E5" }}
            >
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012.15 12.15z" />
              </svg>
            </button>
          </div>
        </form>

        {/* Right: actions — fixed width matching left */}
        <div className="flex-1 flex items-center justify-end gap-3">
          <SignedIn>
            <Link
              href="/my-events"
              className="text-sm font-medium text-white/60 hover:text-white transition-colors hidden sm:block"
            >
              My Events
            </Link>
            <AdminLink />
            <UserButton appearance={{ elements: { avatarBox: "w-8 h-8" } }} />
          </SignedIn>

          <SignedOut>
            {isEventPage ? (
              <SignInButton mode="modal">
                <button className="text-sm font-bold px-5 py-2 rounded-full bg-white text-[#0a0a0f] hover:bg-white/90 transition-colors">
                  Sign in
                </button>
              </SignInButton>
            ) : (
              <Link
                href="/register"
                className="text-sm font-bold px-5 py-2 rounded-full border border-white/30 text-white hover:bg-white/10 transition-colors"
              >
                List Events
              </Link>
            )}
          </SignedOut>
        </div>

      </div>
    </header>
  );
}
