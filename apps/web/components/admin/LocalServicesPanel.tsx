"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PROVIDER_CATEGORY_LABELS } from "@sanctuary/db";
import type { ServiceProvider } from "@sanctuary/db";

interface Props {
  city: string;
}

export function LocalServicesPanel({ city }: Props) {
  const [providers, setProviders] = useState<ServiceProvider[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!city.trim()) return;
    setLoading(true);
    fetch("/api/trpc/providers.nearEvent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ json: { city } }),
    })
      .then((r) => r.json())
      .then((data: { result?: { data?: { json?: ServiceProvider[] } } }) => {
        setProviders(data?.result?.data?.json ?? []);
      })
      .catch(() => setProviders([]))
      .finally(() => setLoading(false));
  }, [city]);

  if (!city.trim()) return null;

  if (loading) {
    return (
      <div className="mt-4 rounded-xl border border-white/5 bg-[#1a1a1a] p-4">
        <p className="text-xs text-white/30 animate-pulse">Finding local service providers…</p>
      </div>
    );
  }

  if (providers.length === 0) return null;

  return (
    <div className="mt-4 rounded-xl border border-indigo-500/15 bg-indigo-500/5 p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest">
          Local services near {city}
        </p>
        <Link
          href={`/services?city=${encodeURIComponent(city)}`}
          className="text-xs text-white/30 hover:text-indigo-400 transition-colors"
          target="_blank"
        >
          View all →
        </Link>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {providers.map((p) => (
          <Link
            key={p.id}
            href={`/services/${p.slug}`}
            target="_blank"
            className="group rounded-xl border border-white/5 bg-[#0f0f0f] hover:border-indigo-500/30 p-3 transition-colors"
          >
            <div className="flex items-center gap-2 mb-1">
              {p.logoUrl ? (
                <img src={p.logoUrl} alt={p.businessName} className="w-6 h-6 rounded-md object-cover flex-none" />
              ) : (
                <div className="w-6 h-6 rounded-md bg-white/5 flex items-center justify-center text-xs flex-none">🏢</div>
              )}
              <p className="text-xs font-semibold text-white truncate group-hover:text-indigo-300 transition-colors">
                {p.businessName}
              </p>
            </div>
            <p className="text-[10px] text-white/30">
              {PROVIDER_CATEGORY_LABELS[p.category] ?? p.category}
            </p>
            {p.priceFrom && (
              <p className="text-[10px] text-indigo-400/70 mt-0.5">
                From £{Math.round(p.priceFrom / 100)}
              </p>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
