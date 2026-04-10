import Link from "next/link";
import type { ServiceProvider } from "@sanctuary/db";
import { PROVIDER_CATEGORY_LABELS } from "@/lib/provider-categories";

interface Props {
  provider: ServiceProvider;
}

export function ProviderCard({ provider }: Props) {
  const categoryLabel = PROVIDER_CATEGORY_LABELS[provider.category] ?? provider.category;
  const priceLabel = provider.priceFrom
    ? `From £${Math.round(provider.priceFrom / 100)}`
    : null;

  return (
    <Link
      href={`/services/${provider.slug}`}
      className="group flex flex-col rounded-2xl border border-white/5 bg-[#1a1a1a] hover:border-indigo-500/30 hover:bg-[#1e1e2e] transition-all overflow-hidden"
    >
      {/* Banner / logo area */}
      <div className="relative h-28 bg-gradient-to-br from-white/5 to-white/2 flex items-center justify-center overflow-hidden">
        {provider.bannerUrl ? (
          <img
            src={provider.bannerUrl}
            alt={provider.businessName}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="text-4xl opacity-30">🏢</div>
        )}
        {/* Category badge */}
        <span className="absolute top-2 left-2 text-[10px] font-bold uppercase tracking-widest bg-black/60 text-white/70 px-2 py-0.5 rounded-full backdrop-blur-sm">
          {categoryLabel}
        </span>
        {/* Verified badge */}
        {provider.isVerified && (
          <span className="absolute top-2 right-2 text-[10px] font-bold bg-indigo-600/90 text-white px-2 py-0.5 rounded-full backdrop-blur-sm flex items-center gap-1">
            ✓ Verified
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 p-4 flex flex-col gap-2">
        <div className="flex items-start gap-2">
          {provider.logoUrl ? (
            <img
              src={provider.logoUrl}
              alt={provider.businessName}
              className="w-8 h-8 rounded-lg object-cover flex-none border border-white/10"
            />
          ) : (
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 flex items-center justify-center flex-none text-sm">
              🏢
            </div>
          )}
          <div className="min-w-0">
            <p className="text-sm font-bold text-white truncate group-hover:text-indigo-300 transition-colors">
              {provider.businessName}
            </p>
            <p className="text-xs text-white/40 truncate">📍 {provider.city}</p>
          </div>
        </div>

        {provider.description && (
          <p className="text-xs text-white/40 line-clamp-2 leading-relaxed">
            {provider.description}
          </p>
        )}

        <div className="mt-auto pt-2 flex items-center justify-between">
          {priceLabel ? (
            <span className="text-xs font-semibold text-indigo-400">{priceLabel}</span>
          ) : (
            <span className="text-xs text-white/20">Contact for pricing</span>
          )}
          <span className="text-xs text-white/30 group-hover:text-indigo-400 transition-colors">
            View →
          </span>
        </div>
      </div>
    </Link>
  );
}
