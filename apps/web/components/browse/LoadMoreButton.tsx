"use client";

import { useState } from "react";

type Props = {
  onLoadMore: () => Promise<boolean>;
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
    <div className="flex justify-center pt-10 pb-4">
      <button
        onClick={handleClick}
        disabled={state === "loading"}
        className="px-7 py-3 rounded-full border border-white/15 bg-white/5 text-sm font-semibold text-white/70 hover:bg-white/10 hover:text-white hover:border-white/25 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {state === "loading" ? (
          <span className="flex items-center gap-2">
            <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Loading…
          </span>
        ) : (
          "See more events"
        )}
      </button>
    </div>
  );
}
