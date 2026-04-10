"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { BannerUpload } from "./BannerUpload";
import { LocationAutocomplete } from "./LocationAutocomplete";
import { LocalServicesPanel } from "./LocalServicesPanel";
import { trpc } from "@/lib/trpc-client";

// ─── Types ───────────────────────────────────────────────────────────────────

type Step = "basics" | "location" | "datetime" | "tickets" | "review";

const STEPS: { id: Step; label: string }[] = [
  { id: "basics",   label: "Basics" },
  { id: "location", label: "Location" },
  { id: "datetime", label: "Date & Time" },
  { id: "tickets",  label: "Tickets" },
  { id: "review",   label: "Review" },
];

const CATEGORIES = [
  { value: "worship",    label: "Worship" },
  { value: "conference", label: "Conference" },
  { value: "outreach",   label: "Outreach" },
  { value: "youth",      label: "Youth" },
  { value: "family",     label: "Family" },
  { value: "other",      label: "Other" },
] as const;

const TIMEZONES = [
  "UTC",
  "Europe/London",
  "Europe/Paris",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Toronto",
  "America/Vancouver",
  "Africa/Lagos",
  "Africa/Johannesburg",
  "Asia/Dubai",
];

const DONATION_PRESETS = [500, 1000, 2000, 5000]; // cents

type TicketTierDraft = {
  name: string;
  price: number; // cents
  capacity?: number | undefined;
  earlyBirdPrice?: number | undefined;
  earlyBirdEndsAt?: string | undefined;
};

type Props = {
  churchId: string;
  churchSlug: string;
};

// ─── Shared field components ──────────────────────────────────────────────────

const inputClass =
  "w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/30 transition-colors";

const selectClass =
  "w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/30 transition-colors appearance-none";

function Field({ label, hint, required, children }: {
  label: string; hint?: string; required?: boolean; children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-white/80">
        {label}{required && <span className="text-indigo-400 ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-white/30">{hint}</p>}
    </div>
  );
}

function Toggle({ label, description, checked, onChange }: {
  label: string; description: string; checked: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <button type="button" onClick={() => onChange(!checked)}
      className={cn("flex items-start gap-3 flex-1 p-4 rounded-xl border text-left transition-colors",
        checked ? "bg-indigo-600/10 border-indigo-500/40" : "bg-[#1a1a1a] border-white/5 hover:border-white/10"
      )}>
      <div className={cn("mt-0.5 flex-none w-9 h-5 rounded-full border transition-colors relative",
        checked ? "bg-indigo-600 border-indigo-500" : "bg-white/10 border-white/10")}>
        <div className={cn("absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform",
          checked ? "translate-x-4" : "translate-x-0.5")} />
      </div>
      <div>
        <p className="text-sm font-medium text-white">{label}</p>
        <p className="text-xs text-white/40 mt-0.5">{description}</p>
      </div>
    </button>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function CreateEventForm({ churchId, churchSlug }: Props) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("basics");
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Step 1 — Basics
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [category, setCategory] = useState<typeof CATEGORIES[number]["value"]>("other");
  const [tags, setTags] = useState("");
  const [conditions, setConditions] = useState("");
  const [visibility, setVisibility] = useState<"public" | "private">("public");
  const [isDraft, setIsDraft] = useState(false);
  const [rsvpRequired, setRsvpRequired] = useState(true);
  const [isPublic, setIsPublic] = useState(true);

  // Step 2 — Location
  const [locationType, setLocationType] = useState<"in_person" | "virtual" | "hybrid">("in_person");
  const [location, setLocation] = useState("");
  const [locationDirections, setLocationDirections] = useState("");
  const [locationUrl, setLocationUrl] = useState("");
  const [locationTbd, setLocationTbd] = useState(false);

  // Step 3 — Date & Time
  const [timezone, setTimezone] = useState("Europe/London");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringFrequency, setRecurringFrequency] = useState<"weekly" | "biweekly" | "monthly">("weekly");
  const [recurringEndsAfter, setRecurringEndsAfter] = useState("4");

  // Step 4 — Tickets
  const [capacity, setCapacity] = useState("");
  const [waitlistEnabled, setWaitlistEnabled] = useState(false);
  const [waitlistCapacity, setWaitlistCapacity] = useState("");
  const [waitlistAutoPromote, setWaitlistAutoPromote] = useState(true);
  const [ticketType, setTicketType] = useState<"free" | "paid" | "donation">("free");
  const [tiers, setTiers] = useState<TicketTierDraft[]>([{ name: "General Admission", price: 0 }]);
  const [processingFeeMode, setProcessingFeeMode] = useState<"absorb" | "pass">("absorb");
  const [refundPolicy, setRefundPolicy] = useState<"none" | "full" | "custom">("none");
  const [refundDays, setRefundDays] = useState("7");
  const [refundPolicyDetails, setRefundPolicyDetails] = useState("");
  const [donationMinimum, setDonationMinimum] = useState("");
  const [donationPresets, setDonationPresets] = useState<number[]>(DONATION_PRESETS);

  const currentStepIndex = STEPS.findIndex((s) => s.id === step);

  function goNext() {
    const next = STEPS[currentStepIndex + 1];
    if (next) setStep(next.id);
  }
  function goBack() {
    const prev = STEPS[currentStepIndex - 1];
    if (prev) setStep(prev.id);
  }

  async function handleSubmit() {
    if (!title.trim() || !startsAt || !endsAt) return;
    setSaving(true);
    setErrorMsg("");
    try {
      const tagList = tags.split(",").map((t) => t.trim()).filter(Boolean);

      const event = await trpc.events.create.mutate({
        churchId,
        title: title.trim(),
        description: description.trim() || undefined,
        bannerUrl: bannerUrl || undefined,
        category,
        tags: tagList,
        conditions: conditions.trim() || undefined,
        visibility,
        isDraft,
        locationType,
        location: location.trim() || undefined,
        locationDirections: locationDirections.trim() || undefined,
        locationUrl: locationUrl.trim() || undefined,
        locationTbd,
        timezone,
        startsAt: new Date(startsAt),
        endsAt: new Date(endsAt),
        isRecurring,
        recurringFrequency: isRecurring ? recurringFrequency : undefined,
        recurringEndsAfter: isRecurring && recurringEndsAfter ? parseInt(recurringEndsAfter) : undefined,
        capacity: capacity ? parseInt(capacity, 10) : undefined,
        waitlistEnabled,
        waitlistCapacity: waitlistCapacity ? parseInt(waitlistCapacity, 10) : undefined,
        waitlistAutoPromote,
        rsvpRequired,
        isPublic: visibility === "private" ? false : isPublic,
        ticketType,
        processingFeeMode,
        donationMinimum: donationMinimum ? Math.round(parseFloat(donationMinimum) * 100) : undefined,
        donationSuggestedAmounts: ticketType === "donation" ? donationPresets : [],
        refundPolicy: ticketType === "paid" ? refundPolicy : undefined,
        refundDays: refundPolicy === "full" && ticketType === "paid" ? parseInt(refundDays) : undefined,
        refundPolicyDetails: refundPolicy === "custom" ? refundPolicyDetails : undefined,
      });

      // For paid events, save ticket tiers
      if (ticketType === "paid" && event && tiers.length > 0) {
        await trpc.ticketTiers.upsert.mutate({
          eventId: event.id,
          tiers: tiers.map((t, i) => ({
            name: t.name,
            price: t.price,
            capacity: t.capacity,
            sortOrder: i,
            earlyBirdPrice: t.earlyBirdPrice,
            earlyBirdEndsAt: t.earlyBirdEndsAt ? new Date(t.earlyBirdEndsAt) : undefined,
          })),
        });
      }

      if (event) {
        // For private events, show the secret link before redirecting
        if (visibility === "private" && event.secretToken) {
          router.push(`/${churchSlug}/admin/events/${event.id}?created=private&token=${event.secretToken}`);
        } else {
          router.push(`/${churchSlug}/events/${event.id}`);
        }
      } else {
        router.push(`/${churchSlug}`);
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong");
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Step indicator */}
      <div className="flex items-center gap-0">
        {STEPS.map((s, i) => {
          const done = i < currentStepIndex;
          const active = s.id === step;
          return (
            <div key={s.id} className="flex items-center flex-1 last:flex-none">
              <button
                type="button"
                onClick={() => done && setStep(s.id)}
                className={cn("flex items-center gap-2 py-2 transition-colors",
                  done ? "cursor-pointer" : "cursor-default")}
              >
                <div className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border transition-colors",
                  active ? "bg-indigo-600 border-indigo-500 text-white"
                    : done ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400"
                    : "bg-white/5 border-white/10 text-white/30"
                )}>
                  {done ? "✓" : i + 1}
                </div>
                <span className={cn("text-xs font-medium hidden sm:block",
                  active ? "text-white" : done ? "text-white/50" : "text-white/25"
                )}>
                  {s.label}
                </span>
              </button>
              {i < STEPS.length - 1 && (
                <div className={cn("flex-1 h-px mx-2 transition-colors",
                  i < currentStepIndex ? "bg-emerald-500/30" : "bg-white/5")} />
              )}
            </div>
          );
        })}
      </div>

      {/* Error */}
      {errorMsg && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-400">
          {errorMsg}
        </div>
      )}

      {/* ── Step 1: Basics ── */}
      {step === "basics" && (
        <div className="space-y-6">
          <Field label="Banner image" hint="Recommended 1600×900px">
            <BannerUpload {...(bannerUrl ? { currentUrl: bannerUrl } : {})} onUploaded={setBannerUrl} />
          </Field>

          <Field label="Event title" required>
            <input value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder="Sound of Revival — Night 1" maxLength={200} className={inputClass} />
          </Field>

          <Field label="Description" hint="What happens at this event?">
            <textarea value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="Join us for an evening of worship and prayer…" rows={4}
              className={cn(inputClass, "resize-none")} />
          </Field>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Field label="Category" required>
              <div className="relative">
                <select value={category} onChange={(e) => setCategory(e.target.value as typeof category)} className={selectClass}>
                  {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
                <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" viewBox="0 0 16 16" fill="none">
                  <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </Field>

            <Field label="Tags" hint="Comma-separated, e.g. revival, worship, prayer">
              <input value={tags} onChange={(e) => setTags(e.target.value)}
                placeholder="revival, worship, prayer" className={inputClass} />
            </Field>
          </div>

          <Field label="Attendance conditions" hint="One condition per line — shown in confirmation email only">
            <textarea value={conditions} onChange={(e) => setConditions(e.target.value)}
              placeholder={"Doors open 3pm\nNo luggage\nNo ticket, no entry"} rows={4}
              className={cn(inputClass, "resize-none")} />
          </Field>

          {/* Visibility */}
          <div>
            <p className="text-sm font-medium text-white/80 mb-3">Visibility</p>
            <div className="flex gap-3">
              {(["public", "private"] as const).map((v) => (
                <button key={v} type="button" onClick={() => setVisibility(v)}
                  className={cn("flex-1 p-4 rounded-xl border text-left transition-colors",
                    visibility === v ? "bg-indigo-600/10 border-indigo-500/40" : "bg-[#1a1a1a] border-white/5 hover:border-white/10"
                  )}>
                  <p className="text-sm font-semibold text-white capitalize">{v}</p>
                  <p className="text-xs text-white/40 mt-0.5">
                    {v === "public" ? "Appears in search and your church page"
                      : "Hidden — accessible only via secret link"}
                  </p>
                </button>
              ))}
            </div>
            {visibility === "private" && (
              <p className="mt-2 text-xs text-amber-400/80 flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 flex-none" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 1a3 3 0 00-3 3v1H4a1 1 0 00-1 1v7a1 1 0 001 1h8a1 1 0 001-1V6a1 1 0 00-1-1h-1V4a3 3 0 00-3-3zm-1 3a1 1 0 112 0v1H7V4z" />
                </svg>
                A secret shareable link will be generated after creation
              </p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Toggle label="RSVP required" description="Attendees must register to attend" checked={rsvpRequired} onChange={setRsvpRequired} />
            {visibility === "public" && (
              <Toggle label="Public event" description="Visible in search results" checked={isPublic} onChange={setIsPublic} />
            )}
            <Toggle label="Save as draft" description="Not published yet — finish later" checked={isDraft} onChange={setIsDraft} />
          </div>
        </div>
      )}

      {/* ── Step 2: Location ── */}
      {step === "location" && (
        <div className="space-y-6">
          <div>
            <p className="text-sm font-medium text-white/80 mb-3">Location type</p>
            <div className="grid grid-cols-3 gap-3">
              {([
                { value: "in_person", label: "In-person", icon: "📍" },
                { value: "virtual",   label: "Virtual",   icon: "💻" },
                { value: "hybrid",    label: "Hybrid",    icon: "🔀" },
              ] as const).map((t) => (
                <button key={t.value} type="button" onClick={() => setLocationType(t.value)}
                  className={cn("p-4 rounded-xl border text-center transition-colors",
                    locationType === t.value ? "bg-indigo-600/10 border-indigo-500/40" : "bg-[#1a1a1a] border-white/5 hover:border-white/10"
                  )}>
                  <span className="text-xl">{t.icon}</span>
                  <p className="text-xs font-medium text-white mt-1">{t.label}</p>
                </button>
              ))}
            </div>
          </div>

          {(locationType === "in_person" || locationType === "hybrid") && (
            <>
              <Toggle label="Venue TBD" description="Show 'Venue to be announced' to attendees"
                checked={locationTbd} onChange={setLocationTbd} />

              {!locationTbd && (
                <Field label="Venue / Address" hint="Full address — used for hotel suggestions and maps">
                  <LocationAutocomplete value={location} onChange={setLocation}
                    placeholder="Liverpool Cathedral, Liverpool, UK" />
                </Field>
              )}

              <Field label="Directions & extra info" hint="Parking, entrance notes, transit info">
                <textarea value={locationDirections} onChange={(e) => setLocationDirections(e.target.value)}
                  placeholder="Enter via the North Door. Parking available on Dale Street." rows={3}
                  className={cn(inputClass, "resize-none")} />
              </Field>
            </>
          )}

          {(locationType === "virtual" || locationType === "hybrid") && (
            <Field label="Meeting link" hint="Hidden until RSVP is confirmed">
              <input value={locationUrl} onChange={(e) => setLocationUrl(e.target.value)}
                placeholder="https://zoom.us/j/..." className={inputClass} />
            </Field>
          )}

          {/* Local service providers near the event city */}
          {(locationType === "in_person" || locationType === "hybrid") && !locationTbd && location && (
            <LocalServicesPanel city={location.split(",").slice(-2, -1)[0]?.trim() ?? location.split(",")[0]?.trim() ?? ""} />
          )}
        </div>
      )}

      {/* ── Step 3: Date & Time ── */}
      {step === "datetime" && (
        <div className="space-y-6">
          <Field label="Timezone" required>
            <div className="relative">
              <select value={timezone} onChange={(e) => setTimezone(e.target.value)} className={selectClass}>
                {TIMEZONES.map((tz) => <option key={tz} value={tz}>{tz}</option>)}
              </select>
              <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" viewBox="0 0 16 16" fill="none">
                <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </Field>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Field label="Start date & time" required>
              <input type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)}
                required className={inputClass} />
            </Field>
            <Field label="End time" hint="Leave blank if end time is TBD">
              <input type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)}
                min={startsAt} className={inputClass} />
            </Field>
          </div>

          <Toggle label="Recurring event" description="Repeats weekly, bi-weekly, or monthly"
            checked={isRecurring} onChange={setIsRecurring} />

          {isRecurring && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pl-4 border-l-2 border-indigo-500/30">
              <Field label="Frequency">
                <div className="relative">
                  <select value={recurringFrequency} onChange={(e) => setRecurringFrequency(e.target.value as typeof recurringFrequency)} className={selectClass}>
                    <option value="weekly">Weekly</option>
                    <option value="biweekly">Bi-weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                  <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" viewBox="0 0 16 16" fill="none">
                    <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </Field>
              <Field label="Ends after (occurrences)" hint="e.g. 12 = runs 12 times">
                <input type="number" value={recurringEndsAfter} onChange={(e) => setRecurringEndsAfter(e.target.value)}
                  min={1} max={52} className={cn(inputClass, "w-full md:w-32")} />
              </Field>
            </div>
          )}
        </div>
      )}

      {/* ── Step 4: Tickets ── */}
      {step === "tickets" && (
        <div className="space-y-6">
          {/* Capacity */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Field label="Capacity" hint="Blank = unlimited">
              <input type="number" value={capacity} onChange={(e) => setCapacity(e.target.value)}
                placeholder="500" min={1} className={cn(inputClass)} />
            </Field>
          </div>

          {/* Waitlist */}
          <Toggle label="Enable waitlist" description="When capacity is full, people can join a waitlist"
            checked={waitlistEnabled} onChange={setWaitlistEnabled} />

          {waitlistEnabled && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pl-4 border-l-2 border-indigo-500/30">
              <Field label="Waitlist capacity" hint="Blank = unlimited">
                <input type="number" value={waitlistCapacity} onChange={(e) => setWaitlistCapacity(e.target.value)}
                  placeholder="100" min={1} className={inputClass} />
              </Field>
              <Toggle label="Auto-promote" description="Automatically move waitlist → confirmed when spot opens"
                checked={waitlistAutoPromote} onChange={setWaitlistAutoPromote} />
            </div>
          )}

          {/* Ticket type */}
          <div>
            <p className="text-sm font-medium text-white/80 mb-3">Pricing</p>
            <div className="grid grid-cols-3 gap-3">
              {([
                { value: "free",     label: "Free",     icon: "🎟️" },
                { value: "paid",     label: "Paid",     icon: "💳" },
                { value: "donation", label: "Donation", icon: "❤️" },
              ] as const).map((t) => (
                <button key={t.value} type="button" onClick={() => setTicketType(t.value)}
                  className={cn("p-4 rounded-xl border text-center transition-colors",
                    ticketType === t.value ? "bg-indigo-600/10 border-indigo-500/40" : "bg-[#1a1a1a] border-white/5 hover:border-white/10"
                  )}>
                  <span className="text-xl">{t.icon}</span>
                  <p className="text-xs font-medium text-white mt-1">{t.label}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Paid — ticket tiers */}
          {ticketType === "paid" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-white">Ticket tiers</p>
                <button type="button" onClick={() => setTiers([...tiers, { name: "", price: 0 }])}
                  className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors font-medium">
                  + Add tier
                </button>
              </div>

              {tiers.map((tier, i) => (
                <div key={i} className="bg-[#111118] border border-white/5 rounded-2xl p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-white/40 uppercase tracking-widest">Tier {i + 1}</p>
                    {tiers.length > 1 && (
                      <button type="button" onClick={() => setTiers(tiers.filter((_, j) => j !== i))}
                        className="text-xs text-red-400 hover:text-red-300 transition-colors">Remove</button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Field label="Name">
                      <input value={tier.name}
                        onChange={(e) => setTiers(tiers.map((t, j) => j === i ? { ...t, name: e.target.value } : t))}
                        placeholder="General Admission" className={inputClass} />
                    </Field>
                    <Field label="Price (£)" required>
                      <input type="number" step="0.01" min="0"
                        value={tier.price / 100}
                        onChange={(e) => setTiers(tiers.map((t, j) => j === i ? { ...t, price: Math.round(parseFloat(e.target.value || "0") * 100) } : t))}
                        placeholder="25.00" className={inputClass} />
                    </Field>
                    <Field label="Capacity" hint="Blank = unlimited">
                      <input type="number" min="1"
                        value={tier.capacity ?? ""}
                        onChange={(e) => setTiers(tiers.map((t, j) => j === i ? { ...t, capacity: e.target.value ? parseInt(e.target.value) : undefined } : t))}
                        placeholder="200" className={inputClass} />
                    </Field>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="Early bird price (£)" hint="Optional">
                      <input type="number" step="0.01" min="0"
                        value={tier.earlyBirdPrice !== undefined ? tier.earlyBirdPrice / 100 : ""}
                        onChange={(e) => setTiers(tiers.map((t, j) => j === i ? { ...t, earlyBirdPrice: e.target.value ? Math.round(parseFloat(e.target.value) * 100) : undefined } : t))}
                        placeholder="15.00" className={inputClass} />
                    </Field>
                    <Field label="Early bird ends" hint="Optional">
                      <input type="datetime-local"
                        value={tier.earlyBirdEndsAt ?? ""}
                        onChange={(e) => setTiers(tiers.map((t, j) => j === i ? { ...t, earlyBirdEndsAt: e.target.value } : t))}
                        className={inputClass} />
                    </Field>
                  </div>
                </div>
              ))}

              {/* Processing fees */}
              <div>
                <p className="text-sm font-medium text-white/80 mb-2">Processing fees</p>
                <div className="flex gap-3">
                  {([
                    { value: "absorb", label: "Absorb fees", desc: "You cover Stripe fees" },
                    { value: "pass",   label: "Pass to attendee", desc: "Attendee pays fees on top" },
                  ] as const).map((opt) => (
                    <button key={opt.value} type="button" onClick={() => setProcessingFeeMode(opt.value)}
                      className={cn("flex-1 p-3 rounded-xl border text-left transition-colors text-sm",
                        processingFeeMode === opt.value ? "bg-indigo-600/10 border-indigo-500/40" : "bg-[#1a1a1a] border-white/5 hover:border-white/10"
                      )}>
                      <p className="font-semibold text-white">{opt.label}</p>
                      <p className="text-xs text-white/40 mt-0.5">{opt.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Refund policy */}
              <Field label="Refund policy">
                <div className="flex gap-3">
                  {([
                    { value: "none",   label: "No refunds" },
                    { value: "full",   label: "Full refund" },
                    { value: "custom", label: "Custom" },
                  ] as const).map((opt) => (
                    <button key={opt.value} type="button" onClick={() => setRefundPolicy(opt.value)}
                      className={cn("flex-1 py-2.5 px-3 rounded-xl border text-sm font-medium transition-colors",
                        refundPolicy === opt.value ? "bg-indigo-600/10 border-indigo-500/40 text-white" : "bg-[#1a1a1a] border-white/5 text-white/50 hover:border-white/10"
                      )}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </Field>

              {refundPolicy === "full" && (
                <Field label="Refund up to how many days before event?">
                  <input type="number" value={refundDays} onChange={(e) => setRefundDays(e.target.value)}
                    min={1} className={cn(inputClass, "w-32")} />
                </Field>
              )}
              {refundPolicy === "custom" && (
                <Field label="Custom refund policy">
                  <textarea value={refundPolicyDetails} onChange={(e) => setRefundPolicyDetails(e.target.value)}
                    placeholder="Describe your refund terms…" rows={3} className={cn(inputClass, "resize-none")} />
                </Field>
              )}
            </div>
          )}

          {/* Donation */}
          {ticketType === "donation" && (
            <div className="space-y-4">
              <Field label="Minimum donation (£)" hint="Blank = no minimum">
                <input type="number" step="0.01" min="0" value={donationMinimum}
                  onChange={(e) => setDonationMinimum(e.target.value)}
                  placeholder="5.00" className={cn(inputClass, "w-40")} />
              </Field>
              <div>
                <p className="text-sm font-medium text-white/80 mb-2">Suggested amounts</p>
                <div className="flex gap-2 flex-wrap">
                  {DONATION_PRESETS.map((p) => (
                    <button key={p} type="button"
                      onClick={() => setDonationPresets((prev) => prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p])}
                      className={cn("px-4 py-2 rounded-full border text-sm font-medium transition-colors",
                        donationPresets.includes(p) ? "bg-indigo-600/20 border-indigo-500/40 text-indigo-300" : "bg-[#1a1a1a] border-white/10 text-white/50"
                      )}>
                      £{p / 100}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Step 5: Review ── */}
      {step === "review" && (
        <div className="space-y-4">
          <p className="text-sm text-white/50 mb-2">Review your event before publishing.</p>
          <div className="bg-[#111118] border border-white/5 rounded-2xl p-5 space-y-3 text-sm">
            <ReviewRow label="Title" value={title} />
            <ReviewRow label="Category" value={category} />
            <ReviewRow label="Visibility" value={visibility} />
            <ReviewRow label="Location type" value={locationType.replace("_", "-")} />
            {location && <ReviewRow label="Venue" value={location} />}
            <ReviewRow label="Starts" value={startsAt ? new Date(startsAt).toLocaleString() : "—"} />
            <ReviewRow label="Ends" value={endsAt ? new Date(endsAt).toLocaleString() : "TBD"} />
            <ReviewRow label="Timezone" value={timezone} />
            <ReviewRow label="Tickets" value={ticketType} />
            {capacity && <ReviewRow label="Capacity" value={capacity} />}
            {waitlistEnabled && <ReviewRow label="Waitlist" value="Enabled" />}
            {isDraft && <ReviewRow label="Status" value="Draft (not published)" />}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between pt-2 border-t border-white/5">
        <button type="button" onClick={goBack} disabled={currentStepIndex === 0}
          className="text-sm text-white/40 hover:text-white/70 transition-colors disabled:opacity-0">
          ← Back
        </button>

        {step !== "review" ? (
          <button type="button" onClick={goNext}
            disabled={step === "basics" && !title.trim()}
            className={cn("px-6 py-2.5 rounded-xl font-semibold text-sm text-white transition-all",
              step === "basics" && !title.trim()
                ? "bg-indigo-700/50 cursor-not-allowed opacity-50"
                : "bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700"
            )}>
            Next →
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => { setIsDraft(true); handleSubmit(); }}
              disabled={saving}
              className="px-5 py-2.5 rounded-xl border border-white/10 text-sm font-medium text-white/60 hover:text-white hover:border-white/20 transition-colors disabled:opacity-50">
              Save draft
            </button>
            <button type="button" onClick={handleSubmit} disabled={saving || !title.trim() || !startsAt}
              className={cn("flex items-center gap-2 px-7 py-2.5 rounded-xl font-bold text-sm text-white transition-all",
                saving || !title.trim() || !startsAt
                  ? "bg-indigo-700/50 cursor-not-allowed opacity-60"
                  : "bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700"
              )}>
              {saving ? (
                <>
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Creating…
                </>
              ) : isDraft ? "Save draft" : "Publish event →"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-white/40 flex-none w-28">{label}</span>
      <span className="text-white text-right capitalize">{value || "—"}</span>
    </div>
  );
}
