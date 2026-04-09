/**
 * GET /api/stripe/connect?churchSlug=...
 * Starts the Stripe Connect OAuth flow. Redirects church admin to Stripe.
 * The `state` param encodes the churchSlug so we know which church to update
 * on the callback.
 */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const churchSlug = searchParams.get("churchSlug");
  if (!churchSlug) {
    return NextResponse.json({ error: "Missing churchSlug" }, { status: 400 });
  }

  const clientId = process.env.STRIPE_CONNECT_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json({ error: "Stripe Connect not configured" }, { status: 500 });
  }

  const redirectUri = `${process.env.NEXT_PUBLIC_BASE_URL}/api/stripe/connect/callback`;
  const state = Buffer.from(JSON.stringify({ churchSlug, userId })).toString("base64url");

  const url = new URL("https://connect.stripe.com/oauth/authorize");
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("scope", "read_write");
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("stripe_user[business_type]", "non_profit");

  return NextResponse.redirect(url.toString());
}
