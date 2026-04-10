/**
 * GET /api/auth/facebook/connect?churchSlug=...
 * Redirects the church admin to the Meta OAuth consent dialog.
 * Scopes: pages_manage_posts, pages_read_engagement,
 *         instagram_basic, instagram_content_publish
 */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://churchpass.events";

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const churchSlug = req.nextUrl.searchParams.get("churchSlug");
  if (!churchSlug) {
    return NextResponse.json({ error: "Missing churchSlug" }, { status: 400 });
  }

  if (!process.env.META_APP_ID) {
    // Meta not configured — redirect back with error
    return NextResponse.redirect(
      `${BASE_URL}/${churchSlug}/admin/settings/social?error=meta_not_configured`,
    );
  }

  // Encode church slug + user ID in state for CSRF protection
  const state = Buffer.from(JSON.stringify({ churchSlug, userId })).toString("base64url");
  const redirectUri = `${BASE_URL}/api/auth/facebook/callback`;

  const url = new URL("https://www.facebook.com/v21.0/dialog/oauth");
  url.searchParams.set("client_id", process.env.META_APP_ID);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set(
    "scope",
    [
      "pages_manage_posts",
      "pages_read_engagement",
      "instagram_basic",
      "instagram_content_publish",
    ].join(","),
  );

  return NextResponse.redirect(url.toString());
}
