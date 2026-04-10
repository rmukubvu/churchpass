import { redirect } from "next/navigation";
import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/server/db";
import { serviceProviders, PROVIDER_CATEGORY_LABELS } from "@sanctuary/db";
import { desc } from "drizzle-orm";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { ProviderAdminTable } from "@/components/admin/ProviderAdminTable";

const ADMIN_IDS = (process.env.NEXT_PUBLIC_ADMIN_USER_IDS ?? "").split(",").filter(Boolean);

export default async function AdminProvidersPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await currentUser();
  const isAdmin =
    (user?.publicMetadata as { role?: string })?.role === "admin" ||
    ADMIN_IDS.includes(userId);
  if (!isAdmin) redirect("/");

  const allProviders = await db
    .select()
    .from(serviceProviders)
    .orderBy(desc(serviceProviders.createdAt));

  const pending   = allProviders.filter((p) => p.status === "pending");
  const active    = allProviders.filter((p) => p.status === "active");
  const suspended = allProviders.filter((p) => p.status === "suspended");

  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-[#0f0f0f] pt-[88px] pb-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">

          <div className="py-8 border-b border-white/5 mb-8">
            <h1 className="text-2xl font-bold text-white">Service Providers</h1>
            <p className="text-white/40 text-sm mt-1">
              Manage business listings — verify, suspend, or activate providers.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="rounded-2xl border border-amber-500/10 bg-amber-500/5 p-5 text-center">
              <p className="text-2xl font-bold text-amber-400">{pending.length}</p>
              <p className="text-xs text-white/30 mt-1">Pending</p>
            </div>
            <div className="rounded-2xl border border-green-500/10 bg-green-500/5 p-5 text-center">
              <p className="text-2xl font-bold text-green-400">{active.length}</p>
              <p className="text-xs text-white/30 mt-1">Active</p>
            </div>
            <div className="rounded-2xl border border-white/5 bg-[#1a1a1a] p-5 text-center">
              <p className="text-2xl font-bold text-white/40">{suspended.length}</p>
              <p className="text-xs text-white/30 mt-1">Suspended</p>
            </div>
          </div>

          {/* Tables */}
          {pending.length > 0 && (
            <section className="mb-10">
              <h2 className="text-sm font-bold text-amber-400 uppercase tracking-widest mb-4">
                ⏳ Pending ({pending.length})
              </h2>
              <ProviderAdminTable providers={pending} categoryLabels={PROVIDER_CATEGORY_LABELS} />
            </section>
          )}

          <section className="mb-10">
            <h2 className="text-sm font-bold text-green-400 uppercase tracking-widest mb-4">
              ✅ Active ({active.length})
            </h2>
            {active.length > 0 ? (
              <ProviderAdminTable providers={active} categoryLabels={PROVIDER_CATEGORY_LABELS} />
            ) : (
              <p className="text-white/20 text-sm">No active providers yet.</p>
            )}
          </section>

          {suspended.length > 0 && (
            <section>
              <h2 className="text-sm font-bold text-white/30 uppercase tracking-widest mb-4">
                🚫 Suspended ({suspended.length})
              </h2>
              <ProviderAdminTable providers={suspended} categoryLabels={PROVIDER_CATEGORY_LABELS} />
            </section>
          )}

        </div>
      </main>
    </>
  );
}
