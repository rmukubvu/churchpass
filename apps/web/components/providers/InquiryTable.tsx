"use client";

import { useState } from "react";
import type { ProviderInquiry } from "@sanctuary/db";

interface Props {
  inquiries: ProviderInquiry[];
}

const STATUS_COLOURS: Record<string, string> = {
  sent:    "bg-amber-500/15 text-amber-400 border-amber-500/20",
  read:    "bg-blue-500/15 text-blue-400 border-blue-500/20",
  replied: "bg-green-500/15 text-green-400 border-green-500/20",
  closed:  "bg-white/5 text-white/30 border-white/10",
};

export function InquiryTable({ inquiries }: Props) {
  const [selected, setSelected] = useState<ProviderInquiry | null>(null);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [replyError, setReplyError] = useState<string | null>(null);
  const [local, setLocal] = useState<ProviderInquiry[]>(inquiries);

  async function handleReply(inquiry: ProviderInquiry) {
    if (!reply.trim()) return;
    setSending(true);
    setReplyError(null);
    try {
      const res = await fetch("/api/trpc/providers.replyInquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ json: { inquiryId: inquiry.id, reply } }),
      });
      if (!res.ok) throw new Error("Failed");
      setLocal((prev) =>
        prev.map((i) =>
          i.id === inquiry.id
            ? { ...i, status: "replied", providerReply: reply, repliedAt: new Date() }
            : i
        )
      );
      setSelected(null);
      setReply("");
    } catch {
      setReplyError("Failed to send reply. Please try again.");
    } finally {
      setSending(false);
    }
  }

  if (local.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="text-5xl mb-4">📭</div>
        <p className="text-white/30 text-sm">No inquiries yet.</p>
        <p className="text-white/20 text-xs mt-1">
          Churches will be able to find and contact you through the services directory.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {local.map((inquiry) => (
          <div
            key={inquiry.id}
            className="rounded-2xl border border-white/5 bg-[#1a1a1a] p-5 hover:border-white/10 transition-colors"
          >
            <div className="flex items-start justify-between gap-4 mb-3">
              <div>
                <p className="text-sm font-bold text-white">{inquiry.contactName}</p>
                <p className="text-xs text-white/40 mt-0.5">{inquiry.churchName} · {inquiry.contactEmail}</p>
              </div>
              <div className="flex items-center gap-2 flex-none">
                <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border ${STATUS_COLOURS[inquiry.status] ?? STATUS_COLOURS.sent}`}>
                  {inquiry.status}
                </span>
                <span className="text-[10px] text-white/20">
                  {new Date(inquiry.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                </span>
              </div>
            </div>

            {inquiry.eventTitle && (
              <p className="text-xs text-indigo-400/70 mb-2">📅 {inquiry.eventTitle}</p>
            )}

            <p className="text-sm text-white/60 leading-relaxed line-clamp-3">{inquiry.message}</p>

            {inquiry.guestCount && (
              <p className="text-xs text-white/30 mt-2">👥 {inquiry.guestCount} expected guests</p>
            )}

            {inquiry.providerReply && (
              <div className="mt-3 pl-3 border-l-2 border-indigo-500/30">
                <p className="text-xs text-white/30 mb-1">Your reply</p>
                <p className="text-sm text-white/50 leading-relaxed">{inquiry.providerReply}</p>
              </div>
            )}

            {inquiry.status !== "replied" && inquiry.status !== "closed" && (
              <button
                onClick={() => { setSelected(inquiry); setReply(""); }}
                className="mt-4 px-4 py-2 rounded-xl border border-indigo-500/30 text-indigo-400 text-xs font-semibold hover:bg-indigo-500/10 transition-colors"
              >
                Reply →
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Reply modal */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setSelected(null); }}
        >
          <div className="w-full max-w-lg bg-[#1a1a1a] rounded-2xl border border-white/10 p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white">Reply to {selected.contactName}</h3>
              <button onClick={() => setSelected(null)} className="text-white/30 hover:text-white/60 text-lg">✕</button>
            </div>
            <div className="mb-3 p-3 rounded-xl bg-white/3 border border-white/5">
              <p className="text-xs text-white/30 mb-1">Their message</p>
              <p className="text-sm text-white/60 leading-relaxed">{selected.message}</p>
            </div>
            <textarea
              className="w-full px-4 py-2.5 rounded-xl bg-[#0a0a0f] border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500 placeholder:text-white/20 resize-none"
              rows={4}
              placeholder="Hi, thanks for reaching out! We'd love to help with your event…"
              value={reply}
              onChange={(e) => setReply(e.target.value)}
            />
            {replyError && (
              <p className="text-sm text-red-400 mt-2">{replyError}</p>
            )}
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setSelected(null)}
                className="flex-1 py-2.5 rounded-xl border border-white/10 text-white/50 text-sm font-semibold hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleReply(selected)}
                disabled={sending || !reply.trim()}
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-semibold transition-colors"
              >
                {sending ? "Sending…" : "Send reply →"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
