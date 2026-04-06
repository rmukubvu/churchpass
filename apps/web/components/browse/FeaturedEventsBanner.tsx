export function FeaturedEventsBanner() {
  return (
    <section className="relative overflow-hidden" style={{ minHeight: "420px" }}>
      {/* Real photography background */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/header/ga2G2.jpg')" }}
      />

      {/* Dark overlay so text stays readable */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "rgba(0,0,0,0.45)" }}
      />

      {/* Subtle indigo tint overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(160deg, rgba(13,11,30,0.5) 0%, rgba(42,20,85,0.35) 60%, transparent 100%)",
        }}
      />

      {/* Bottom fade into page */}
      <div
        className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none"
        style={{ background: "linear-gradient(to bottom, transparent, #0a0a0f)" }}
      />

      {/* Content — bottom-left aligned like Wander */}
      <div
        className="relative max-w-7xl mx-auto px-5 sm:px-8 flex flex-col justify-end"
        style={{ paddingTop: "120px", paddingBottom: "52px", minHeight: "420px" }}
      >
        {/* Social proof badge — top left */}
        <div className="absolute top-24 left-5 sm:left-8">
          <span className="inline-flex items-center gap-2 text-xs font-semibold border border-white/15 rounded-full px-3.5 py-1.5"
            style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.7)" }}>
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 inline-block" />
            1,200+ events · 340 churches · Free to RSVP
          </span>
        </div>

        {/* Headline — bottom left */}
        <h1
          className="font-extrabold text-white leading-[1.04] tracking-tight mb-3"
          style={{ fontSize: "clamp(2.4rem, 5.5vw, 4rem)", maxWidth: "640px" }}
        >
          Find your{" "}
          <span
            className="text-transparent bg-clip-text"
            style={{ backgroundImage: "linear-gradient(90deg, #a78bfa, #818cf8)" }}
          >
            next event
          </span>
        </h1>

        <p className="text-white/50 font-medium leading-relaxed" style={{ fontSize: "1rem", maxWidth: "480px" }}>
          Church conferences, revivals, and retreats — discover and RSVP in seconds.
        </p>
      </div>
    </section>
  );
}
