import Link from "next/link";
import { db } from "@/server/db";
import { serviceProviders, PROVIDER_CATEGORY_LABELS } from "@sanctuary/db";
import { eq, and, ilike, or } from "drizzle-orm";
import { ProviderCard } from "@/components/providers/ProviderCard";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";

export const revalidate = 300;

interface SearchParams {
  category?: string;
  city?: string;
  q?: string;
}

export default async function ServicesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const { category, city, q } = params;

  const conditions = [eq(serviceProviders.status, "active")];

  if (category && PROVIDER_CATEGORY_LABELS[category]) {
    conditions.push(
      eq(serviceProviders.category, category as typeof serviceProviders.category._.data)
    );
  }
  if (city) {
    conditions.push(ilike(serviceProviders.city, `%${city}%`));
  }
  if (q) {
    conditions.push(
      or(
        ilike(serviceProviders.businessName, `%${q}%`),
        ilike(serviceProviders.description, `%${q}%`),
      )!
    );
  }

  const providers = await db
    .select()
    .from(serviceProviders)
    .where(and(...conditions))
    .orderBy(serviceProviders.isVerified, serviceProviders.inquiryCount)
    .limit(48);

  const categories = Object.entries(PROVIDER_CATEGORY_LABELS);

  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-[#0f0f0f] pt-[88px] pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">

          {/* Header */}
          <div className="py-10 border-b border-white/5 mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Event Service Providers</h1>
            <p className="text-white/40 max-w-xl">
              Trusted businesses offering AV, catering, photography, furniture hire and more — available to church event organisers across the UK.
            </p>

            {/* Search bar */}
            <form method="GET" action="/services" className="mt-6 flex flex-col sm:flex-row gap-3 max-w-2xl">
              <input
                name="q"
                defaultValue={q}
                placeholder="Search by name or keyword…"
                className="flex-1 px-4 py-2.5 rounded-xl bg-[#1a1a1a] border border-white/10 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-indigo-500"
              />
              <input
                name="city"
                defaultValue={city}
                placeholder="City (e.g. London)"
                className="w-full sm:w-44 px-4 py-2.5 rounded-xl bg-[#1a1a1a] border border-white/10 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-colors"
              >
                Search
              </button>
            </form>
          </div>

          {/* Category filter pills */}
          <div className="flex items-center gap-2 flex-wrap mb-8">
            <Link
              href="/services"
              className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                !category
                  ? "bg-indigo-600 border-indigo-600 text-white"
                  : "border-white/10 text-white/40 hover:border-white/20 hover:text-white/60"
              }`}
            >
              All services
            </Link>
            {categories.map(([value, label]) => (
              <Link
                key={value}
                href={`/services?category=${value}${city ? `&city=${city}` : ""}${q ? `&q=${q}` : ""}`}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                  category === value
                    ? "bg-indigo-600 border-indigo-600 text-white"
                    : "border-white/10 text-white/40 hover:border-white/20 hover:text-white/60"
                }`}
              >
                {label}
              </Link>
            ))}
          </div>

          {/* Grid */}
          {providers.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {providers.map((provider) => (
                <ProviderCard key={provider.id} provider={provider} />
              ))}
            </div>
          ) : (
            <div className="text-center py-24">
              <div className="text-5xl mb-4">🔍</div>
              <p className="text-white/40 text-sm">
                No service providers found{city ? ` in ${city}` : ""}{category ? ` for ${PROVIDER_CATEGORY_LABELS[category]}` : ""}.
              </p>
              <Link href="/services" className="mt-4 inline-block text-sm text-indigo-400 hover:text-indigo-300 transition-colors">
                Clear filters →
              </Link>
            </div>
          )}

          {/* CTA for providers */}
          <div className="mt-16 rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-8 text-center">
            <p className="text-white font-bold text-lg mb-2">Are you a service provider?</p>
            <p className="text-white/40 text-sm mb-5">
              List your business and get discovered by churches organising events near you — for free.
            </p>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-colors"
            >
              Register your business →
            </Link>
          </div>

        </div>
      </main>
      <SiteFooter />
    </>
  );
}
