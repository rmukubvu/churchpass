import { currentUser } from "@clerk/nextjs/server";

export default async function AdminDashboardPage() {
  const user = await currentUser();
  const firstName = user?.firstName ?? "Admin";

  const stats = [
    { label: "Total Events", value: "3", sub: "Sound of Revival 2026", colour: "indigo" },
    { label: "Total RSVPs", value: "0", sub: "No registrations yet", colour: "emerald" },
    { label: "Checked In", value: "0", sub: "Events not started", colour: "amber" },
    { label: "First-Timers", value: "0", sub: "Today", colour: "rose" },
  ] as const;

  const colourMap = {
    indigo: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
    emerald: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    amber: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    rose: "text-rose-400 bg-rose-500/10 border-rose-500/20",
  };

  return (
    <div className="p-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Welcome back, {firstName}</h1>
        <p className="text-white/40 mt-1 text-sm">Koinonia Global · Admin Console</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className={`rounded-xl border p-5 ${colourMap[stat.colour]}`}
          >
            <p className="text-xs font-semibold uppercase tracking-wider opacity-70 mb-2">
              {stat.label}
            </p>
            <p className="text-3xl font-black">{stat.value}</p>
            <p className="text-xs opacity-50 mt-1">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <QuickCard
          title="Manage Events"
          description="Create, edit, and publish church events. Set capacity, RSVP requirements, and category."
          href="/admin/events"
          cta="View Events →"
        />
        <QuickCard
          title="Attendees"
          description="View RSVP lists, check-in status, and first-timer flags for each event."
          href="/admin/attendees"
          cta="View Attendees →"
        />
      </div>

      {/* DB warning when running on dev data */}
      <div className="mt-8 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
        <p className="text-xs font-semibold text-amber-400 mb-1">Development Mode</p>
        <p className="text-xs text-white/40">
          The app is running on static dev data. Push the schema and seed the database to
          activate live data.{" "}
          <code className="text-white/60">pnpm --filter @sanctuary/db db:push</code> then{" "}
          <code className="text-white/60">pnpm --filter @sanctuary/db db:seed</code>
        </p>
      </div>
    </div>
  );
}

function QuickCard({
  title,
  description,
  href,
  cta,
}: {
  title: string;
  description: string;
  href: string;
  cta: string;
}) {
  return (
    <a
      href={href}
      className="group block rounded-xl bg-[#1a1a1a] border border-white/5 hover:border-indigo-500/30 p-6 transition-all hover:shadow-lg hover:shadow-indigo-900/20"
    >
      <h3 className="font-bold text-white mb-2 group-hover:text-indigo-300 transition-colors">
        {title}
      </h3>
      <p className="text-sm text-white/40 mb-4 leading-relaxed">{description}</p>
      <span className="text-xs font-semibold text-indigo-400 group-hover:text-indigo-300 transition-colors">
        {cta}
      </span>
    </a>
  );
}
