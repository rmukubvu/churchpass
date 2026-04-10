import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/server/db";
import { serviceProviders, providerInquiries, PROVIDER_CATEGORY_LABELS } from "@sanctuary/db";
import { eq, desc, count } from "drizzle-orm";
import Link from "next/link";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { InquiryTable } from "@/components/providers/InquiryTable";

export default async function ProviderDashboardPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in?redirect_url=/providers");

  const { slug } = await params;

  const [provider] = await db
    .select()
    .from(serviceProviders)
    .where(eq(serviceProviders.slug, slug))
    .limit(1);

  if (!provider || provider.clerkUserId !== userId) redirect("/");

  const inquiries = await db
    .select()
    .from(providerInquiries)
    .where(eq(providerInquiries.providerId, provider.id))
    .orderBy(desc(providerInquiries.createdAt));

  const unreadCount = inquiries.filter((i) => i.status === "sent").length;
  const repliedCount = inquiries.filter((i) => i.status === "replied").length;

  const categoryLabel = PROVIDER_CATEGORY_LABELS[provider.category] ?? provider.category;
  const priceLabel = provider.priceFrom
    ? `From £${Math.round(provider.priceFrom / 100)}`
    : null;

  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-[#0f0f0f] pt-[88px] pb-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">

          {/* Header */}
          <div className="py-8 border-b border-white/5 mb-8 flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold text-white">{provider.businessName}</h1>
                {provider.isVerified && (
                  <span className="text-xs font-bold bg-indigo-600 text-white px-2 py-0.5 rounded-full">
                    ✓ Verified
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 mt-1 text-xs text-white/40">
                <span>{categoryLabel}</span>
                <span>·</span>
                <span>📍 {provider.city}</span>
                {priceLabel && <><span>·</span><span className="text-indigo-400">{priceLabel}</span></>}
              </div>
            </div>
            <div className="flex gap-2">
              <Link
                href={`/services/${provider.slug}`}
                className="px-4 py-2 rounded-xl border border-white/10 text-white/60 text-sm font-semibold hover:bg-white/5 transition-colors"
              >
                View listing →
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
            <div className="rounded-2xl border border-white/5 bg-[#1a1a1a] p-5">
              <p className="text-2xl font-bold text-white">{inquiries.length}</p>
              <p className="text-xs text-white/30 mt-1">Total inquiries</p>
            </div>
            <div className="rounded-2xl border border-amber-500/10 bg-amber-500/5 p-5">
              <p className="text-2xl font-bold text-amber-400">{unreadCount}</p>
              <p className="text-xs text-white/30 mt-1">Unread</p>
            </div>
            <div className="rounded-2xl border border-green-500/10 bg-green-500/5 p-5">
              <p className="text-2xl font-bold text-green-400">{repliedCount}</p>
              <p className="text-xs text-white/30 mt-1">Replied</p>
            </div>
          </div>

          {/* Profile snapshot */}
          <div className="rounded-2xl border border-white/5 bg-[#1a1a1a] p-5 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-white/50 uppercase tracking-widest">Your listing</h2>
              <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border ${
                provider.status === "active"
                  ? "bg-green-500/15 text-green-400 border-green-500/20"
                  : "bg-amber-500/15 text-amber-400 border-amber-500/20"
              }`}>
                {provider.status}
              </span>
            </div>
            <div className="text-sm text-white/50 space-y-1">
              {provider.description ? (
                <p className="line-clamp-2">{provider.description}</p>
              ) : (
                <p className="text-white/20 italic">No description added yet.</p>
              )}
              <div className="flex gap-4 pt-2 text-xs text-white/30">
                {provider.contactEmail && <span>✉️ {provider.contactEmail}</span>}
                {provider.website && <span>🌐 {provider.website.replace(/^https?:\/\//, "")}</span>}
              </div>
            </div>
          </div>

          {/* Inquiries */}
          <div>
            <h2 className="text-lg font-bold text-white mb-4">
              Inquiries
              {unreadCount > 0 && (
                <span className="ml-2 text-xs font-bold bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </h2>
            <InquiryTable inquiries={inquiries} />
          </div>

        </div>
      </main>
    </>
  );
}
