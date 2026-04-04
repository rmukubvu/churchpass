"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

type Props = {
  rsvpId: string;
  eventId: string;
  attendeeName: string;
  brandColour: string;
};

type State = "idle" | "loading" | "done" | "error";

export function CheckInConfirmButton({ rsvpId, eventId, attendeeName, brandColour }: Props) {
  const [state, setState] = useState<State>("idle");
  const [checkedInAt, setCheckedInAt] = useState<string>("");

  async function handleCheckIn() {
    setState("loading");
    try {
      const res = await fetch("/api/trpc/checkins.manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ json: { rsvpId, eventId } }),
      });

      if (!res.ok) throw new Error("Check-in failed");

      setCheckedInAt(
        new Intl.DateTimeFormat("en-US", {
          hour: "numeric",
          minute: "2-digit",
        }).format(new Date())
      );
      setState("done");
    } catch {
      setState("error");
      setTimeout(() => setState("idle"), 3000);
    }
  }

  if (state === "done") {
    return (
      <div className="flex flex-col items-center gap-2 py-4">
        <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
          <svg className="w-8 h-8 text-emerald-400" viewBox="0 0 24 24" fill="none">
            <path
              d="M5 13l4 4L19 7"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <p className="text-base font-bold text-emerald-400">Checked in!</p>
        <p className="text-xs text-white/40">
          {attendeeName} · {checkedInAt}
        </p>
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="flex flex-col items-center gap-2 py-3">
        <p className="text-sm font-semibold text-red-400">Check-in failed — try again</p>
      </div>
    );
  }

  return (
    <button
      onClick={handleCheckIn}
      disabled={state === "loading"}
      className={cn(
        "w-full py-3.5 rounded-2xl text-white font-bold text-base transition-all",
        state === "loading" ? "opacity-60 cursor-not-allowed" : "hover:opacity-90 active:scale-[0.98]"
      )}
      style={{ backgroundColor: brandColour }}
    >
      {state === "loading" ? (
        <span className="flex items-center justify-center gap-2">
          <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Checking in…
        </span>
      ) : (
        "✓  Check in now"
      )}
    </button>
  );
}
