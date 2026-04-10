"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc-client";

type Props = {
  eventId: string;
  isFeatured: boolean;
};

export function FeatureButton({ eventId, isFeatured: initialFeatured }: Props) {
  const [featured, setFeatured] = useState(initialFeatured);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    try {
      await trpc.events.setFeatured.mutate({
        eventId,
        durationDays: featured ? 0 : 30, // 0 = remove, 30 = feature for 30 days
        sortOrder: 1,
      });
      setFeatured(!featured);
    } catch (err) {
      console.error("setFeatured error:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      title={featured ? "Remove from homepage slider" : "Feature on homepage slider (30 days)"}
      className={`text-xs font-semibold transition-colors whitespace-nowrap disabled:opacity-40 ${
        featured
          ? "text-amber-400 hover:text-amber-300"
          : "text-white/30 hover:text-amber-400"
      }`}
    >
      {loading ? "…" : featured ? "★ Featured" : "☆ Feature"}
    </button>
  );
}
