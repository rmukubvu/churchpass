/**
 * GET /api/auth/facebook/callback?code=...&state=...
 *
 * OAuth callback from Meta. Steps:
 * 1. Decode state → churchSlug + userId
 * 2. Exchange code for short-lived user token
 * 3. Exchange for long-lived user token (60 days)
 * 4. Fetch /me/accounts → pick first Page, get Page access token + name
 * 5. Fetch /{pageId}?fields=instagram_business_account → get IG account id
 * 6. Write all tokens to churches table
 * 7. Redirect to /{slug}/admin/settings/social?connected=1
 */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/server/db";
import { churches } from "@sanctuary/db";
import { eq } from "drizzle-orm";
import {
  exchangeCodeForToken,
  getLongLivedToken,
  getUserPages,
  getInstagramAccount,
} from "@/lib/meta";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://churchpass.events";

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  const code = req.nextUrl.searchParams.get("code");
  const stateRaw = req.nextUrl.searchParams.get("state");
  const errorParam = req.nextUrl.searchParams.get("error");

  // User denied permission
  if (errorParam) {
    return NextResponse.redirect(`${BASE_URL}/admin?error=facebook_denied`);
  }

  if (!code || !stateRaw) {
    return NextResponse.redirect(`${BASE_URL}/admin?error=facebook_invalid`);
  }

  let churchSlug = "";
  try {
    const state = JSON.parse(Buffer.from(stateRaw, "base64url").toString()) as {
      churchSlug: string;
      userId: string;
    };
    // Verify the state matches the logged-in user
    if (userId && state.userId !== userId) {
      return NextResponse.redirect(`${BASE_URL}/admin?error=facebook_mismatch`);
    }
    churchSlug = state.churchSlug;
  } catch {
    return NextResponse.redirect(`${BASE_URL}/admin?error=facebook_state`);
  }

  const redirectUri = `${BASE_URL}/api/auth/facebook/callback`;

  try {
    // 1. Short-lived token
    const { access_token: shortToken } = await exchangeCodeForToken(code, redirectUri);

    // 2. Long-lived user token
    const { access_token: longToken, expires_in } = await getLongLivedToken(shortToken);
    const tokenExpiresAt = new Date(Date.now() + expires_in * 1000);

    // 3. Get pages
    const pages = await getUserPages(longToken);
    if (pages.length === 0) {
      return NextResponse.redirect(
        `${BASE_URL}/${churchSlug}/admin/settings/social?error=no_pages`,
      );
    }
    const page = pages[0]!;

    // 4. Get IG account (may be null)
    const igAccountId = await getInstagramAccount(page.id, page.access_token);

    // 5. Write to DB
    const [church] = await db
      .select({ id: churches.id })
      .from(churches)
      .where(eq(churches.slug, churchSlug))
      .limit(1);

    if (!church) {
      return NextResponse.redirect(`${BASE_URL}/admin?error=church_not_found`);
    }

    await db
      .update(churches)
      .set({
        fbPageId: page.id,
        fbPageName: page.name,
        fbPageAccessToken: page.access_token,
        fbUserAccessToken: longToken,
        fbTokenExpiresAt: tokenExpiresAt,
        igAccountId: igAccountId ?? null,
        // Enable auto-posting by default once connected
        autoPostFacebook: true,
        autoPostInstagram: igAccountId ? true : false,
      })
      .where(eq(churches.id, church.id));

    return NextResponse.redirect(
      `${BASE_URL}/${churchSlug}/admin/settings/social?connected=1`,
    );
  } catch (err) {
    console.error("[facebook/callback]", err);
    return NextResponse.redirect(
      `${BASE_URL}/${churchSlug}/admin/settings/social?error=facebook_failed`,
    );
  }
}
