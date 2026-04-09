/**
 * POST /api/stripe/checkout
 * Creates a Stripe PaymentIntent for a paid event.
 * Returns { clientSecret, publishableKey } for Stripe Elements.
 *
 * Body: { eventId, tierId, clerkUserId, email, firstName, lastName }
 */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/server/db";
import { events, churches, ticketTiers } from "@sanctuary/db";
import { eq } from "drizzle-orm";
import { getStripe, platformFee } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json() as {
    eventId: string;
    tierId: string;
    email: string;
    firstName: string;
    lastName: string;
  };

  const { eventId, tierId, email, firstName, lastName } = body;
  if (!eventId || !tierId || !email) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Load tier + event + church in parallel
  const [[tier], [event]] = await Promise.all([
    db.select().from(ticketTiers).where(eq(ticketTiers.id, tierId)).limit(1),
    db.select({ churchId: events.churchId, title: events.title }).from(events).where(eq(events.id, eventId)).limit(1),
  ]);

  if (!tier || !event) {
    return NextResponse.json({ error: "Event or tier not found" }, { status: 404 });
  }

  const [church] = await db
    .select({ stripeAccountId: churches.stripeAccountId })
    .from(churches)
    .where(eq(churches.id, event.churchId))
    .limit(1);

  if (!church?.stripeAccountId) {
    return NextResponse.json({ error: "Church is not connected to Stripe" }, { status: 400 });
  }

  // Determine active price (respects early bird)
  const now = new Date();
  const isEarlyBird =
    tier.earlyBirdPrice !== null &&
    tier.earlyBirdEndsAt !== null &&
    tier.earlyBirdEndsAt > now;
  const amount = isEarlyBird ? tier.earlyBirdPrice! : tier.price;

  if (amount <= 0) {
    return NextResponse.json({ error: "Use the free RSVP flow for free tickets" }, { status: 400 });
  }

  const stripe = getStripe();
  const pi = await stripe.paymentIntents.create({
    amount,
    currency: "gbp",
    application_fee_amount: platformFee(amount),
    transfer_data: { destination: church.stripeAccountId },
    metadata: { eventId, tierId, clerkUserId: userId, email, firstName, lastName },
    receipt_email: email,
    description: `Ticket: ${event.title} — ${tier.name}`,
  });

  return NextResponse.json({
    clientSecret: pi.client_secret,
    publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    amount,
  });
}
