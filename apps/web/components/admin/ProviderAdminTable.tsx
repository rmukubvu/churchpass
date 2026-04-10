"use client";

import { useState } from "react";
import Link from "next/link";
import type { ServiceProvider } from "@sanctuary/db";

interface Props {
  providers: ServiceProvider[];
  categoryLabels: Record<string, string>;
}

const STATUS_COLOURS: Record<string, string> = {
  pending:   "bg-amber-500/15 text-amber-400 border-amber-500/20",
  active:    "bg-green-500/15 text-green-400 border-green-500/20",
  suspended: "bg-white/5 text-white/30 border-white/10",
};

export function ProviderAdminTable({ providers: initial, categoryLabels }: Props) {
  const [providers, setProviders] = useState(initial);
  const [loading, setLoading] = useState<string | null>(null);

  async function verify(providerId: string, verified: boolean) {
    setLoading(providerId + "-verify");
    await fetch("/api/trpc/providers.verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ json: { providerId, verified } }),
    });
    setProviders((prev) =>
      prev.map((p) => (p.id === providerId ? { ...p, isVerified: verified } : p))
    );
    setLoading(null);
  }

  async function setStatus(providerId: string, status: "active" | "suspended" | "pending") {
    setLoading(providerId + "-status");
    await fetch("/api/trpc/providers.setStatus", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ json: { providerId, status } }),
    });
    setProviders((prev) =>
      prev.map((p) =>
        p.id === providerId ? { ...p, status } : p
      )
    );
    setLoading(null);
  }

  return (
    <div className="rounded-2xl border border-white/5 overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/5 bg-white/2">
            <th className="text-left px-4 py-3 text-xs font-bold text-white/30 uppercase tracking-widest">Business</th>
            <th className="text-left px-4 py-3 text-xs font-bold text-white/30 uppercase tracking-widest hidden sm:table-cell">Category</th>
            <th className="text-left px-4 py-3 text-xs font-bold text-white/30 uppercase tracking-widest hidden md:table-cell">City</th>
            <th className="text-left px-4 py-3 text-xs font-bold text-white/30 uppercase tracking-widest">Status</th>
            <th className="text-left px-4 py-3 text-xs font-bold text-white/30 uppercase tracking-widest hidden lg:table-cell">Inquiries</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {providers.map((p, i) => (
            <tr
              key={p.id}
              className={`border-b border-white/5 hover:bg-white/2 transition-colors ${i === providers.length - 1 ? "border-b-0" : ""}`}
            >
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <div>
                    <p className="font-semibold text-white flex items-center gap-1.5">
                      {p.businessName}
                      {p.isVerified && (
                        <span className="text-[10px] font-bold bg-indigo-600 text-white px-1.5 py-0.5 rounded-full">✓</span>
                      )}
                    </p>
                    <p className="text-xs text-white/30">{p.contactEmail}</p>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3 hidden sm:table-cell">
                <span className="text-xs text-white/50">{categoryLabels[p.category] ?? p.category}</span>
              </td>
              <td className="px-4 py-3 hidden md:table-cell">
                <span className="text-xs text-white/50">{p.city}</span>
              </td>
              <td className="px-4 py-3">
                <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border ${STATUS_COLOURS[p.status] ?? STATUS_COLOURS.pending}`}>
                  {p.status}
                </span>
              </td>
              <td className="px-4 py-3 hidden lg:table-cell">
                <span className="text-xs text-white/40">{p.inquiryCount}</span>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2 justify-end flex-wrap">
                  <Link
                    href={`/services/${p.slug}`}
                    target="_blank"
                    className="text-xs text-white/30 hover:text-indigo-400 transition-colors"
                  >
                    View
                  </Link>
                  <button
                    onClick={() => verify(p.id, !p.isVerified)}
                    disabled={loading === p.id + "-verify"}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors disabled:opacity-50 ${
                      p.isVerified
                        ? "border-white/10 text-white/40 hover:bg-white/5"
                        : "border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10"
                    }`}
                  >
                    {p.isVerified ? "Unverify" : "Verify ✓"}
                  </button>
                  {p.status === "active" ? (
                    <button
                      onClick={() => setStatus(p.id, "suspended")}
                      disabled={loading === p.id + "-status"}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                    >
                      Suspend
                    </button>
                  ) : (
                    <button
                      onClick={() => setStatus(p.id, "active")}
                      disabled={loading === p.id + "-status"}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-green-500/20 text-green-400 hover:bg-green-500/10 transition-colors disabled:opacity-50"
                    >
                      Activate
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
