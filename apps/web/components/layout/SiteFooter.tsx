import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="bg-[#0a0a0f] border-t border-white/5 mt-16">

      {/* Social row */}
      <div className="max-w-7xl mx-auto px-5 sm:px-8 py-5 flex flex-wrap items-center gap-x-8 gap-y-3 border-b border-white/5">
        <span className="text-sm font-semibold text-white/40">Follow us @churchpass</span>
        {[
          { label: "X (Twitter)", href: "https://x.com" },
          { label: "Instagram",   href: "https://instagram.com" },
          { label: "Facebook",    href: "https://facebook.com" },
          { label: "YouTube",     href: "https://youtube.com" },
        ].map(({ label, href }) => (
          <a
            key={label}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-white/40 hover:text-white transition-colors"
          >
            {label}
          </a>
        ))}
      </div>

      {/* Main columns */}
      <div className="max-w-7xl mx-auto px-5 sm:px-8 py-12 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-10">

        {/* Logo */}
        <div className="col-span-2 sm:col-span-3 lg:col-span-1">
          <Link href="/" className="flex items-center gap-2.5 group w-fit">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-900/40 group-hover:bg-indigo-500 transition-colors">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            <span className="font-bold text-white text-[17px] tracking-tight">ChurchPass</span>
          </Link>
          <p className="mt-3 text-xs text-white/30 leading-relaxed max-w-[180px]">
            Discover church events near you — conferences, revivals &amp; more.
          </p>
        </div>

        {/* Discover */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-white/30 mb-4">Discover</p>
          <ul className="space-y-3">
            {[
              { label: "Browse Events",     href: "/" },
              { label: "My Events",         href: "/my-events" },
              { label: "Service Providers", href: "/services" },
              { label: "Contact Us",        href: "/contact" },
            ].map(({ label, href }) => (
              <li key={label}>
                <Link href={href} className="text-sm text-white/45 hover:text-white transition-colors">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* For Churches */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-white/30 mb-4">For Churches</p>
          <ul className="space-y-3">
            {[
              { label: "Register Your Church", href: "/register" },
              { label: "Church Dashboard",     href: "/admin" },
            ].map(({ label, href }) => (
              <li key={label}>
                <Link href={href} className="text-sm text-white/45 hover:text-white transition-colors">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Advertise */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-white/30 mb-4">Advertising</p>
          <ul className="space-y-3">
            {[
              { label: "Advertise with Us", href: "/advertise" },
              { label: "Pricing",           href: "/advertise#pricing" },
            ].map(({ label, href }) => (
              <li key={label}>
                <Link href={href} className="text-sm text-white/45 hover:text-white transition-colors">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

      </div>

      {/* Bottom bar */}
      <div className="max-w-7xl mx-auto px-5 sm:px-8 py-5 border-t border-white/5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-6">
          <span className="text-xs text-white/25 font-medium">Find your next event ®</span>
          <span className="text-xs text-white/20">© {new Date().getFullYear()} ChurchPass, Inc.</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/privacy" className="text-xs text-white/25 hover:text-white/50 transition-colors">Privacy</Link>
          <Link href="/terms"   className="text-xs text-white/25 hover:text-white/50 transition-colors">Terms</Link>
        </div>
      </div>

    </footer>
  );
}
