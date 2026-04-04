import { HeroSearchBar } from "./HeroSearchBar";

/** Hero banner with event search bar */
export function FeaturedEventsBanner() {
  return (
    <section className="relative overflow-hidden bg-[#0f0f0f]">
      {/* Ambient glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-indigo-700/20 rounded-full blur-3xl" />
        <div className="absolute top-20 left-1/4 w-[300px] h-[300px] bg-purple-700/10 rounded-full blur-3xl" />
        <div className="absolute top-10 right-1/4 w-[250px] h-[250px] bg-indigo-900/15 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 py-20 md:py-28 flex flex-col items-center text-center gap-6">
        {/* Badge */}
        <span className="inline-flex items-center gap-1.5 bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
          Church Events Platform
        </span>

        {/* Headline */}
        <h1 className="text-5xl md:text-6xl font-extrabold text-white leading-[1.05] tracking-tight max-w-2xl">
          Your event.{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
            Your stay.
          </span>
        </h1>

        <p className="text-white/50 text-base md:text-lg max-w-lg leading-relaxed">
          Discover conferences and revivals happening near you — then find a place to stay, all in one place.
        </p>

        {/* Search bar */}
        <div className="w-full mt-2">
          <HeroSearchBar />
        </div>

        {/* Step strip */}
        <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-0 mt-2 text-white/30 text-xs font-medium">
          <span className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-indigo-600/40 border border-indigo-500/40 text-indigo-300 text-[10px] font-bold flex items-center justify-center">1</span>
            Find your event
          </span>
          <span className="hidden sm:block mx-3 text-white/15">›</span>
          <span className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-indigo-600/40 border border-indigo-500/40 text-indigo-300 text-[10px] font-bold flex items-center justify-center">2</span>
            RSVP in seconds
          </span>
          <span className="hidden sm:block mx-3 text-white/15">›</span>
          <span className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-indigo-600/40 border border-indigo-500/40 text-indigo-300 text-[10px] font-bold flex items-center justify-center">3</span>
            Book nearby stays
          </span>
        </div>
      </div>
    </section>
  );
}
