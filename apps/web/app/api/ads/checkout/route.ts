/**
 * POST /api/ads/checkout
 * Creates a Stripe Checkout Session for an ad slot purchase.
 * Also inserts the ad record in pending_payment status.
 * Returns { url } — redirect the browser to this Stripe-hosted page.
 */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/server/db";
import { ads, AD_PRICES } from "@sanctuary/db";
import { eq } from "drizzle-orm";
import { getStripe } from "@/lib/stripe";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://churchpass.events";

export async function POST(req: NextRequest) {
  const { userId } = await auth();

  const body = await req.json() as {
    advertiserName: string;
    advertiserEmail: string;
    imageUrl: string;
    headline: string;
    subheadline?: string;
    ctaText?: string;
    clickUrl: string;
    duration: "one_week" | "two_weeks" | "four_weeks";
  };

  const { advertiserName, advertiserEmail, imageUrl, headline, subheadline, ctaText, clickUrl, duration } = body;

  if (!advertiserName || !advertiserEmail || !imageUrl || !headline || !clickUrl || !duration) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const amount = AD_PRICES[duration];
  if (!amount) return NextResponse.json({ error: "Invalid duration" }, { status: 400 });

  // Insert ad in pending_payment state
  const [ad] = await db.insert(ads).values({
    advertiserName,
    advertiserEmail,
    clerkUserId: userId ?? null,
    imageUrl,
    headline,
    subheadline: subheadline ?? null,
    ctaText: ctaText ?? "Learn More",
    clickUrl,
    duration,
    amountPaid: amount,
    status: "pending_payment",
  }).returning();

  if (!ad) return NextResponse.json({ error: "Failed to create ad" }, { status: 500 });

  const stripe = getStripe();

  const durationLabel = duration === "one_week" ? "1 week" : duration === "two_weeks" ? "2 weeks" : "4 weeks";

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    customer_email: advertiserEmail,
    line_items: [
      {
        price_data: {
          currency: "gbp",
          unit_amount: amount,
          product_data: {
            name: `ChurchPass Ad Slot — ${durationLabel}`,
            description: `"${headline}" · Shown to thousands of church event attendees`,
            images: ["https://churchpass.events/file.svg"],
          },
        },
        quantity: 1,
      },
    ],
    metadata: { adId: ad.id },
    success_url: `${BASE_URL}/advertise/success?adId=${ad.id}`,
    cancel_url: `${BASE_URL}/advertise?cancelled=1`,
  });

  // Save session ID
  await db.update(ads).set({ stripeSessionId: session.id }).where(eq(ads.id, ad.id));

  return NextResponse.json({ url: session.url });
}
