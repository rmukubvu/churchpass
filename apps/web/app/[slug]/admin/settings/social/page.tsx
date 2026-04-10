import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/server/db";
import { churches } from "@sanctuary/db";
import { eq } from "drizzle-orm";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SocialSettingsPanel } from "@/components/admin/SocialSettingsPanel";

export default async function SocialSettingsPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ connected?: string; error?: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const { slug } = await params;
  const { connected, error } = await searchParams;

  const [church] = await db
    .select({
      id: churches.id,
      name: churches.name,
      fbPageId: churches.fbPageId,
      fbPageName: churches.fbPageName,
      igAccountId: churches.igAccountId,
      autoPostFacebook: churches.autoPostFacebook,
      autoPostInstagram: churches.autoPostInstagram,
      fbTokenExpiresAt: churches.fbTokenExpiresAt,
    })
    .from(churches)
    .where(eq(churches.slug, slug))
    .limit(1);

  if (!church) redirect("/");

  const tokenExpiringSoon = church.fbTokenExpiresAt
    ? church.fbTokenExpiresAt.getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000
    : false;

  const daysUntilExpiry = church.fbTokenExpiresAt
    ? Math.max(0, Math.round((church.fbTokenExpiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-[#0f0f0f] pt-[88px] pb-16">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">

          <div className="py-8 border-b border-white/5 mb-8">
            <div className="flex items-center gap-2 text-white/30 text-sm mb-4">
              <a href={`/${slug}/admin`} className="hover:text-white/60 transition-colors">Dashboard</a>
              <span>›</span>
              <span className="text-white/50">Social Media</span>
            </div>
            <h1 className="text-2xl font-bold text-white">Social Media</h1>
            <p className="text-white/40 text-sm mt-1">
              Connect your Facebook Page and Instagram account to auto-post events when you publish them.
            </p>
          </div>

          {/* Success banner */}
          {connected === "1" && (
            <div className="mb-6 rounded-xl border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm text-green-400 flex items-center gap-2">
              ✅ Facebook{church.igAccountId ? " and Instagram" : ""} connected successfully!
            </div>
          )}

          {/* Error banners */}
          {error === "no_pages" && (
            <div className="mb-6 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-400">
              ⚠️ No Facebook Pages found on that account. Make sure you manage a Facebook Page and try again.
            </div>
          )}
          {error === "facebook_failed" && (
            <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              ❌ Something went wrong connecting to Facebook. Please try again.
            </div>
          )}
          {error === "meta_not_configured" && (
            <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              ❌ Meta integration is not configured on this server. Add META_APP_ID and META_APP_SECRET env vars.
            </div>
          )}

          {/* Token expiry warning */}
          {church.fbPageId && tokenExpiringSoon && (
            <div className="mb-6 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-400">
              ⚠️ Your Facebook connection expires in {daysUntilExpiry} day{daysUntilExpiry !== 1 ? "s" : ""}.
              Reconnect below to keep auto-posting working.
            </div>
          )}

          <SocialSettingsPanel
            slug={slug}
            fbConnected={!!church.fbPageId}
            fbPageName={church.fbPageName ?? null}
            igConnected={!!church.igAccountId}
            autoPostFacebook={church.autoPostFacebook}
            autoPostInstagram={church.autoPostInstagram}
            tokenExpiresAt={church.fbTokenExpiresAt?.toISOString() ?? null}
          />

        </div>
      </main>
    </>
  );
}
