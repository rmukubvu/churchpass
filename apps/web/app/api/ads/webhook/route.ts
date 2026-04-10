/**
 * POST /api/ads/webhook
 * Stripe webhook for ad payments.
 * checkout.session.completed → move ad to pending_review
 */
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { db } from "@/server/db";
import { ads } from "@sanctuary/db";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = (await headers()).get("stripe-signature");
  const secret = process.env.STRIPE_ADS_WEBHOOK_SECRET;

  if (!sig || !secret) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, sig, secret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const adId = session.metadata?.adId;
    if (!adId) return NextResponse.json({ received: true });

    await db
      .update(ads)
      .set({
        status: "pending_review",
        stripeSessionId: session.id,
        stripePaymentIntentId: typeof session.payment_intent === "string" ? session.payment_intent : null,
      })
      .where(eq(ads.id, adId));
  }

  return NextResponse.json({ received: true });
}
