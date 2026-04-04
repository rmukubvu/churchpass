"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

type Props = {
  rsvpId: string;
  eventId: string;
  initialCheckedIn: boolean;
};

type State = "idle" | "loading";

export function CheckInButton({ rsvpId, eventId, initialCheckedIn }: Props) {
  const [checkedIn, setCheckedIn] = useState(initialCheckedIn);
  const [state, setState] = useState<State>("idle");

  async function toggle() {
    setState("loading");
    const procedure = checkedIn ? "checkins.undoManual" : "checkins.manual";
    try {
      const res = await fetch(`/api/trpc/${procedure}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ json: { rsvpId, eventId } }),
      });
      if (res.ok) setCheckedIn((v) => !v);
    } finally {
      setState("idle");
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={state === "loading"}
      title={checkedIn ? "Undo check-in" : "Mark as checked in"}
      className={cn(
        "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
        state === "loading" && "opacity-50 cursor-not-allowed",
        checkedIn
          ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25"
          : "bg-white/5 text-white/40 border border-white/10 hover:text-white hover:bg-white/10"
      )}
    >
      {state === "loading" ? (
        <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : checkedIn ? (
        <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none">
          <path d="M3 8l3.5 3.5L13 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : (
        <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      )}
      {checkedIn ? "Checked in" : "Check in"}
    </button>
  );
}
