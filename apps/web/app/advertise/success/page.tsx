import { SiteHeader } from "@/components/layout/SiteHeader";
import Link from "next/link";

export default function AdSuccessPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <SiteHeader />
      <main className="max-w-lg mx-auto px-5 pt-[120px] pb-20 text-center">
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24">
            <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h1 className="text-2xl font-extrabold text-white mb-3">Payment received!</h1>
        <p className="text-white/40 text-sm leading-relaxed mb-8">
          Your ad is now in our review queue. We'll review it within 24 hours and email you once it's live on the homepage slider.
        </p>
        <div className="rounded-2xl bg-[#111118] border border-white/8 p-6 text-left space-y-3 mb-8">
          {[
            "✓ Payment confirmed",
            "⏳ Ad under review (up to 24h)",
            "🚀 Goes live in the homepage slider",
            "📊 Track impressions & clicks via email report",
          ].map((s) => (
            <p key={s} className="text-sm text-white/60">{s}</p>
          ))}
        </div>
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-400 hover:text-indigo-300 transition-colors">
          ← Back to home
        </Link>
      </main>
    </div>
  );
}
