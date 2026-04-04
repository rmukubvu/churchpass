"use client";

import { useState } from "react";
import { useAuth, SignInButton } from "@clerk/nextjs";

type RsvpButtonProps = {
  eventId: string;
  brandColour?: string;
};

export function RsvpButton({ eventId, brandColour = "#4F46E5" }: RsvpButtonProps) {
  const { isSignedIn } = useAuth();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleRsvp() {
    setLoading(true);
    try {
      const res = await fetch("/api/trpc/rsvps.create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ json: { eventId } }),
      });
      if (res.ok) setDone(true);
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="w-full rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-center py-4 font-bold text-base">
        ✓ You&apos;re registered!
      </div>
    );
  }

  const style = {
    backgroundColor: brandColour,
    "--hover-bg": brandColour + "cc",
  } as React.CSSProperties;

  if (!isSignedIn) {
    return (
      <SignInButton mode="modal">
        <button
          className="w-full rounded-xl text-white font-bold py-4 text-base transition-opacity hover:opacity-90"
          style={style}
        >
          RSVP — Sign in to register
        </button>
      </SignInButton>
    );
  }

  return (
    <button
      onClick={handleRsvp}
      disabled={loading}
      className="w-full rounded-xl text-white font-bold py-4 text-base transition-opacity hover:opacity-90 disabled:opacity-50"
      style={style}
    >
      {loading ? "Registering…" : "RSVP Now — It's free"}
    </button>
  );
}
