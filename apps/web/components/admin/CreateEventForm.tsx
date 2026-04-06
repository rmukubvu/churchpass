"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { BannerUpload } from "./BannerUpload";
import { LocationAutocomplete } from "./LocationAutocomplete";

const CATEGORIES = [
  { value: "worship", label: "Worship" },
  { value: "conference", label: "Conference" },
  { value: "outreach", label: "Outreach" },
  { value: "youth", label: "Youth" },
  { value: "family", label: "Family" },
  { value: "other", label: "Other" },
] as const;

type FormState = "idle" | "saving" | "error";

type Props = {
  churchId: string;
  churchSlug: string;
};

function Field({
  label,
  required,
  children,
  hint,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-white/80">
        {label}
        {required && <span className="text-indigo-400 ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-white/30">{hint}</p>}
    </div>
  );
}

const inputClass =
  "w-full bg-[#252525] border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/30 transition-colors";

const selectClass =
  "w-full bg-[#252525] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/30 transition-colors appearance-none";

export function CreateEventForm({ churchId, churchSlug }: Props) {
  const router = useRouter();
  const [formState, setFormState] = useState<FormState>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  // Form fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] =
    useState<(typeof CATEGORIES)[number]["value"]>("other");
  const [location, setLocation] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [capacity, setCapacity] = useState("");
  const [conditions, setConditions] = useState("");
  const [rsvpRequired, setRsvpRequired] = useState(true);
  const [isPublic, setIsPublic] = useState(true);
  const [bannerUrl, setBannerUrl] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !startsAt || !endsAt) return;

    setFormState("saving");
    setErrorMsg("");

    try {
      const res = await fetch("/api/trpc/events.create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          json: {
            churchId,
            title: title.trim(),
            description: description.trim() || undefined,
            conditions: conditions.trim() || undefined,
            category,
            location: location.trim() || undefined,
            startsAt: new Date(startsAt),
            endsAt: new Date(endsAt),
            capacity: capacity ? parseInt(capacity, 10) : undefined,
            rsvpRequired,
            isPublic,
            bannerUrl: bannerUrl || undefined,
          },
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error?.message ?? `Request failed (${res.status})`);
      }

      const data = await res.json();
      const eventId = data?.result?.data?.json?.id;

      if (eventId) {
        router.push(`/${churchSlug}/events/${eventId}`);
      } else {
        router.push(`/${churchSlug}`);
      }
    } catch (err: any) {
      setErrorMsg(err.message ?? "Something went wrong");
      setFormState("error");
      setTimeout(() => setFormState("idle"), 5000);
    }
  }

  const saving = formState === "saving";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Error banner */}
      {formState === "error" && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-400">
          {errorMsg}
        </div>
      )}

      {/* Banner image */}
      <Field label="Banner image" hint="Recommended: 1600×900px, JPG or PNG">
        <BannerUpload
          {...(bannerUrl ? { currentUrl: bannerUrl } : {})}
          onUploaded={(url) => setBannerUrl(url)}
        />
      </Field>

      {/* Title */}
      <Field label="Event title" required>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Sound of Revival — Night 1"
          required
          maxLength={200}
          className={inputClass}
        />
      </Field>

      {/* Description */}
      <Field label="Description" hint="Markdown supported. Shown on the event detail page.">
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Join us for an evening of worship and prayer…"
          rows={4}
          className={cn(inputClass, "resize-none")}
        />
      </Field>

      {/* Attendance Conditions */}
      <Field
        label="Attendance conditions"
        hint="One condition per line — shown on the event page and in confirmation emails."
      >
        <div className="relative">
          <textarea
            value={conditions}
            onChange={(e) => setConditions(e.target.value)}
            placeholder={"Doors Open 3pm\nNo luggage for all services\nNo ticket, no entry\nChildren under 5 must be accompanied by an adult"}
            rows={5}
            className={cn(inputClass, "resize-none")}
          />
          {/* bullet-point preview hint */}
          {conditions.trim() && (
            <div className="mt-2 p-3 rounded-xl bg-white/3 border border-white/5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/25 mb-2">Preview</p>
              <ul className="space-y-1">
                {conditions.split("\n").filter(l => l.trim()).map((line, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-white/50">
                    <span className="mt-1.5 w-1 h-1 rounded-full bg-indigo-400/60 flex-none" />
                    {line.trim()}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </Field>

      {/* Category + Location — 2 cols on md+ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Field label="Category" required>
          <div className="relative">
            <select
              value={category}
              onChange={(e) =>
                setCategory(e.target.value as typeof category)
              }
              className={selectClass}
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
            {/* Chevron */}
            <svg
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30"
              viewBox="0 0 16 16"
              fill="none"
            >
              <path
                d="M4 6l4 4 4-4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </Field>

        <Field
          label="Location"
          hint="Full address — used for hotel suggestions and Google Maps."
        >
          <LocationAutocomplete
            value={location}
            onChange={setLocation}
            placeholder="Liverpool Cathedral, Liverpool, UK"
          />
        </Field>
      </div>

      {/* Date/time — 2 cols */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Field label="Starts at" required>
          <input
            type="datetime-local"
            value={startsAt}
            onChange={(e) => setStartsAt(e.target.value)}
            required
            className={inputClass}
          />
        </Field>

        <Field label="Ends at" required>
          <input
            type="datetime-local"
            value={endsAt}
            onChange={(e) => setEndsAt(e.target.value)}
            required
            min={startsAt}
            className={inputClass}
          />
        </Field>
      </div>

      {/* Capacity */}
      <Field
        label="Capacity"
        hint="Leave blank for unlimited."
      >
        <input
          type="number"
          value={capacity}
          onChange={(e) => setCapacity(e.target.value)}
          placeholder="500"
          min={1}
          className={cn(inputClass, "w-full md:w-48")}
        />
      </Field>

      {/* Toggles */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Toggle
          label="RSVP required"
          description="Attendees must register to attend"
          checked={rsvpRequired}
          onChange={setRsvpRequired}
        />
        <Toggle
          label="Public event"
          description="Visible in search and on your church page"
          checked={isPublic}
          onChange={setIsPublic}
        />
      </div>

      {/* Submit */}
      <div className="pt-2 flex items-center gap-4">
        <button
          type="submit"
          disabled={saving || !title.trim() || !startsAt || !endsAt}
          className={cn(
            "flex items-center gap-2 px-7 py-3 rounded-xl font-bold text-sm text-white transition-all",
            saving || !title.trim() || !startsAt || !endsAt
              ? "bg-indigo-700/50 cursor-not-allowed opacity-60"
              : "bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700"
          )}
        >
          {saving ? (
            <>
              <svg
                className="w-4 h-4 animate-spin"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Creating event…
            </>
          ) : (
            "Create event →"
          )}
        </button>

        <button
          type="button"
          onClick={() => router.back()}
          disabled={saving}
          className="text-sm text-white/40 hover:text-white/70 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (val: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={cn(
        "flex items-start gap-3 flex-1 p-4 rounded-xl border text-left transition-colors",
        checked
          ? "bg-indigo-600/10 border-indigo-500/40"
          : "bg-[#1a1a1a] border-white/5 hover:border-white/10"
      )}
    >
      {/* Switch */}
      <div
        className={cn(
          "mt-0.5 flex-none w-9 h-5 rounded-full border transition-colors relative",
          checked ? "bg-indigo-600 border-indigo-500" : "bg-white/10 border-white/10"
        )}
      >
        <div
          className={cn(
            "absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform",
            checked ? "translate-x-4" : "translate-x-0.5"
          )}
        />
      </div>
      <div>
        <p className="text-sm font-medium text-white">{label}</p>
        <p className="text-xs text-white/40 mt-0.5">{description}</p>
      </div>
    </button>
  );
}
