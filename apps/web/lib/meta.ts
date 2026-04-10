/**
 * Meta Graph API helpers — Facebook Page posts + Instagram feed posts.
 * Used for social auto-posting when a church publishes an event.
 *
 * Requires env vars (set after creating a Meta Developer App):
 *   META_APP_ID
 *   META_APP_SECRET
 */

const GRAPH = "https://graph.facebook.com/v21.0";

export type MetaPostResult = { id: string };

// ─── Post to Facebook Page ────────────────────────────────────────────────────

/**
 * Creates a plain feed post on the church's Facebook Page.
 * Uses feed posts (not Graph API Events) — simpler, no special app review needed.
 */
export async function postToFacebook(
  pageId: string,
  pageToken: string,
  event: {
    title: string;
    description?: string | null;
    location?: string | null;
    startsAt: Date;
    bannerUrl?: string | null;
  },
  churchSlug: string,
): Promise<MetaPostResult> {
  const eventUrl = `${process.env.NEXT_PUBLIC_BASE_URL ?? "https://churchpass.events"}/${churchSlug}`;
  const message = buildPostMessage(event, eventUrl);

  const body: Record<string, string> = {
    message,
    access_token: pageToken,
  };
  // Attach link for OG preview if banner exists
  if (event.bannerUrl) body.link = eventUrl;

  const res = await fetch(`${GRAPH}/${pageId}/feed`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json() as { error?: { message?: string } };
    throw new Error(`Facebook post failed: ${err?.error?.message ?? res.statusText}`);
  }

  return res.json() as Promise<MetaPostResult>;
}

// ─── Post to Instagram ────────────────────────────────────────────────────────

/**
 * Creates an Instagram feed post via the Content Publishing API.
 * Two-step: create media container → publish.
 * Requires event.bannerUrl (Instagram always needs an image).
 */
export async function postToInstagram(
  igAccountId: string,
  pageToken: string,
  event: {
    title: string;
    description?: string | null;
    location?: string | null;
    startsAt: Date;
    bannerUrl?: string | null;
  },
  churchSlug: string,
): Promise<MetaPostResult> {
  if (!event.bannerUrl) {
    throw new Error("Instagram post requires a banner image — add one to this event.");
  }

  const eventUrl = `${process.env.NEXT_PUBLIC_BASE_URL ?? "https://churchpass.events"}/${churchSlug}`;
  const caption = buildPostMessage(event, eventUrl);

  // Step 1 — create media container
  const containerRes = await fetch(`${GRAPH}/${igAccountId}/media`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      image_url: event.bannerUrl,
      caption,
      access_token: pageToken,
    }),
  });

  if (!containerRes.ok) {
    const err = await containerRes.json() as { error?: { message?: string } };
    throw new Error(`Instagram container failed: ${err?.error?.message ?? containerRes.statusText}`);
  }

  const { id: creationId } = await containerRes.json() as { id: string };

  // Step 2 — publish
  const publishRes = await fetch(`${GRAPH}/${igAccountId}/media_publish`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ creation_id: creationId, access_token: pageToken }),
  });

  if (!publishRes.ok) {
    const err = await publishRes.json() as { error?: { message?: string } };
    throw new Error(`Instagram publish failed: ${err?.error?.message ?? publishRes.statusText}`);
  }

  return publishRes.json() as Promise<MetaPostResult>;
}

// ─── OAuth helpers ────────────────────────────────────────────────────────────

/**
 * Exchange a short-lived user code for a long-lived user access token (60 days).
 */
export async function exchangeCodeForToken(
  code: string,
  redirectUri: string,
): Promise<{ access_token: string; expires_in?: number }> {
  const url = new URL(`${GRAPH}/oauth/access_token`);
  url.searchParams.set("client_id", process.env.META_APP_ID!);
  url.searchParams.set("client_secret", process.env.META_APP_SECRET!);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("code", code);

  const res = await fetch(url.toString());
  if (!res.ok) {
    const err = await res.json() as { error?: { message?: string } };
    throw new Error(`Token exchange failed: ${err?.error?.message ?? res.statusText}`);
  }
  return res.json() as Promise<{ access_token: string; expires_in?: number }>;
}

/**
 * Exchange a short-lived token for a long-lived token (60 days).
 */
export async function getLongLivedToken(
  shortLivedToken: string,
): Promise<{ access_token: string; expires_in: number }> {
  const url = new URL(`${GRAPH}/oauth/access_token`);
  url.searchParams.set("grant_type", "fb_exchange_token");
  url.searchParams.set("client_id", process.env.META_APP_ID!);
  url.searchParams.set("client_secret", process.env.META_APP_SECRET!);
  url.searchParams.set("fb_exchange_token", shortLivedToken);

  const res = await fetch(url.toString());
  if (!res.ok) {
    const err = await res.json() as { error?: { message?: string } };
    throw new Error(`Long-lived token exchange failed: ${err?.error?.message ?? res.statusText}`);
  }
  return res.json() as Promise<{ access_token: string; expires_in: number }>;
}

/**
 * Get the Facebook Pages managed by the user.
 * Returns the first page's id, name, and access_token.
 */
export async function getUserPages(
  userToken: string,
): Promise<Array<{ id: string; name: string; access_token: string }>> {
  const res = await fetch(
    `${GRAPH}/me/accounts?access_token=${userToken}&fields=id,name,access_token`,
  );
  if (!res.ok) throw new Error("Failed to fetch pages");
  const data = await res.json() as { data: Array<{ id: string; name: string; access_token: string }> };
  return data.data ?? [];
}

/**
 * Get the Instagram Business Account ID linked to a Facebook Page.
 * Returns null if the page has no linked IG account.
 */
export async function getInstagramAccount(
  pageId: string,
  pageToken: string,
): Promise<string | null> {
  const res = await fetch(
    `${GRAPH}/${pageId}?fields=instagram_business_account&access_token=${pageToken}`,
  );
  if (!res.ok) return null;
  const data = await res.json() as { instagram_business_account?: { id: string } };
  return data.instagram_business_account?.id ?? null;
}

// ─── Shared ───────────────────────────────────────────────────────────────────

function buildPostMessage(
  event: {
    title: string;
    description?: string | null;
    location?: string | null;
    startsAt: Date;
  },
  url: string,
): string {
  const date = event.startsAt.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const lines: (string | null)[] = [
    `📣 ${event.title}`,
    `📅 ${date}`,
    event.location ? `📍 ${event.location}` : null,
    event.description
      ? `\n${event.description.slice(0, 200)}${event.description.length > 200 ? "…" : ""}`
      : null,
    `\n🎟 RSVP & details: ${url}`,
    `\n#ChurchEvent #ChurchPass`,
  ];

  return lines.filter(Boolean).join("\n");
}
