"use client";

import { useState } from "react";

const PRESET_COLOURS = [
  { value: "#4F46E5", label: "Indigo" },
  { value: "#C41E3A", label: "Red" },
  { value: "#7C3AED", label: "Purple" },
  { value: "#059669", label: "Green" },
  { value: "#2563EB", label: "Blue" },
  { value: "#D97706", label: "Amber" },
];

function toSlug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/[\s]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function RegisterChurchForm() {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [address, setAddress] = useState("");
  const [brandColour, setBrandColour] = useState("#4F46E5");
  const [customHex, setCustomHex] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleNameChange(value: string) {
    setName(value);
    if (!slugManuallyEdited) {
      setSlug(toSlug(value));
    }
  }

  function handleSlugChange(value: string) {
    setSlugManuallyEdited(true);
    setSlug(toSlug(value));
  }

  function handlePresetClick(colour: string) {
    setBrandColour(colour);
    setCustomHex("");
  }

  function handleCustomHexChange(value: string) {
    setCustomHex(value);
    // Only apply if it looks like a valid hex
    if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
      setBrandColour(value);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !slug.trim() || !address.trim()) {
      setError("Please fill in all required fields.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/church/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, slug, address, brandColour }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }

      // Full page navigation so Clerk issues a fresh session token
      // with the updated publicMetadata.adminOf before we hit the admin page
      window.location.href = `/${data.slug}/admin`;
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  const isPresetSelected = PRESET_COLOURS.some((c) => c.value === brandColour);

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl bg-[#1a1a1a] border border-white/5 p-8 space-y-6"
    >
      {/* Church Name */}
      <div>
        <label className="block text-sm text-white/50 mb-1.5" htmlFor="church-name">
          Church Name <span className="text-red-400">*</span>
        </label>
        <input
          id="church-name"
          type="text"
          required
          placeholder="Grace Community Church"
          value={name}
          onChange={(e) => handleNameChange(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl bg-[#0f0f0f] border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500 placeholder:text-white/20"
        />
      </div>

      {/* URL Slug */}
      <div>
        <label className="block text-sm text-white/50 mb-1.5" htmlFor="church-slug">
          URL Slug <span className="text-red-400">*</span>
        </label>
        <input
          id="church-slug"
          type="text"
          required
          placeholder="grace-community"
          value={slug}
          onChange={(e) => handleSlugChange(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl bg-[#0f0f0f] border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500 placeholder:text-white/20"
        />
        {slug && (
          <p className="text-xs text-white/30 mt-1.5">
            churchpass.events/<span className="text-white/60">{slug}</span>
          </p>
        )}
      </div>

      {/* City / Address */}
      <div>
        <label className="block text-sm text-white/50 mb-1.5" htmlFor="church-address">
          City / Address <span className="text-red-400">*</span>
        </label>
        <input
          id="church-address"
          type="text"
          required
          placeholder="123 Main St, Dallas, TX"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl bg-[#0f0f0f] border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500 placeholder:text-white/20"
        />
      </div>

      {/* Brand Colour */}
      <div>
        <label className="block text-sm text-white/50 mb-2.5">Brand Colour</label>
        <div className="flex items-center gap-2 flex-wrap">
          {PRESET_COLOURS.map((colour) => (
            <button
              key={colour.value}
              type="button"
              aria-label={colour.label}
              onClick={() => handlePresetClick(colour.value)}
              style={{ backgroundColor: colour.value }}
              className={`w-8 h-8 rounded-full transition-all focus:outline-none ${
                brandColour === colour.value && !customHex
                  ? "ring-2 ring-offset-2 ring-offset-[#1a1a1a] ring-white scale-110"
                  : "hover:scale-105"
              }`}
            />
          ))}

          {/* Custom hex input */}
          <div className="flex items-center gap-1.5 ml-1">
            <div
              className={`w-8 h-8 rounded-full border border-white/20 flex-shrink-0 transition-all ${
                customHex && /^#[0-9A-Fa-f]{6}$/.test(customHex)
                  ? "ring-2 ring-offset-2 ring-offset-[#1a1a1a] ring-white scale-110"
                  : ""
              }`}
              style={{
                backgroundColor:
                  customHex && /^#[0-9A-Fa-f]{6}$/.test(customHex)
                    ? customHex
                    : "#333",
              }}
            />
            <input
              type="text"
              placeholder="#hex"
              maxLength={7}
              value={customHex}
              onChange={(e) => handleCustomHexChange(e.target.value)}
              className="w-20 px-2.5 py-1.5 rounded-lg bg-[#0f0f0f] border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500 placeholder:text-white/20"
            />
          </div>
        </div>

        {/* Colour preview */}
        <div className="mt-3 flex items-center gap-2">
          <div
            className="w-4 h-4 rounded-full flex-shrink-0"
            style={{ backgroundColor: brandColour }}
          />
          <span className="text-xs text-white/30">{brandColour}</span>
        </div>
      </div>

      {/* Error */}
      {error && (
        <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2.5">
          {error}
        </p>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors text-sm flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <svg
              className="w-4 h-4 animate-spin"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
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
            Creating…
          </>
        ) : (
          "Create my church →"
        )}
      </button>
    </form>
  );
}
