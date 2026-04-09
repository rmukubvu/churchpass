import Stripe from "stripe";

// Server-side Stripe client — only instantiated when the env var is present
let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is not set");
  }
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2026-03-25.dahlia",
    });
  }
  return _stripe;
}

/** Platform fee rate — 2% */
export const PLATFORM_FEE_RATE = 0.02;

/** Calculate the platform application_fee_amount (in cents) */
export function platformFee(amountCents: number): number {
  return Math.round(amountCents * PLATFORM_FEE_RATE);
}
