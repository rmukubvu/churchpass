/**
 * /admin/ads — Platform admin ad review queue
 * Only accessible to users with publicMetadata.role === "admin"
 */
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/server/db";
import { ads } from "@sanctuary/db";
import { desc } from "drizzle-orm";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { AdReviewTable } from "@/components/admin/AdReviewTable";
import { clerkClient } from "@clerk/nextjs/server";

export const revalidate = 0;

export default async function AdminAdsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  // Check platform admin role
  const clerk = await clerkClient();
  const user = await clerk.users.getUser(userId);
  const isSuperAdmin =
    user.publicMetadata?.role === "admin" ||
    (process.env.NEXT_PUBLIC_ADMIN_USER_IDS ?? "").split(",").map((s) => s.trim()).includes(userId);

  if (!isSuperAdmin) redirect("/");

  const allAds = await db.select().from(ads).orderBy(desc(ads.createdAt)).limit(200);

  const pending = allAds.filter((a) => a.status === "pending_review");
  const approved = allAds.filter((a) => a.status === "approved");
  const others = allAds.filter((a) => !["pending_review", "approved"].includes(a.status));

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <SiteHeader />
      <main className="max-w-6xl mx-auto px-5 pt-[88px] pb-16 space-y-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-white">Ad Review Queue</h1>
            <p className="text-sm text-white/40 mt-1">{pending.length} pending · {approved.length} live</p>
          </div>
          <a href="/advertise" target="_blank"
            className="text-xs font-semibold text-white/40 hover:text-white/70 border border-white/10 px-3 py-2 rounded-xl transition-colors">
            View /advertise page →
          </a>
        </div>

        {pending.length > 0 && (
          <section>
            <h2 className="text-sm font-bold text-amber-400 uppercase tracking-wider mb-4">
              ⏳ Pending Review ({pending.length})
            </h2>
            <AdReviewTable ads={pending} />
          </section>
        )}

        {approved.length > 0 && (
          <section>
            <h2 className="text-sm font-bold text-emerald-400 uppercase tracking-wider mb-4">
              ✓ Live ({approved.length})
            </h2>
            <AdReviewTable ads={approved} showActions={false} />
          </section>
        )}

        {others.length > 0 && (
          <section>
            <h2 className="text-sm font-bold text-white/30 uppercase tracking-wider mb-4">
              Archive ({others.length})
            </h2>
            <AdReviewTable ads={others} showActions={false} />
          </section>
        )}

        {allAds.length === 0 && (
          <div className="rounded-2xl border border-white/5 p-12 text-center text-white/30 text-sm">
            No ads submitted yet.
          </div>
        )}
      </main>
    </div>
  );
}
