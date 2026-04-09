"use client";

import { useState, useCallback } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";

type Tier = {
  id: string;
  name: string;
  description: string | null;
  price: number; // cents (active price, already resolved)
  earlyBirdPrice: number | null;
  earlyBirdEndsAt: Date | null;
};

type Props = {
  eventId: string;
  tiers: Tier[];
  brandColour: string;
  onSuccess: () => void;
  onClose: () => void;
  userInfo: { email: string; firstName: string; lastName: string };
};

// ─── Inner payment form (rendered inside <Elements>) ──────────────────────────

function PaymentForm({
  amount,
  brandColour,
  onSuccess,
}: {
  amount: number;
  brandColour: string;
  onSuccess: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setError(null);

    const { error: submitErr } = await elements.submit();
    if (submitErr) {
      setError(submitErr.message ?? "Payment failed");
      setLoading(false);
      return;
    }

    const result = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/my-events?payment_success=1`,
      },
      redirect: "if_required",
    });

    if (result.error) {
      setError(result.error.message ?? "Payment failed");
      setLoading(false);
    } else {
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement
        options={{
          layout: "tabs",
          fields: { billingDetails: { name: "auto" } },
        }}
      />

      {error && (
        <p className="text-sm text-red-400">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading || !stripe}
        className="w-full py-3 rounded-xl font-semibold text-white transition-opacity disabled:opacity-50"
        style={{ background: brandColour }}
      >
        {loading ? "Processing…" : `Pay £${(amount / 100).toFixed(2)}`}
      </button>
    </form>
  );
}

// ─── Main modal ───────────────────────────────────────────────────────────────

export function CheckoutModal({ eventId, tiers, brandColour, onSuccess, onClose, userInfo }: Props) {
  const [selectedTierId, setSelectedTierId] = useState<string>(tiers[0]?.id ?? "");
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [publishableKey, setPublishableKey] = useState<string | null>(null);
  const [amount, setAmount] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedTier = tiers.find((t) => t.id === selectedTierId);

  const handleProceed = useCallback(async () => {
    if (!selectedTierId) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId,
          tierId: selectedTierId,
          email: userInfo.email,
          firstName: userInfo.firstName,
          lastName: userInfo.lastName,
        }),
      });

      if (!res.ok) {
        const data = await res.json() as { error?: string };
        throw new Error(data.error ?? "Failed to create checkout");
      }

      const data = await res.json() as { clientSecret: string; publishableKey: string; amount: number };
      setClientSecret(data.clientSecret);
      setPublishableKey(data.publishableKey);
      setAmount(data.amount);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [selectedTierId, eventId, userInfo]);

  const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full sm:max-w-md bg-[#111118] border border-white/10 rounded-t-3xl sm:rounded-3xl p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Get tickets</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors text-2xl leading-none">×</button>
        </div>

        {!clientSecret ? (
          <>
            {/* Tier selector */}
            <div className="space-y-2">
              {tiers.map((tier) => {
                const now = new Date();
                const isEarlyBird = tier.earlyBirdPrice !== null && tier.earlyBirdEndsAt !== null && tier.earlyBirdEndsAt > now;
                const activePrice = isEarlyBird ? tier.earlyBirdPrice! : tier.price;

                return (
                  <button
                    key={tier.id}
                    onClick={() => setSelectedTierId(tier.id)}
                    className={`w-full text-left rounded-xl border p-3.5 transition-colors ${
                      selectedTierId === tier.id
                        ? "border-[var(--brand)] bg-[var(--brand)]/5"
                        : "border-white/8 bg-white/2 hover:bg-white/5"
                    }`}
                    style={{ "--brand": brandColour } as React.CSSProperties}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-white">{tier.name}</p>
                        {tier.description && <p className="text-xs text-white/50 mt-0.5">{tier.description}</p>}
                        {isEarlyBird && (
                          <p className="text-xs font-semibold mt-1" style={{ color: brandColour }}>
                            Early bird pricing
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-base font-bold text-white">£{(activePrice / 100).toFixed(2)}</p>
                        {isEarlyBird && (
                          <p className="text-xs text-white/40 line-through">£{(tier.price / 100).toFixed(2)}</p>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {error && <p className="text-sm text-red-400">{error}</p>}

            <button
              onClick={handleProceed}
              disabled={loading || !selectedTierId}
              className="w-full py-3 rounded-xl font-semibold text-white transition-opacity disabled:opacity-50"
              style={{ background: brandColour }}
            >
              {loading ? "Loading…" : `Continue — £${selectedTier ? ((selectedTier.earlyBirdPrice && selectedTier.earlyBirdEndsAt && selectedTier.earlyBirdEndsAt > new Date() ? selectedTier.earlyBirdPrice : selectedTier.price) / 100).toFixed(2) : "0.00"}`}
            </button>
          </>
        ) : (
          stripePromise && (
            <Elements
              stripe={stripePromise}
              options={{
                clientSecret,
                appearance: {
                  theme: "night",
                  variables: { colorPrimary: brandColour, borderRadius: "12px" },
                },
              }}
            >
              <PaymentForm amount={amount} brandColour={brandColour} onSuccess={onSuccess} />
            </Elements>
          )
        )}
      </div>
    </div>
  );
}
