"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";

interface Props {
  providerId: string;
  providerName: string;
  churchId?: string;
  churchName?: string;
  eventId?: string;
  eventTitle?: string;
  onClose: () => void;
}

export function InquiryForm({
  providerId,
  providerName,
  churchId,
  churchName,
  eventId,
  eventTitle,
  onClose,
}: Props) {
  const { user } = useUser();
  const [contactName, setContactName] = useState(
    user ? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() : ""
  );
  const [contactEmail, setContactEmail] = useState(
    user?.emailAddresses[0]?.emailAddress ?? ""
  );
  const [message, setMessage] = useState("");
  const [guestCount, setGuestCount] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputCls =
    "w-full px-4 py-2.5 rounded-xl bg-[#0a0a0f] border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500 placeholder:text-white/20 transition-colors";

  async function handleSubmit() {
    if (!contactName.trim() || !contactEmail.trim() || message.trim().length < 10) {
      setError("Please fill in your name, email and a message (at least 10 characters).");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/trpc/providers.sendInquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          json: {
            providerId,
            churchId: churchId ?? "guest",
            churchName: churchName ?? contactName,
            eventId: eventId ?? undefined,
            eventTitle: eventTitle ?? undefined,
            eventDate: eventDate ? new Date(eventDate) : undefined,
            contactName,
            contactEmail,
            message,
            guestCount: guestCount ? parseInt(guestCount) : undefined,
          },
        }),
      });
      if (!res.ok) throw new Error("Request failed");
      setDone(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="text-center py-8 space-y-4">
        <div className="text-5xl">✅</div>
        <p className="text-white font-bold text-lg">Inquiry sent!</p>
        <p className="text-white/40 text-sm max-w-xs mx-auto">
          {providerName} has received your message and will get back to you at {contactEmail}.
        </p>
        <button
          onClick={onClose}
          className="mt-4 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-colors"
        >
          Close
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs text-white/30 font-bold uppercase tracking-widest mb-1">Sending inquiry to</p>
        <p className="text-white font-semibold">{providerName}</p>
        {eventTitle && (
          <p className="text-xs text-white/40 mt-0.5">For event: {eventTitle}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-white/40 mb-1 block">Your name *</label>
          <input
            className={inputCls}
            placeholder="John Doe"
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs text-white/40 mb-1 block">Email *</label>
          <input
            className={inputCls}
            type="email"
            placeholder="you@church.com"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-white/40 mb-1 block">Event date</label>
          <input
            className={inputCls}
            type="date"
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs text-white/40 mb-1 block">Expected guests</label>
          <input
            className={inputCls}
            type="number"
            placeholder="200"
            min={1}
            value={guestCount}
            onChange={(e) => setGuestCount(e.target.value)}
          />
        </div>
      </div>

      <div>
        <label className="text-xs text-white/40 mb-1 block">Message *</label>
        <textarea
          className={`${inputCls} resize-none`}
          rows={4}
          placeholder={`Hi ${providerName}, we're organising a church event and would like to enquire about your services…`}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
      </div>

      {error && (
        <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2.5">
          {error}
        </p>
      )}

      <div className="flex gap-3 pt-1">
        <button
          onClick={onClose}
          className="flex-1 py-2.5 rounded-xl border border-white/10 text-white/50 text-sm font-semibold hover:bg-white/5 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Sending…
            </>
          ) : (
            "Send inquiry →"
          )}
        </button>
      </div>
    </div>
  );
}
