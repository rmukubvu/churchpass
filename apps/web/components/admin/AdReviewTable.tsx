"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc-client";
import type { Ad } from "@sanctuary/db";

type Props = {
  ads: Ad[];
  showActions?: boolean;
};

const STATUS_COLOURS: Record<string, string> = {
  pending_payment: "text-white/30 bg-white/5",
  pending_review: "text-amber-400 bg-amber-400/10",
  approved: "text-emerald-400 bg-emerald-400/10",
  rejected: "text-red-400 bg-red-400/10",
  expired: "text-white/30 bg-white/5",
  paused: "text-orange-400 bg-orange-400/10",
};

export function AdReviewTable({ ads, showActions = true }: Props) {
  const [localAds, setLocalAds] = useState(ads);
  const [loading, setLoading] = useState<string | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState("");

  async function approve(adId: string) {
    setLoading(adId);
    try {
      await trpc.ads.approve.mutate({ adId, sortOrder: 5 });
      setLocalAds((prev) => prev.map((a) => a.id === adId ? { ...a, status: "approved" as const } : a));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(null);
    }
  }

  async function reject(adId: string) {
    setLoading(adId);
    try {
      await trpc.ads.reject.mutate({ adId, reason: rejectNote });
      setLocalAds((prev) => prev.map((a) => a.id === adId ? { ...a, status: "rejected" as const } : a));
      setRejectId(null);
      setRejectNote("");
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="rounded-2xl border border-white/5 overflow-hidden">
      <div className="divide-y divide-white/5">
        {localAds.map((ad) => (
          <div key={ad.id} className="p-5 hover:bg-white/[0.02] transition-colors">
            <div className="flex gap-4 items-start">
              {/* Thumbnail */}
              <div className="w-32 h-20 rounded-xl overflow-hidden bg-white/5 flex-none">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={ad.imageUrl} alt={ad.headline} className="w-full h-full object-cover" />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-white">{ad.headline}</p>
                    {ad.subheadline && <p className="text-xs text-white/40 mt-0.5">{ad.subheadline}</p>}
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full flex-none ${STATUS_COLOURS[ad.status] ?? "text-white/30"}`}>
                    {ad.status.replace("_", " ")}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-white/40">
                  <span className="font-semibold text-white/60">{ad.advertiserName}</span>
                  <span>·</span>
                  <span>{ad.advertiserEmail}</span>
                  <span>·</span>
                  <span className="capitalize">{ad.duration.replace("_", " ")}</span>
                  <span>·</span>
                  <a href={ad.clickUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 truncate max-w-[200px]">
                    {ad.clickUrl}
                  </a>
                </div>

                {/* Stats */}
                {(ad.impressions > 0 || ad.clicks > 0) && (
                  <div className="flex gap-4 mt-2 text-xs text-white/30">
                    <span>{ad.impressions.toLocaleString()} impressions</span>
                    <span>{ad.clicks.toLocaleString()} clicks</span>
                    {ad.impressions > 0 && (
                      <span>{((ad.clicks / ad.impressions) * 100).toFixed(1)}% CTR</span>
                    )}
                  </div>
                )}

                {/* Actions */}
                {showActions && ad.status === "pending_review" && (
                  <div className="flex items-center gap-3 mt-3">
                    <button
                      onClick={() => approve(ad.id)}
                      disabled={loading === ad.id}
                      className="text-xs font-bold px-4 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 disabled:opacity-50 transition-colors">
                      {loading === ad.id ? "…" : "✓ Approve"}
                    </button>
                    <button
                      onClick={() => setRejectId(ad.id)}
                      disabled={loading === ad.id}
                      className="text-xs font-bold px-4 py-1.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 disabled:opacity-50 transition-colors">
                      ✕ Reject
                    </button>
                  </div>
                )}

                {/* Reject reason input */}
                {rejectId === ad.id && (
                  <div className="mt-3 flex gap-2">
                    <input
                      className="flex-1 px-3 py-1.5 rounded-lg bg-[#0a0a0f] border border-white/10 text-white text-xs focus:outline-none focus:border-red-500 placeholder:text-white/20"
                      placeholder="Reason (optional)…"
                      value={rejectNote}
                      onChange={(e) => setRejectNote(e.target.value)}
                    />
                    <button
                      onClick={() => reject(ad.id)}
                      disabled={loading === ad.id}
                      className="text-xs font-bold px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white disabled:opacity-50 transition-colors">
                      Confirm
                    </button>
                    <button
                      onClick={() => setRejectId(null)}
                      className="text-xs text-white/30 hover:text-white/60 transition-colors px-2">
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
