import { notFound } from "next/navigation";
import { db } from "@/server/db";
import { serviceProviders, PROVIDER_CATEGORY_LABELS } from "@sanctuary/db";
import { eq, and } from "drizzle-orm";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { ProviderProfileClient } from "@/components/providers/ProviderProfileClient";

export const revalidate = 300;

export default async function ProviderProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const [provider] = await db
    .select()
    .from(serviceProviders)
    .where(and(eq(serviceProviders.slug, slug), eq(serviceProviders.status, "active")))
    .limit(1);

  if (!provider) notFound();

  const categoryLabel = PROVIDER_CATEGORY_LABELS[provider.category] ?? provider.category;
  const priceLabel = provider.priceFrom
    ? `From £${Math.round(provider.priceFrom / 100)}`
    : null;

  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-[#0f0f0f] pt-[88px] pb-16">

        {/* Hero banner */}
        <div className="relative h-56 sm:h-72 overflow-hidden bg-gradient-to-br from-white/5 to-white/2">
          {provider.bannerUrl ? (
            <img
              src={provider.bannerUrl}
              alt={provider.businessName}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-6xl opacity-10">🏢</div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f0f] via-black/30 to-transparent" />
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6">

          {/* Identity row */}
          <div className="flex items-end gap-4 -mt-10 mb-8 relative z-10">
            {provider.logoUrl ? (
              <img
                src={provider.logoUrl}
                alt={provider.businessName}
                className="w-20 h-20 rounded-2xl border-2 border-white/10 object-cover bg-[#1a1a1a] flex-none"
              />
            ) : (
              <div className="w-20 h-20 rounded-2xl border-2 border-white/10 bg-[#1a1a1a] flex items-center justify-center text-3xl flex-none">
                🏢
              </div>
            )}
            <div className="pb-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold text-white">{provider.businessName}</h1>
                {provider.isVerified && (
                  <span className="text-xs font-bold bg-indigo-600 text-white px-2 py-0.5 rounded-full">
                    ✓ Verified
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                <span className="text-xs text-white/40">📍 {provider.city}</span>
                <span className="text-xs text-white/30 border border-white/10 px-2 py-0.5 rounded-full">
                  {categoryLabel}
                </span>
                {priceLabel && (
                  <span className="text-xs font-semibold text-indigo-400">{priceLabel}</span>
                )}
                {provider.serviceRadius && (
                  <span className="text-xs text-white/30">
                    Serves within {provider.serviceRadius}km
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Main column */}
            <div className="lg:col-span-2 space-y-6">

              {/* Description */}
              {provider.description && (
                <div className="rounded-2xl border border-white/5 bg-[#1a1a1a] p-6">
                  <h2 className="text-sm font-bold text-white/50 uppercase tracking-widest mb-3">About</h2>
                  <p className="text-white/70 text-sm leading-relaxed whitespace-pre-wrap">
                    {provider.description}
                  </p>
                </div>
              )}

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl border border-white/5 bg-[#1a1a1a] p-5 text-center">
                  <p className="text-2xl font-bold text-white">{provider.inquiryCount}</p>
                  <p className="text-xs text-white/30 mt-1">Churches enquired</p>
                </div>
                <div className="rounded-2xl border border-white/5 bg-[#1a1a1a] p-5 text-center">
                  <p className="text-2xl font-bold text-white">
                    {new Date(provider.createdAt).getFullYear()}
                  </p>
                  <p className="text-xs text-white/30 mt-1">Listed since</p>
                </div>
              </div>
            </div>

            {/* Sidebar — contact */}
            <div className="space-y-4">
              <div className="rounded-2xl border border-white/5 bg-[#1a1a1a] p-5 space-y-4">
                <h2 className="text-sm font-bold text-white/50 uppercase tracking-widest">Contact</h2>

                <div className="space-y-2 text-sm">
                  <a
                    href={`mailto:${provider.contactEmail}`}
                    className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
                  >
                    <span>✉️</span>
                    <span className="truncate">{provider.contactEmail}</span>
                  </a>
                  {provider.contactPhone && (
                    <a
                      href={`tel:${provider.contactPhone}`}
                      className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
                    >
                      <span>📞</span>
                      <span>{provider.contactPhone}</span>
                    </a>
                  )}
                  {provider.website && (
                    <a
                      href={provider.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
                    >
                      <span>🌐</span>
                      <span className="truncate">{provider.website.replace(/^https?:\/\//, "")}</span>
                    </a>
                  )}
                  {provider.instagramHandle && (
                    <a
                      href={`https://instagram.com/${provider.instagramHandle}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
                    >
                      <span>📸</span>
                      <span>@{provider.instagramHandle}</span>
                    </a>
                  )}
                </div>

                {/* Client component handles the inquiry modal */}
                <ProviderProfileClient
                  providerId={provider.id}
                  providerName={provider.businessName}
                />
              </div>
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
