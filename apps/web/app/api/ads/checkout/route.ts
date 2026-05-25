/**
 * POST /api/ads/checkout
 * Creates a Stripe Checkout Session for an ad slot purchase.
 * Also inserts the ad record in pending_payment status.
 * Returns { url } — redirect the browser to this Stripe-hosted page.
 */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/server/db";
import { ads } from "@sanctuary/db";
import { eq } from "drizzle-orm";
import { getStripe } from "@/lib/stripe";
import { getAdMarket, getAdPrice, type AdDuration } from "@/lib/ad-markets";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://churchpass.events";

export async function POST(req: NextRequest) {
  const { userId } = await auth();

  const body = (await req.json()) as {
    advertiserName: string;
    advertiserEmail: string;
    countryCode: string;
    imageUrl: string;
    headline: string;
    subheadline?: string;
    ctaText?: string;
    clickUrl: string;
    duration: AdDuration;
  };

  const {
    advertiserName,
    advertiserEmail,
    countryCode,
    imageUrl,
    headline,
    subheadline,
    ctaText,
    clickUrl,
    duration,
  } = body;

  if (
    !advertiserName ||
    !advertiserEmail ||
    !countryCode ||
    !imageUrl ||
    !headline ||
    !clickUrl ||
    !duration
  ) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const market = getAdMarket(countryCode);
  if (!market) {
    return NextResponse.json({ error: "Invalid country" }, { status: 400 });
  }

  const amount = getAdPrice(countryCode, duration);
  if (!amount) {
    return NextResponse.json({ error: "Invalid duration" }, { status: 400 });
  }

  if (!imageUrl.startsWith("http://") && !imageUrl.startsWith("https://")) {
    return NextResponse.json({ error: "Invalid image URL" }, { status: 400 });
  }

  const [ad] = await db
    .insert(ads)
    .values({
      advertiserName,
      advertiserEmail,
      countryCode: market.countryCode,
      currency: market.currency,
      clerkUserId: userId ?? null,
      imageUrl,
      headline,
      subheadline: subheadline ?? null,
      ctaText: ctaText ?? "Learn More",
      clickUrl,
      duration,
      amountPaid: amount,
      status: "pending_payment",
    })
    .returning();

  if (!ad) return NextResponse.json({ error: "Failed to create ad" }, { status: 500 });

  const stripe = getStripe();

  const durationLabel =
    duration === "one_week" ? "1 week" : duration === "two_weeks" ? "2 weeks" : "4 weeks";

  const productData: {
    name: string;
    description: string;
    images?: string[];
  } = {
    name: `ChurchPass Ad Slot — ${durationLabel}`,
    description: `"${headline}" · ${market.label} · Homepage featured slider`,
  };
  if (imageUrl.startsWith("https://")) {
    productData.images = [imageUrl];
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    customer_email: advertiserEmail,
    line_items: [
      {
        price_data: {
          currency: market.currency,
          unit_amount: amount,
          product_data: productData,
        },
        quantity: 1,
      },
    ],
    metadata: { adId: ad.id, countryCode: market.countryCode },
    success_url: `${BASE_URL}/advertise/success?adId=${ad.id}`,
    cancel_url: `${BASE_URL}/advertise?cancelled=1`,
  });

  await db.update(ads).set({ stripeSessionId: session.id }).where(eq(ads.id, ad.id));

  return NextResponse.json({ url: session.url });
}
