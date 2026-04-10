"use client";

import { useState } from "react";

interface Props {
  slug: string;
  fbConnected: boolean;
  fbPageName: string | null;
  igConnected: boolean;
  autoPostFacebook: boolean;
  autoPostInstagram: boolean;
  tokenExpiresAt: string | null;
}

function Toggle({
  label,
  description,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className={`flex items-center justify-between gap-4 ${disabled ? "opacity-40 pointer-events-none" : ""}`}>
      <div>
        <p className="text-sm font-medium text-white">{label}</p>
        {description && <p className="text-xs text-white/30 mt-0.5">{description}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative flex-none w-11 h-6 rounded-full transition-colors ${checked ? "bg-indigo-600" : "bg-white/10"}`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-5" : "translate-x-0"}`}
        />
      </button>
    </div>
  );
}

export function SocialSettingsPanel({
  slug,
  fbConnected,
  fbPageName,
  igConnected,
  autoPostFacebook: initialFb,
  autoPostInstagram: initialIg,
  tokenExpiresAt,
}: Props) {
  const [autoFb, setAutoFb] = useState(initialFb);
  const [autoIg, setAutoIg] = useState(initialIg);
  const [saving, setSaving] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [saved, setSaved] = useState(false);

  async function savePreferences() {
    setSaving(true);
    setSaved(false);
    await fetch("/api/trpc/social.setAutoPost", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ json: { churchSlug: slug, facebook: autoFb, instagram: autoIg } }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  async function disconnect() {
    if (!confirm("Disconnect Facebook and Instagram? Auto-posting will stop.")) return;
    setDisconnecting(true);
    await fetch("/api/trpc/social.disconnectAccount", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ json: { churchSlug: slug } }),
    });
    window.location.reload();
  }

  const expiryDate = tokenExpiresAt
    ? new Date(tokenExpiresAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
    : null;

  return (
    <div className="space-y-6">

      {/* Facebook section */}
      <div className="rounded-2xl border border-white/5 bg-[#1a1a1a] p-6 space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* Facebook logo */}
            <div className="w-10 h-10 rounded-xl bg-[#1877F2] flex items-center justify-center flex-none">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.532-4.697 1.313 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.886v2.268h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-white">Facebook</p>
              {fbConnected ? (
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 flex-none" />
                  <p className="text-xs text-white/50">
                    Connected{fbPageName ? ` · ${fbPageName}` : ""}
                    {expiryDate ? ` · expires ${expiryDate}` : ""}
                  </p>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-white/20 flex-none" />
                  <p className="text-xs text-white/30">Not connected</p>
                </div>
              )}
            </div>
          </div>

          {fbConnected ? (
            <div className="flex gap-2">
              <a
                href={`/api/auth/facebook/connect?churchSlug=${slug}`}
                className="px-3 py-1.5 rounded-lg border border-white/10 text-white/50 text-xs font-semibold hover:bg-white/5 transition-colors"
              >
                Reconnect
              </a>
              <button
                onClick={disconnect}
                disabled={disconnecting}
                className="px-3 py-1.5 rounded-lg border border-red-500/20 text-red-400 text-xs font-semibold hover:bg-red-500/10 transition-colors disabled:opacity-50"
              >
                {disconnecting ? "Disconnecting…" : "Disconnect"}
              </button>
            </div>
          ) : (
            <a
              href={`/api/auth/facebook/connect?churchSlug=${slug}`}
              className="px-4 py-2 rounded-xl bg-[#1877F2] hover:bg-[#166FE5] text-white text-sm font-semibold transition-colors flex items-center gap-2"
            >
              Connect Facebook →
            </a>
          )}
        </div>

        {fbConnected && (
          <div className="border-t border-white/5 pt-5 space-y-4">
            <Toggle
              label="Auto-post to Facebook"
              description="Automatically share new events on your Facebook Page when published."
              checked={autoFb}
              onChange={setAutoFb}
            />

            {/* Instagram sub-section */}
            <div className="pl-4 border-l-2 border-white/5 space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-md bg-gradient-to-br from-[#f09433] via-[#e6683c] via-[#dc2743] via-[#cc2366] to-[#bc1888] flex items-center justify-center flex-none">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </div>
                <p className="text-xs font-semibold text-white/60">Instagram</p>
                {igConnected ? (
                  <span className="text-[10px] font-bold bg-green-500/15 text-green-400 border border-green-500/20 px-1.5 py-0.5 rounded-full">
                    Connected
                  </span>
                ) : (
                  <span className="text-[10px] font-bold bg-white/5 text-white/30 border border-white/10 px-1.5 py-0.5 rounded-full">
                    Not linked
                  </span>
                )}
              </div>

              {igConnected ? (
                <Toggle
                  label="Auto-post to Instagram"
                  description="Posts as an Instagram feed image — requires your event to have a banner image."
                  checked={autoIg}
                  onChange={setAutoIg}
                />
              ) : (
                <p className="text-xs text-white/25 leading-relaxed">
                  No Instagram Business account found on your Facebook Page.
                  Link an Instagram Business or Creator account to your Page in Facebook settings, then reconnect here.
                </p>
              )}
            </div>

            {/* Save */}
            <div className="flex items-center gap-3 pt-1">
              <button
                onClick={savePreferences}
                disabled={saving}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-semibold transition-colors"
              >
                {saving ? "Saving…" : "Save preferences"}
              </button>
              {saved && (
                <span className="text-sm text-green-400">✓ Saved</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* How it works */}
      <div className="rounded-2xl border border-white/5 bg-[#1a1a1a] p-6">
        <h3 className="text-sm font-bold text-white/50 uppercase tracking-widest mb-4">How it works</h3>
        <ol className="space-y-3 text-sm text-white/40 list-decimal list-inside leading-relaxed">
          <li>Connect your Facebook Page using the button above.</li>
          <li>If your Page has a linked Instagram Business account, it will connect automatically.</li>
          <li>Enable auto-posting for Facebook and/or Instagram.</li>
          <li>When you publish a new event, it's automatically shared — no extra steps needed.</li>
          <li>You can also manually toggle sharing per event in the event creation form.</li>
        </ol>
        <p className="text-xs text-white/20 mt-4">
          Your Facebook access token lasts 60 days. You'll see a warning here when it's about to expire.
        </p>
      </div>

    </div>
  );
}
