"use client";

import { useState } from "react";
import { useAuth, useUser, SignInButton } from "@clerk/nextjs";
import { trpc } from "@/lib/trpc-client";
import { CheckoutModal } from "@/components/checkout/CheckoutModal";

type Tier = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  earlyBirdPrice: number | null;
  earlyBirdEndsAt: Date | null;
};

type RsvpButtonProps = {
  eventId: string;
  brandColour?: string;
  /** Paid ticket tiers — when provided and non-empty, triggers checkout flow */
  tiers?: Tier[];
};

export function RsvpButton({ eventId, brandColour = "#4F46E5", tiers = [] }: RsvpButtonProps) {
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);

  const isPaid = tiers.length > 0;

  async function handleFreeRsvp() {
    setLoading(true);
    try {
      await trpc.rsvps.create.mutate({ eventId });
      setDone(true);
    } catch {
      // TODO: surface error to user
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
  } as React.CSSProperties;

  if (!isSignedIn) {
    return (
      <SignInButton mode="modal">
        <button
          className="w-full rounded-xl text-white font-bold py-4 text-base transition-opacity hover:opacity-90"
          style={style}
        >
          {isPaid ? "Get Tickets — Sign in first" : "RSVP — Sign in to register"}
        </button>
      </SignInButton>
    );
  }

  if (isPaid) {
    const email = user?.primaryEmailAddress?.emailAddress ?? "";
    const firstName = user?.firstName ?? "";
    const lastName = user?.lastName ?? "";

    return (
      <>
        <button
          onClick={() => setShowCheckout(true)}
          className="w-full rounded-xl text-white font-bold py-4 text-base transition-opacity hover:opacity-90"
          style={style}
        >
          Get Tickets
        </button>

        {showCheckout && (
          <CheckoutModal
            eventId={eventId}
            tiers={tiers}
            brandColour={brandColour}
            userInfo={{ email, firstName, lastName }}
            onSuccess={() => { setShowCheckout(false); setDone(true); }}
            onClose={() => setShowCheckout(false)}
          />
        )}
      </>
    );
  }

  return (
    <button
      onClick={handleFreeRsvp}
      disabled={loading}
      className="w-full rounded-xl text-white font-bold py-4 text-base transition-opacity hover:opacity-90 disabled:opacity-50"
      style={style}
    >
      {loading ? "Registering…" : "RSVP Now — It's free"}
    </button>
  );
}
