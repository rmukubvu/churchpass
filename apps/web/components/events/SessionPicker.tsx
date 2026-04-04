"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import type { Event } from "@sanctuary/db";
import { cn, formatShortDate } from "@/lib/utils";

function formatSessionTime(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(date));
}

type Props = {
  sessions: Event[];
  churchSlug: string;
  churchName: string;
  brandColour: string;
};

export function SessionPicker({ sessions, churchSlug, churchName, brandColour }: Props) {
  const { isSignedIn } = useAuth();
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleRsvp() {
    if (!isSignedIn) {
      router.push(`/sign-in?redirect_url=/${churchSlug}`);
      return;
    }
    if (selected.size === 0) return;

    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/trpc/rsvps.createBatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          json: { eventIds: Array.from(selected), churchSlug, churchName },
        }),
      });
      if (!res.ok) throw new Error("Failed");
      setDone(true);
      setSelected(new Set());
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-2xl bg-emerald-950/40 border border-emerald-500/30 p-6 text-center space-y-2">
        <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mx-auto">
          <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="text-emerald-400 font-bold text-base">You're registered!</p>
        <p className="text-white/50 text-sm">Check your email for QR tickets.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-[10px] text-white/30 uppercase tracking-wider mb-3">Select your sessions</p>
        <div className="space-y-2 max-h-72 overflow-y-auto pr-1 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
          {sessions.map((session) => {
            const isSelected = selected.has(session.id);
            const dateLabel = formatShortDate(session.startsAt);
            const timeLabel = formatSessionTime(session.startsAt);
            const endTimeLabel = formatSessionTime(session.endsAt);

            return (
              <button
                key={session.id}
                type="button"
                onClick={() => toggle(session.id)}
                className={cn(
                  "w-full text-left rounded-xl border p-3 transition-all duration-150",
                  isSelected
                    ? "border-indigo-500 bg-indigo-600/15 ring-1 ring-indigo-500/40"
                    : "border-white/8 bg-white/3 hover:border-indigo-500/40 hover:bg-white/5"
                )}
              >
                <div className="flex items-center gap-3">
                  {/* Checkbox */}
                  <div
                    className={cn(
                      "w-5 h-5 rounded-md border-2 flex items-center justify-center flex-none transition-colors",
                      isSelected ? "bg-indigo-600 border-indigo-500" : "border-white/25 bg-black/30"
                    )}
                  >
                    {isSelected && (
                      <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>

                  {/* Session info */}
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-sm font-semibold leading-snug", isSelected ? "text-indigo-200" : "text-white")}>
                      {session.title}
                    </p>
                    <p className="text-[11px] text-white/40 mt-0.5">
                      {dateLabel} · {timeLabel} – {endTimeLabel}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {error && <p className="text-red-400 text-xs">{error}</p>}

      <button
        type="button"
        onClick={handleRsvp}
        disabled={loading || selected.size === 0}
        className={cn(
          "w-full py-3 rounded-xl text-sm font-bold transition-all duration-200",
          selected.size > 0 && !loading
            ? "text-white shadow-lg shadow-indigo-900/40 hover:opacity-90 active:scale-[0.98]"
            : "bg-white/5 text-white/25 cursor-not-allowed"
        )}
        style={
          selected.size > 0 && !loading
            ? { backgroundColor: brandColour }
            : undefined
        }
      >
        {loading
          ? "Registering…"
          : selected.size === 0
          ? "Select at least one session"
          : `RSVP to ${selected.size} session${selected.size > 1 ? "s" : ""}`}
      </button>

      {!isSignedIn && (
        <p className="text-[10px] text-white/20 text-center">
          You&apos;ll be asked to sign in before completing your RSVP.
        </p>
      )}
    </div>
  );
}
