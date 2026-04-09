/**
 * /[slug]/admin/stripe
 * Stripe Connect onboarding page for church admins.
 * Shows current connection status and allows initiating/re-initiating the OAuth flow.
 */
import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import { db } from "@/server/db";
import { churches } from "@sanctuary/db";
import { eq } from "drizzle-orm";
import { SiteHeader } from "@/components/layout/SiteHeader";
import Link from "next/link";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ connected?: string; stripe_error?: string }> };

export default async function AdminStripePage({ params, searchParams }: Props) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const { slug } = await params;
  const { connected, stripe_error } = await searchParams;

  const [church] = await db
    .select()
    .from(churches)
    .where(eq(churches.slug, slug))
    .limit(1);

  if (!church) notFound();

  const isConnected = church.stripeConnectStatus === "active";
  const isPending = church.stripeConnectStatus === "pending";

  const connectUrl = `/api/stripe/connect?churchSlug=${slug}`;

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <SiteHeader />

      <main className="max-w-2xl mx-auto px-5 py-12 space-y-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-white/40">
          <Link href={`/${slug}/admin`} className="hover:text-white/70 transition-colors">Admin</Link>
          <span>›</span>
          <span className="text-white/70">Stripe Payments</span>
        </nav>

        <div className="space-y-2">
          <h1 className="text-2xl font-extrabold text-white">Stripe Payments</h1>
          <p className="text-sm text-white/50">
            Connect your Stripe account to accept paid ticket sales. ChurchPass takes a 2% platform fee per transaction; the rest goes directly to your Stripe account.
          </p>
        </div>

        {/* Success banner */}
        {connected === "1" && (
          <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/30 p-4 text-emerald-400 text-sm font-semibold">
            Stripe connected successfully! You can now create paid events.
          </div>
        )}

        {/* Error banner */}
        {stripe_error && (
          <div className="rounded-2xl bg-red-500/10 border border-red-500/30 p-4 text-red-400 text-sm">
            Stripe connection failed: {stripe_error}. Please try again.
          </div>
        )}

        {/* Status card */}
        <div className="rounded-2xl bg-[#111118] border border-white/8 p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-white/30 mb-1">Connection Status</p>
              {isConnected ? (
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-sm font-semibold text-emerald-400">Connected</span>
                </div>
              ) : isPending ? (
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  <span className="text-sm font-semibold text-amber-400">Pending verification</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-white/20" />
                  <span className="text-sm font-semibold text-white/50">Not connected</span>
                </div>
              )}
            </div>
            {church.stripeAccountId && (
              <code className="text-xs text-white/30 font-mono">{church.stripeAccountId}</code>
            )}
          </div>

          <div className="space-y-3">
            {/* How it works */}
            <div className="rounded-xl bg-white/3 border border-white/5 p-4 space-y-2">
              <p className="text-xs font-bold text-white/50 uppercase tracking-wider">How it works</p>
              <ul className="space-y-1.5">
                {[
                  "Connect your existing Stripe account (or create one)",
                  "Create paid ticket tiers on any event",
                  "Attendees pay securely via Stripe",
                  "Funds deposit directly to your bank — no waiting",
                  "ChurchPass deducts 2% platform fee automatically",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-xs text-white/60">
                    <span className="text-emerald-400 mt-0.5">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <a
            href={connectUrl}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-colors"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
              <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.594-7.305h.003z" />
            </svg>
            {isConnected ? "Reconnect Stripe" : isPending ? "Complete Stripe Setup" : "Connect Stripe Account"}
          </a>

          <p className="text-xs text-white/30 text-center">
            You'll be redirected to Stripe to authorise the connection. Your card details are never stored by ChurchPass.
          </p>
        </div>

        {/* Back link */}
        <Link href={`/${slug}/admin`} className="inline-flex items-center gap-1 text-xs text-white/40 hover:text-white/70 transition-colors">
          ← Back to admin
        </Link>
      </main>
    </div>
  );
}
