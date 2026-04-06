"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc-client";

type MultiRsvpBarProps = {
  selectedIds: string[];
  churchSlug: string;
  churchName: string;
  onSuccess: () => void;
};

type RsvpState = "idle" | "loading" | "success" | "error";

export function MultiRsvpBar({
  selectedIds,
  churchSlug,
  churchName,
  onSuccess,
}: MultiRsvpBarProps) {
  const { isSignedIn } = useAuth();
  const [state, setState] = useState<RsvpState>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const count = selectedIds.length;
  const visible = count > 0;

  async function handleRsvp() {
    if (!isSignedIn) {
      // Redirect to sign-in, returning to current page
      window.location.href = `/sign-in?redirect_url=${encodeURIComponent(window.location.href)}`;
      return;
    }

    setState("loading");
    setErrorMsg("");

    try {
      await trpc.rsvps.createBatch.mutate({ eventIds: selectedIds, churchSlug, churchName });

      setState("success");
      onSuccess();

      // Reset to idle after 3 s
      setTimeout(() => setState("idle"), 3000);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong");
      setState("error");
      setTimeout(() => setState("idle"), 4000);
    }
  }

  return (
    <div
      className={cn(
        "fixed bottom-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-300",
        visible ? "translate-y-0 opacity-100" : "translate-y-20 opacity-0 pointer-events-none"
      )}
      aria-live="polite"
    >
      <div className="flex items-center gap-3 bg-[#1a1a1a] border border-white/10 rounded-2xl px-4 py-3 shadow-2xl shadow-black/60 backdrop-blur-sm">
        {/* Count pill */}
        <div className="flex items-center gap-2 pr-3 border-r border-white/10">
          <span className="w-6 h-6 bg-indigo-600 rounded-full text-white text-xs font-bold flex items-center justify-center">
            {count}
          </span>
          <span className="text-sm text-white/70 whitespace-nowrap">
            event{count !== 1 ? "s" : ""} selected
          </span>
        </div>

        {/* State-driven button */}
        {state === "success" ? (
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-600/20 border border-green-500/30">
            <svg className="w-4 h-4 text-green-400" viewBox="0 0 16 16" fill="none">
              <path d="M3 8l3.5 3.5L13 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="text-sm font-semibold text-green-300">RSVPs confirmed!</span>
          </div>
        ) : state === "error" ? (
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600/20 border border-red-500/30">
            <span className="text-sm font-semibold text-red-300">{errorMsg || "Error — try again"}</span>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleRsvp}
            disabled={state === "loading"}
            className={cn(
              "flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-white transition-all",
              state === "loading"
                ? "bg-indigo-700 opacity-70 cursor-not-allowed"
                : "bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700"
            )}
          >
            {state === "loading" ? (
              <>
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Confirming…
              </>
            ) : (
              <>
                {!isSignedIn ? "Sign in to RSVP" : `RSVP to ${count} event${count !== 1 ? "s" : ""}`}
                <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
                  <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
