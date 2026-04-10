"use client";

import { useState, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

// ─── Types ────────────────────────────────────────────────────────────────────

type AccountType = "org" | "individual" | null;

type OrgData = {
  // Step 1 — basics
  name: string;
  slug: string;
  slugManual: boolean;
  brandColour: string;
  // Step 2 — profile
  description: string;
  foundedYear: string;
  website: string;
  // Step 3 — org details
  denomination: string;
  primaryLanguage: string;
  congregationSize: string;
  instagramHandle: string;
  twitterHandle: string;
  facebookHandle: string;
  youtubeHandle: string;
  // Step 4 — location & contact
  address: string;
  locationType: "physical" | "virtual" | "both";
  publicEmail: string;
  publicPhone: string;
};

type IndividualData = {
  legalName: string;
  idType: "passport" | "drivers_license" | "national_id" | "other";
  description: string;
  role: "artist" | "musician" | "organizer" | "speaker" | "volunteer" | "other";
  address: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toSlug(v: string) {
  return v.toLowerCase().replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}

const PRESET_COLOURS = [
  { value: "#4F46E5", label: "Indigo" },
  { value: "#C41E3A", label: "Red" },
  { value: "#7C3AED", label: "Purple" },
  { value: "#059669", label: "Green" },
  { value: "#2563EB", label: "Blue" },
  { value: "#D97706", label: "Amber" },
  { value: "#0F172A", label: "Midnight" },
  { value: "#BE185D", label: "Pink" },
];

const CONGREGATION_SIZES = ["1–50", "51–200", "201–500", "501–1,000", "1,001–5,000", "5,000+"];

const LANGUAGES = ["English", "French", "Spanish", "Portuguese", "Yoruba", "Igbo", "Twi", "Swahili", "German", "Mandarin", "Arabic", "Hindi"];

const DENOMINATIONS = ["Non-denominational", "Baptist", "Pentecostal", "Catholic", "Anglican", "Methodist", "Presbyterian", "Seventh-day Adventist", "RCCG", "Other"];

const ROLES = [
  { value: "artist", label: "Artist" },
  { value: "musician", label: "Musician" },
  { value: "organizer", label: "Event Organizer" },
  { value: "speaker", label: "Speaker / Preacher" },
  { value: "volunteer", label: "Volunteer" },
  { value: "other", label: "Other" },
] as const;

const ID_TYPES = [
  { value: "passport", label: "Passport" },
  { value: "drivers_license", label: "Driver's licence" },
  { value: "national_id", label: "National ID card" },
  { value: "other", label: "Other government ID" },
] as const;

// ─── Shared field components ──────────────────────────────────────────────────

function Label({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <div className="mb-1.5">
      <p className="text-sm text-white/60 font-medium">{children}</p>
      {hint && <p className="text-xs text-white/30 mt-0.5">{hint}</p>}
    </div>
  );
}

const inputCls = "w-full px-4 py-2.5 rounded-xl bg-[#0a0a0f] border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500 placeholder:text-white/20 transition-colors";
const selectCls = "w-full px-4 py-2.5 rounded-xl bg-[#0a0a0f] border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors";

// ─── Step indicator ───────────────────────────────────────────────────────────

function StepBar({ current, total, labels }: { current: number; total: number; labels: string[] }) {
  return (
    <div className="flex items-center gap-1 mb-8">
      {labels.map((label, i) => {
        const stepNum = i + 1;
        const done = stepNum < current;
        const active = stepNum === current;
        return (
          <div key={label} className="flex items-center gap-1 flex-1 min-w-0">
            <div className={`flex items-center justify-center w-6 h-6 rounded-full text-[11px] font-bold flex-none transition-colors ${
              done ? "bg-indigo-600 text-white" : active ? "bg-indigo-600 text-white ring-2 ring-indigo-400/40" : "bg-white/8 text-white/30"
            }`}>
              {done ? "✓" : stepNum}
            </div>
            <span className={`text-[11px] font-medium truncate hidden sm:block transition-colors ${active ? "text-white/80" : done ? "text-white/40" : "text-white/20"}`}>
              {label}
            </span>
            {i < total - 1 && <div className="flex-1 h-px bg-white/8 mx-1 min-w-[8px]" />}
          </div>
        );
      })}
    </div>
  );
}

// ─── Primary wizard ───────────────────────────────────────────────────────────

export function RegisterWizard() {
  const { user } = useUser();
  const router = useRouter();

  const [accountType, setAccountType] = useState<AccountType>(null);
  const [orgStep, setOrgStep] = useState(1);
  const [indStep, setIndStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [org, setOrg] = useState<OrgData>({
    name: "", slug: "", slugManual: false, brandColour: "#4F46E5",
    description: "", foundedYear: "", website: "",
    denomination: "", primaryLanguage: "English", congregationSize: "",
    instagramHandle: "", twitterHandle: "", facebookHandle: "", youtubeHandle: "",
    address: "", locationType: "physical", publicEmail: "", publicPhone: "",
  });

  const [ind, setInd] = useState<IndividualData>({
    legalName: "", idType: "passport", description: "", role: "organizer", address: "",
  });

  const setO = useCallback(<K extends keyof OrgData>(key: K, val: OrgData[K]) => {
    setOrg((prev) => ({ ...prev, [key]: val }));
  }, []);

  const setI = useCallback(<K extends keyof IndividualData>(key: K, val: IndividualData[K]) => {
    setInd((prev) => ({ ...prev, [key]: val }));
  }, []);

  // ── Submit org ──
  async function submitOrg() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/church/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: org.name,
          slug: org.slug,
          address: org.address,
          brandColour: org.brandColour,
          description: org.description,
          foundedYear: org.foundedYear ? parseInt(org.foundedYear) : undefined,
          website: org.website,
          denomination: org.denomination,
          primaryLanguage: org.primaryLanguage,
          congregationSize: org.congregationSize,
          instagramHandle: org.instagramHandle,
          twitterHandle: org.twitterHandle,
          facebookHandle: org.facebookHandle,
          youtubeHandle: org.youtubeHandle,
          locationType: org.locationType,
          publicEmail: org.publicEmail,
          publicPhone: org.publicPhone,
        }),
      });
      const data = await res.json() as { slug?: string; error?: string };
      if (!res.ok) { setError(data.error ?? "Something went wrong"); return; }
      await user?.reload();
      window.location.href = `/${data.slug}/admin`;
    } catch { setError("Network error. Please try again."); }
    finally { setLoading(false); }
  }

  // ── Submit individual ──
  async function submitIndividual() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/individual/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ind),
      });
      const data = await res.json() as { id?: string; error?: string };
      if (!res.ok) { setError(data.error ?? "Something went wrong"); return; }
      router.push("/my-events?registered=1");
    } catch { setError("Network error. Please try again."); }
    finally { setLoading(false); }
  }

  // ── Type selection ──
  if (!accountType) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-xl font-bold text-white mb-2">Who are you registering as?</h2>
          <p className="text-sm text-white/40">Choose your account type to get started.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            {
              type: "org" as const,
              icon: "🏛️",
              title: "Organisation",
              desc: "A church, ministry, or non-profit that runs events and needs a public page.",
            },
            {
              type: "individual" as const,
              icon: "👤",
              title: "Individual",
              desc: "An artist, musician, speaker, or organizer working independently.",
            },
          ].map(({ type, icon, title, desc }) => (
            <button
              key={type}
              onClick={() => setAccountType(type)}
              className="group text-left rounded-2xl border border-white/8 bg-white/2 hover:border-indigo-500/60 hover:bg-indigo-500/5 p-6 transition-all"
            >
              <div className="text-3xl mb-3">{icon}</div>
              <p className="text-base font-bold text-white mb-1">{title}</p>
              <p className="text-sm text-white/40 leading-relaxed">{desc}</p>
              <div className="mt-4 text-xs font-semibold text-indigo-400 group-hover:text-indigo-300 transition-colors">
                Register as {title} →
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ── Organisation flow ──────────────────────────────────────────────────────
  if (accountType === "org") {
    const orgStepLabels = ["Basics", "Profile", "Details", "Location"];

    return (
      <div>
        <button onClick={() => setAccountType(null)} className="flex items-center gap-1 text-xs text-white/30 hover:text-white/60 mb-6 transition-colors">
          ← Back
        </button>
        <StepBar current={orgStep} total={4} labels={orgStepLabels} />

        {/* Step 1: Basics */}
        {orgStep === 1 && (
          <div className="space-y-5">
            <h2 className="text-lg font-bold text-white">Organisation basics</h2>

            <div>
              <Label>Organisation name <span className="text-red-400">*</span></Label>
              <input className={inputCls} placeholder="Grace Community Church" value={org.name}
                onChange={(e) => {
                  const v = e.target.value;
                  setO("name", v);
                  if (!org.slugManual) setO("slug", toSlug(v));
                }} />
            </div>

            <div>
              <Label hint={`churchpass.events/${org.slug || "your-church"}`}>URL slug <span className="text-red-400">*</span></Label>
              <input className={inputCls} placeholder="grace-community" value={org.slug}
                onChange={(e) => { setO("slugManual", true); setO("slug", toSlug(e.target.value)); }} />
            </div>

            <div>
              <Label>Brand colour</Label>
              <div className="flex items-center gap-2 flex-wrap">
                {PRESET_COLOURS.map((c) => (
                  <button key={c.value} type="button" aria-label={c.label}
                    onClick={() => setO("brandColour", c.value)}
                    style={{ backgroundColor: c.value }}
                    className={`w-8 h-8 rounded-full transition-all ${org.brandColour === c.value ? "ring-2 ring-offset-2 ring-offset-[#111118] ring-white scale-110" : "hover:scale-105"}`} />
                ))}
                <div className="flex items-center gap-1.5 ml-1">
                  <div className="w-8 h-8 rounded-full border border-white/20 flex-shrink-0" style={{ backgroundColor: org.brandColour }} />
                  <input type="text" placeholder="#hex" maxLength={7}
                    className="w-20 px-2.5 py-1.5 rounded-lg bg-[#0a0a0f] border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500 placeholder:text-white/20"
                    onChange={(e) => { if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) setO("brandColour", e.target.value); }} />
                </div>
              </div>
            </div>

            {error && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2.5">{error}</p>}

            <button
              onClick={() => { if (!org.name.trim() || !org.slug.trim()) { setError("Name and URL are required."); return; } setError(null); setOrgStep(2); }}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-colors">
              Continue →
            </button>
          </div>
        )}

        {/* Step 2: Profile */}
        {orgStep === 2 && (
          <div className="space-y-5">
            <h2 className="text-lg font-bold text-white">Organisation profile</h2>

            <div>
              <Label hint="Shown on your public church page">Description</Label>
              <textarea className={`${inputCls} resize-none`} rows={3} placeholder="Tell people about your church — mission, values, what to expect…"
                value={org.description} onChange={(e) => setO("description", e.target.value)} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Founded year</Label>
                <input className={inputCls} type="number" placeholder="1998" min={1800} max={2026}
                  value={org.foundedYear} onChange={(e) => setO("foundedYear", e.target.value)} />
              </div>
              <div>
                <Label>Website</Label>
                <input className={inputCls} placeholder="https://yourchurch.com"
                  value={org.website} onChange={(e) => setO("website", e.target.value)} />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={() => setOrgStep(1)} className="flex-1 py-3 rounded-xl border border-white/10 text-white/60 font-semibold text-sm hover:bg-white/5 transition-colors">
                ← Back
              </button>
              <button onClick={() => setOrgStep(3)} className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-colors">
                Continue →
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Details */}
        {orgStep === 3 && (
          <div className="space-y-5">
            <h2 className="text-lg font-bold text-white">Organisation details</h2>

            <div>
              <Label>Denomination</Label>
              <select className={selectCls} value={org.denomination} onChange={(e) => setO("denomination", e.target.value)}>
                <option value="">Select denomination…</option>
                {DENOMINATIONS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Primary language</Label>
                <select className={selectCls} value={org.primaryLanguage} onChange={(e) => setO("primaryLanguage", e.target.value)}>
                  {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div>
                <Label>Congregation size</Label>
                <select className={selectCls} value={org.congregationSize} onChange={(e) => setO("congregationSize", e.target.value)}>
                  <option value="">Select size…</option>
                  {CONGREGATION_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div>
              <Label hint="Optional — enter handles without @">Social media</Label>
              <div className="grid grid-cols-2 gap-3">
                {([
                  { key: "instagramHandle", label: "Instagram" },
                  { key: "twitterHandle", label: "X / Twitter" },
                  { key: "facebookHandle", label: "Facebook" },
                  { key: "youtubeHandle", label: "YouTube" },
                ] as const).map(({ key, label }) => (
                  <input key={key} className={inputCls} placeholder={label}
                    value={org[key]} onChange={(e) => setO(key, e.target.value)} />
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={() => setOrgStep(2)} className="flex-1 py-3 rounded-xl border border-white/10 text-white/60 font-semibold text-sm hover:bg-white/5 transition-colors">
                ← Back
              </button>
              <button onClick={() => setOrgStep(4)} className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-colors">
                Continue →
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Location & contact */}
        {orgStep === 4 && (
          <div className="space-y-5">
            <h2 className="text-lg font-bold text-white">Location & contact</h2>

            <div>
              <Label>Location type <span className="text-red-400">*</span></Label>
              <div className="grid grid-cols-3 gap-2">
                {([
                  { value: "physical", label: "Physical", icon: "📍" },
                  { value: "virtual", label: "Virtual", icon: "💻" },
                  { value: "both", label: "Both", icon: "🌐" },
                ] as const).map(({ value, label, icon }) => (
                  <button key={value} type="button"
                    onClick={() => setO("locationType", value)}
                    className={`py-3 rounded-xl border text-sm font-semibold transition-all ${org.locationType === value ? "border-indigo-500 bg-indigo-500/10 text-white" : "border-white/10 text-white/40 hover:border-white/20 hover:text-white/60"}`}>
                    <span className="block text-xl mb-1">{icon}</span>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {(org.locationType === "physical" || org.locationType === "both") && (
              <div>
                <Label>Address <span className="text-red-400">*</span></Label>
                <input className={inputCls} placeholder="123 Church Street, London, UK"
                  value={org.address} onChange={(e) => setO("address", e.target.value)} />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Public email</Label>
                <input className={inputCls} type="email" placeholder="hello@yourchurch.com"
                  value={org.publicEmail} onChange={(e) => setO("publicEmail", e.target.value)} />
              </div>
              <div>
                <Label>Public phone</Label>
                <input className={inputCls} type="tel" placeholder="+44 20 1234 5678"
                  value={org.publicPhone} onChange={(e) => setO("publicPhone", e.target.value)} />
              </div>
            </div>

            {error && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2.5">{error}</p>}

            <div className="flex gap-3 pt-2">
              <button onClick={() => setOrgStep(3)} className="flex-1 py-3 rounded-xl border border-white/10 text-white/60 font-semibold text-sm hover:bg-white/5 transition-colors">
                ← Back
              </button>
              <button
                onClick={() => {
                  if ((org.locationType === "physical" || org.locationType === "both") && !org.address.trim()) {
                    setError("Please enter your address."); return;
                  }
                  setError(null);
                  submitOrg();
                }}
                disabled={loading}
                className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2">
                {loading ? <><Spinner /> Creating…</> : "Create organisation →"}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Individual flow ────────────────────────────────────────────────────────
  const indStepLabels = ["Identity", "Profile"];

  return (
    <div>
      <button onClick={() => setAccountType(null)} className="flex items-center gap-1 text-xs text-white/30 hover:text-white/60 mb-6 transition-colors">
        ← Back
      </button>
      <StepBar current={indStep} total={2} labels={indStepLabels} />

      {/* Step 1: Identity */}
      {indStep === 1 && (
        <div className="space-y-5">
          <h2 className="text-lg font-bold text-white">Your identity</h2>

          <div>
            <Label hint="Exactly as shown on your ID document">Legal name <span className="text-red-400">*</span></Label>
            <input className={inputCls} placeholder="John Doe"
              value={ind.legalName} onChange={(e) => setI("legalName", e.target.value)} />
          </div>

          <div>
            <Label>ID type</Label>
            <div className="grid grid-cols-2 gap-2">
              {ID_TYPES.map(({ value, label }) => (
                <button key={value} type="button"
                  onClick={() => setI("idType", value)}
                  className={`py-2.5 px-3 rounded-xl border text-sm font-medium text-left transition-all ${ind.idType === value ? "border-indigo-500 bg-indigo-500/10 text-white" : "border-white/10 text-white/40 hover:border-white/20 hover:text-white/60"}`}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label>Your role <span className="text-red-400">*</span></Label>
            <div className="grid grid-cols-2 gap-2">
              {ROLES.map(({ value, label }) => (
                <button key={value} type="button"
                  onClick={() => setI("role", value)}
                  className={`py-2.5 px-3 rounded-xl border text-sm font-medium text-left transition-all ${ind.role === value ? "border-indigo-500 bg-indigo-500/10 text-white" : "border-white/10 text-white/40 hover:border-white/20 hover:text-white/60"}`}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2.5">{error}</p>}

          <button
            onClick={() => { if (!ind.legalName.trim()) { setError("Legal name is required."); return; } setError(null); setIndStep(2); }}
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-colors">
            Continue →
          </button>
        </div>
      )}

      {/* Step 2: Profile */}
      {indStep === 2 && (
        <div className="space-y-5">
          <h2 className="text-lg font-bold text-white">Your profile</h2>

          <div>
            <Label hint="What you do, your style, your ministry">Description</Label>
            <textarea className={`${inputCls} resize-none`} rows={3}
              placeholder="Gospel musician and worship leader based in London…"
              value={ind.description} onChange={(e) => setI("description", e.target.value)} />
          </div>

          <div>
            <Label>Address</Label>
            <input className={inputCls} placeholder="City, Country"
              value={ind.address} onChange={(e) => setI("address", e.target.value)} />
          </div>

          {error && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2.5">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button onClick={() => setIndStep(1)} className="flex-1 py-3 rounded-xl border border-white/10 text-white/60 font-semibold text-sm hover:bg-white/5 transition-colors">
              ← Back
            </button>
            <button
              onClick={submitIndividual}
              disabled={loading}
              className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2">
              {loading ? <><Spinner /> Submitting…</> : "Complete registration →"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Spinner() {
  return (
    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}
