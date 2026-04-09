/**
 * GET /api/stripe/connect/callback?code=...&state=...
 * Stripe OAuth callback. Exchanges the code for a connected account ID
 * and persists it to the church record.
 */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { churches } from "@sanctuary/db";
import { eq } from "drizzle-orm";
import { getStripe } from "@/lib/stripe";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_BASE_URL}/admin?stripe_error=${encodeURIComponent(error)}`
    );
  }

  if (!code || !state) {
    return NextResponse.json({ error: "Missing code or state" }, { status: 400 });
  }

  let churchSlug: string;
  try {
    const decoded = JSON.parse(Buffer.from(state, "base64url").toString("utf8")) as { churchSlug: string };
    churchSlug = decoded.churchSlug;
  } catch {
    return NextResponse.json({ error: "Invalid state" }, { status: 400 });
  }

  try {
    const stripe = getStripe();
    const response = await stripe.oauth.token({
      grant_type: "authorization_code",
      code,
    });

    const stripeAccountId = response.stripe_user_id;
    if (!stripeAccountId) {
      throw new Error("No stripe_user_id in response");
    }

    await db
      .update(churches)
      .set({ stripeAccountId, stripeConnectStatus: "active" })
      .where(eq(churches.slug, churchSlug));

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_BASE_URL}/${churchSlug}/admin/stripe?connected=1`
    );
  } catch (err) {
    console.error("Stripe Connect callback error:", err);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_BASE_URL}/${churchSlug}/admin/stripe?stripe_error=callback_failed`
    );
  }
}
