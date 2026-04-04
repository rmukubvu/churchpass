"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  { value: "all", label: "All Events" },
  { value: "conference", label: "Conference" },
  { value: "worship", label: "Worship" },
  { value: "outreach", label: "Outreach" },
  { value: "youth", label: "Youth" },
  { value: "family", label: "Family" },
] as const;

export function CategoryTabs() {
  const [active, setActive] = useState<string>("all");

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none" id="browse">
      {CATEGORIES.map((cat) => (
        <button
          key={cat.value}
          onClick={() => setActive(cat.value)}
          className={cn(
            "flex-none px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap",
            active === cat.value
              ? "bg-indigo-600 text-white"
              : "bg-[#1a1a1a] text-white/50 hover:text-white hover:bg-[#252525]"
          )}
        >
          {cat.label}
        </button>
      ))}
    </div>
  );
}
