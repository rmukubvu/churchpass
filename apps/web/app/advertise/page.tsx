"use client";

import { useState } from "react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import Link from "next/link";

const DURATIONS = [
  { value: "one_week", label: "1 week", price: "£49", desc: "Great for single events" },
  { value: "two_weeks", label: "2 weeks", price: "£89", desc: "Most popular" },
  { value: "four_weeks", label: "4 weeks", price: "£149", desc: "Maximum exposure" },
] as const;

const inputCls = "w-full px-4 py-2.5 rounded-xl bg-[#0a0a0f] border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500 placeholder:text-white/20 transition-colors";

export default function AdvertisePage() {
  const [step, setStep] = useState<"info" | "creative" | "review">("info");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    advertiserName: "",
    advertiserEmail: "",
    duration: "two_weeks" as "one_week" | "two_weeks" | "four_weeks",
    imageUrl: "",
    headline: "",
    subheadline: "",
    ctaText: "Learn More",
    clickUrl: "",
  });

  function set<K extends keyof typeof form>(k: K, v: typeof form[K]) {
    setForm((p) => ({ ...p, [k]: v }));
  }

  async function handleCheckout() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ads/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json() as { url?: string; error?: string };
      if (!res.ok || !data.url) { setError(data.error ?? "Something went wrong"); return; }
      window.location.href = data.url;
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const selectedDuration = DURATIONS.find((d) => d.value === form.duration)!;

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <SiteHeader />

      <main className="max-w-2xl mx-auto px-5 pt-[96px] pb-20">
        {/* Hero */}
        <div className="text-center mb-10">
          <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-amber-400 bg-amber-400/10 border border-amber-400/20 px-3 py-1.5 rounded-full mb-4">
            ★ Advertise on ChurchPass
          </span>
          <h1 className="text-3xl font-extrabold text-white mb-3">Reach thousands of<br />church event attendees</h1>
          <p className="text-white/40 text-sm max-w-md mx-auto leading-relaxed">
            Your ad rotates in the featured slider on our homepage — seen by people actively looking for church events, conferences, and revivals.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-10">
          {[
            { label: "Monthly visitors", value: "50k+" },
            { label: "Churches listed", value: "340+" },
            { label: "Events per month", value: "1,200+" },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl bg-[#111118] border border-white/5 p-4 text-center">
              <p className="text-xl font-extrabold text-white">{s.value}</p>
              <p className="text-xs text-white/30 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Pricing cards */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {DURATIONS.map((d) => (
            <button
              key={d.value}
              onClick={() => set("duration", d.value)}
              className={`rounded-2xl border p-4 text-left transition-all ${form.duration === d.value ? "border-indigo-500 bg-indigo-500/8" : "border-white/8 bg-white/2 hover:border-white/20"}`}
            >
              {d.value === "two_weeks" && (
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 bg-indigo-400/10 px-2 py-0.5 rounded-full mb-2 inline-block">Popular</span>
              )}
              <p className="text-lg font-extrabold text-white">{d.price}</p>
              <p className="text-sm font-semibold text-white/70 mt-0.5">{d.label}</p>
              <p className="text-xs text-white/30 mt-1">{d.desc}</p>
            </button>
          ))}
        </div>

        {/* Form card */}
        <div className="rounded-2xl bg-[#111118] border border-white/8 p-7 space-y-6">

          {step === "info" && (
            <>
              <h2 className="text-base font-bold text-white">Your details</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-white/50 block mb-1.5">Company / Brand name <span className="text-red-400">*</span></label>
                  <input className={inputCls} placeholder="Pepsi, Booking.com…" value={form.advertiserName} onChange={(e) => set("advertiserName", e.target.value)} />
                </div>
                <div>
                  <label className="text-sm text-white/50 block mb-1.5">Contact email <span className="text-red-400">*</span></label>
                  <input className={inputCls} type="email" placeholder="ads@yourcompany.com" value={form.advertiserEmail} onChange={(e) => set("advertiserEmail", e.target.value)} />
                </div>
              </div>
              {error && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2.5">{error}</p>}
              <button
                onClick={() => {
                  if (!form.advertiserName.trim() || !form.advertiserEmail.trim()) { setError("Please fill in all fields."); return; }
                  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.advertiserEmail)) { setError("Please enter a valid email."); return; }
                  setError(null); setStep("creative");
                }}
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-colors">
                Continue →
              </button>
            </>
          )}

          {step === "creative" && (
            <>
              <h2 className="text-base font-bold text-white">Your ad creative</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-white/50 block mb-1.5">Ad image URL <span className="text-red-400">*</span> <span className="text-white/20 text-xs">1200×400px recommended</span></label>
                  <input className={inputCls} placeholder="https://yourcdn.com/ad-banner.jpg" value={form.imageUrl} onChange={(e) => set("imageUrl", e.target.value)} />
                  {form.imageUrl && (
                    <div className="mt-2 rounded-xl overflow-hidden aspect-[3/1] bg-white/5">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={form.imageUrl} alt="Ad preview" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                    </div>
                  )}
                </div>
                <div>
                  <label className="text-sm text-white/50 block mb-1.5">Headline <span className="text-red-400">*</span></label>
                  <input className={inputCls} placeholder="Book your hotel near the conference" maxLength={60} value={form.headline} onChange={(e) => set("headline", e.target.value)} />
                </div>
                <div>
                  <label className="text-sm text-white/50 block mb-1.5">Subheadline <span className="text-white/20 text-xs">Optional</span></label>
                  <input className={inputCls} placeholder="Save 20% on rooms near the venue" maxLength={100} value={form.subheadline} onChange={(e) => set("subheadline", e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-white/50 block mb-1.5">CTA button text</label>
                    <input className={inputCls} placeholder="Book Now" maxLength={20} value={form.ctaText} onChange={(e) => set("ctaText", e.target.value)} />
                  </div>
                  <div>
                    <label className="text-sm text-white/50 block mb-1.5">Click URL <span className="text-red-400">*</span></label>
                    <input className={inputCls} placeholder="https://booking.com/churchpass" value={form.clickUrl} onChange={(e) => set("clickUrl", e.target.value)} />
                  </div>
                </div>
              </div>
              {error && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2.5">{error}</p>}
              <div className="flex gap-3">
                <button onClick={() => setStep("info")} className="flex-1 py-3 rounded-xl border border-white/10 text-white/60 font-semibold text-sm hover:bg-white/5 transition-colors">← Back</button>
                <button
                  onClick={() => {
                    if (!form.imageUrl.trim() || !form.headline.trim() || !form.clickUrl.trim()) { setError("Image URL, headline and click URL are required."); return; }
                    setError(null); setStep("review");
                  }}
                  className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-colors">
                  Preview →
                </button>
              </div>
            </>
          )}

          {step === "review" && (
            <>
              <h2 className="text-base font-bold text-white">Review & pay</h2>

              {/* Ad preview */}
              <div className="rounded-xl overflow-hidden border border-white/8">
                <div className="relative aspect-[3/1] bg-[#0a0a0f]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={form.imageUrl} alt="Ad" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10" />
                  <div className="absolute bottom-0 left-0 p-4">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-400 mb-2 inline-block">Ad</span>
                    <p className="text-base font-extrabold text-white leading-tight">{form.headline}</p>
                    {form.subheadline && <p className="text-xs text-white/60 mt-0.5">{form.subheadline}</p>}
                    <span className="inline-block mt-2 text-xs font-semibold px-3 py-1 rounded-full bg-indigo-600 text-white">{form.ctaText}</span>
                  </div>
                </div>
              </div>

              {/* Order summary */}
              <div className="rounded-xl bg-white/3 border border-white/5 p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-white/50">Company</span>
                  <span className="text-white font-medium">{form.advertiserName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/50">Duration</span>
                  <span className="text-white font-medium">{selectedDuration.label}</span>
                </div>
                <div className="flex justify-between text-sm border-t border-white/5 pt-2 mt-2">
                  <span className="text-white font-bold">Total</span>
                  <span className="text-white font-extrabold text-base">{selectedDuration.price}</span>
                </div>
              </div>

              <p className="text-xs text-white/30 text-center">
                All ads are reviewed within 24 hours before going live. You'll receive an email confirmation.
              </p>

              {error && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2.5">{error}</p>}

              <div className="flex gap-3">
                <button onClick={() => setStep("creative")} className="flex-1 py-3 rounded-xl border border-white/10 text-white/60 font-semibold text-sm hover:bg-white/5 transition-colors">← Back</button>
                <button
                  onClick={handleCheckout}
                  disabled={loading}
                  className="flex-1 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-extrabold text-sm transition-colors flex items-center justify-center gap-2">
                  {loading ? "Redirecting…" : `Pay ${selectedDuration.price} →`}
                </button>
              </div>
            </>
          )}
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-white/20 mt-6">
          Questions? Email <a href="mailto:ads@churchpass.events" className="text-indigo-400 hover:text-indigo-300 transition-colors">ads@churchpass.events</a>
        </p>
      </main>
    </div>
  );
}
