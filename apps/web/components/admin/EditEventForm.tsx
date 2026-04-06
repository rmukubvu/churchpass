"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc-client";

const CATEGORIES = [
  { value: "worship", label: "Worship" },
  { value: "conference", label: "Conference" },
  { value: "outreach", label: "Outreach" },
  { value: "youth", label: "Youth" },
  { value: "family", label: "Family" },
  { value: "other", label: "Other" },
] as const;

type CategoryValue = (typeof CATEGORIES)[number]["value"];
type FormState = "idle" | "saving" | "success" | "error";

export type EventData = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  location: string | null;
  startsAt: Date;
  endsAt: Date | null;
  capacity: number | null;
  rsvpRequired: boolean;
  isPublic: boolean;
};

type Props = {
  event: EventData;
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

/** Convert a UTC Date to a string suitable for datetime-local input (local time) */
function toDatetimeLocal(date: Date): string {
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

export function EditEventForm({ event, churchSlug }: Props) {
  const router = useRouter();
  const [formState, setFormState] = useState<FormState>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const [title, setTitle] = useState(event.title);
  const [description, setDescription] = useState(event.description ?? "");
  const [category, setCategory] = useState<CategoryValue>(
    (CATEGORIES.find((c) => c.value === event.category)?.value) ?? "other"
  );
  const [location, setLocation] = useState(event.location ?? "");
  const [startsAt, setStartsAt] = useState(toDatetimeLocal(new Date(event.startsAt)));
  const [endsAt, setEndsAt] = useState(
    event.endsAt ? toDatetimeLocal(new Date(event.endsAt)) : ""
  );
  const [capacity, setCapacity] = useState(event.capacity?.toString() ?? "");
  const [rsvpRequired, setRsvpRequired] = useState(event.rsvpRequired);
  const [isPublic, setIsPublic] = useState(event.isPublic);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !startsAt) return;

    setFormState("saving");
    setErrorMsg("");

    try {
      await trpc.events.update.mutate({
        eventId: event.id,
        title: title.trim(),
        description: description.trim() || undefined,
        category,
        location: location.trim() || undefined,
        startsAt: new Date(startsAt),
        endsAt: endsAt ? new Date(endsAt) : undefined,
        capacity: capacity ? parseInt(capacity, 10) : undefined,
        rsvpRequired,
        isPublic,
      });

      setFormState("success");
      router.push(`/${churchSlug}/admin`);
      router.refresh();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong");
      setFormState("error");
      setTimeout(() => setFormState("idle"), 5000);
    }
  }

  const saving = formState === "saving";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {formState === "error" && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-400">
          {errorMsg}
        </div>
      )}

      <Field label="Event title" required>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          maxLength={200}
          className={inputClass}
        />
      </Field>

      <Field label="Description" hint="Markdown supported. Shown on the event detail page.">
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          className={cn(inputClass, "resize-none")}
        />
      </Field>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Field label="Category" required>
          <div className="relative">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as CategoryValue)}
              className={selectClass}
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
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
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Liverpool Cathedral, Liverpool, UK"
            className={inputClass}
          />
        </Field>
      </div>

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

        <Field label="Ends at">
          <input
            type="datetime-local"
            value={endsAt}
            onChange={(e) => setEndsAt(e.target.value)}
            min={startsAt}
            className={inputClass}
          />
        </Field>
      </div>

      <Field label="Capacity" hint="Leave blank for unlimited.">
        <input
          type="number"
          value={capacity}
          onChange={(e) => setCapacity(e.target.value)}
          placeholder="500"
          min={1}
          className={cn(inputClass, "w-full md:w-48")}
        />
      </Field>

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

      <div className="pt-2 flex items-center gap-4">
        <button
          type="submit"
          disabled={saving || !title.trim() || !startsAt}
          className={cn(
            "flex items-center gap-2 px-7 py-3 rounded-xl font-bold text-sm text-white transition-all",
            saving || !title.trim() || !startsAt
              ? "bg-indigo-700/50 cursor-not-allowed opacity-60"
              : "bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700"
          )}
        >
          {saving ? (
            <>
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
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
              Saving…
            </>
          ) : (
            "Save changes →"
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
