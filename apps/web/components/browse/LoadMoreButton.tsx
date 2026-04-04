"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

type Props = {
  /** Called when user clicks — should append more items */
  onLoadMore: () => Promise<boolean>; // returns true if more items remain
};

type State = "idle" | "loading" | "done";

export function LoadMoreButton({ onLoadMore }: Props) {
  const [state, setState] = useState<State>("idle");

  async function handleClick() {
    setState("loading");
    const hasMore = await onLoadMore();
    setState(hasMore ? "idle" : "done");
  }

  if (state === "done") return null;

  return (
    <div className="flex justify-center pt-8">
      <button
        onClick={handleClick}
        disabled={state === "loading"}
        className={cn(
          "flex items-center gap-2 px-6 py-3 rounded-xl border text-sm font-semibold transition-all",
          state === "loading"
            ? "bg-white/5 border-white/10 text-white/30 cursor-not-allowed"
            : "bg-[#1a1a1a] border-white/10 text-white/60 hover:text-white hover:border-white/20 hover:bg-[#252525]"
        )}
      >
        {state === "loading" ? (
          <>
            <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Loading…
          </>
        ) : (
          <>
            Load more
            <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
              <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </>
        )}
      </button>
    </div>
  );
}
