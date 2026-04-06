"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { cn, formatDate, formatShortDate } from "@/lib/utils";
import { CATEGORY_LABELS } from "@/lib/constants";
import type { MyEventRow } from "@/app/my-events/page";

type Tab = "upcoming" | "past";

type Props = { rows: MyEventRow[] };

export function MyEventsShell({ rows }: Props) {
  const [tab, setTab] = useState<Tab>("upcoming");
  const [qrOpen, setQrOpen] = useState<string | null>(null); // rsvpId
  const [cancelled, setCancelled] = useState<Set<string>>(new Set());

  const now = new Date();
  const upcoming = rows.filter(
    (r) => new Date(r.eventStartsAt) >= now && r.rsvpStatus !== "cancelled" && !cancelled.has(r.rsvpId)
  );
  const past = rows.filter(
    (r) => new Date(r.eventStartsAt) < now || r.rsvpStatus === "cancelled" || cancelled.has(r.rsvpId)
  );

  const active = tab === "upcoming" ? upcoming : past;
  const openRow = rows.find((r) => r.rsvpId === qrOpen);

  async function handleCancel(rsvpId: string) {
    try {
      await fetch("/api/trpc/rsvps.cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ json: { rsvpId } }),
      });
      setCancelled((prev) => new Set([...prev, rsvpId]));
    } catch {
      // silent fail
    }
  }

  return (
    <>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-white">My Events</h1>
          <p className="text-white/40 text-sm mt-1">
            All your RSVPs across every church, in one place.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8">
          {(["upcoming", "past"] as Tab[]).map((t) => {
            const count = t === "upcoming" ? upcoming.length : past.length;
            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  "flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-colors",
                  tab === t
                    ? "bg-indigo-600 text-white"
                    : "bg-[#1a1a1a] text-white/50 hover:text-white hover:bg-[#252525]"
                )}
              >
                {t === "upcoming" ? "Upcoming" : "Past"}
                <span
                  className={cn(
                    "text-xs px-1.5 py-0.5 rounded-full font-bold",
                    tab === t ? "bg-white/20 text-white" : "bg-white/10 text-white/40"
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Event list */}
        {active.length === 0 ? (
          <EmptyState tab={tab} />
        ) : (
          <div className="space-y-4">
            {active.map((row) => (
              <EventRow
                key={row.rsvpId}
                row={row}
                onShowQr={() => setQrOpen(row.rsvpId)}
                onCancel={() => handleCancel(row.rsvpId)}
              />
            ))}
          </div>
        )}
      </div>

      {/* QR modal */}
      {qrOpen && openRow && (
        <QrModal row={openRow} onClose={() => setQrOpen(null)} />
      )}
    </>
  );
}

/* ─────────────────────────────── EventRow ─────────────────────────────── */

function EventRow({
  row,
  onShowQr,
  onCancel,
}: {
  row: MyEventRow;
  onShowQr: () => void;
  onCancel: () => void;
}) {
  const [confirmCancel, setConfirmCancel] = useState(false);
  const isPast = new Date(row.eventStartsAt) < new Date();
  const isCheckedIn = !!row.checkedInAt;
  const isCancelled = row.rsvpStatus === "cancelled";

  const [month, day] = formatShortDate(new Date(row.eventStartsAt)).split(" ");

  return (
    <div
      className={cn(
        "flex gap-4 items-stretch bg-[#1a1a1a] border rounded-2xl overflow-hidden transition-colors",
        isCancelled ? "border-white/5 opacity-50" : "border-white/5 hover:border-white/10"
      )}
    >
      {/* Date block */}
      <div
        className="flex-none w-16 flex flex-col items-center justify-center py-4 text-white"
        style={{ backgroundColor: row.churchBrandColour + "33" }}
      >
        <span
          className="text-[10px] font-black uppercase tracking-widest"
          style={{ color: row.churchBrandColour }}
        >
          {month}
        </span>
        <span className="text-2xl font-black leading-none">{day}</span>
      </div>

      {/* Banner thumbnail (if available) */}
      {row.eventBannerUrl && (
        <div className="hidden sm:block relative w-24 flex-none overflow-hidden">
          <Image
            src={row.eventBannerUrl}
            alt={row.eventTitle}
            fill
            className={cn("object-cover", isPast && "grayscale opacity-50")}
            sizes="96px"
          />
        </div>
      )}

      {/* Info */}
      <div className="flex-1 py-4 px-1 min-w-0">
        <div className="flex items-start gap-2 mb-1">
          <span
            className="mt-0.5 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full flex-none"
            style={{
              color: row.churchBrandColour,
              backgroundColor: row.churchBrandColour + "22",
            }}
          >
            {row.churchName}
          </span>
          {row.isFirstTimer && (
            <span className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-400/10 border border-amber-400/20 px-1.5 py-0.5 rounded-full flex-none">
              First timer
            </span>
          )}
        </div>

        <p className="font-bold text-white text-sm leading-snug line-clamp-1">
          {row.eventTitle}
        </p>

        <div className="flex items-center gap-2 mt-1 text-xs text-white/40 flex-wrap">
          <span>{formatDate(new Date(row.eventStartsAt))}</span>
          {row.eventLocation && (
            <>
              <span className="text-white/15">·</span>
              <span className="truncate max-w-[180px]">{row.eventLocation}</span>
            </>
          )}
          <span className="text-white/15">·</span>
          <span>{CATEGORY_LABELS[row.eventCategory] ?? "Event"}</span>
        </div>
      </div>

      {/* Right actions */}
      <div className="flex-none flex flex-col items-end justify-center gap-2 pr-4 py-4">
        {/* Status badge */}
        {isCancelled ? (
          <span className="text-xs font-semibold text-red-400 bg-red-400/10 border border-red-400/20 px-2 py-1 rounded-full">
            Cancelled
          </span>
        ) : isCheckedIn ? (
          <span className="text-xs font-semibold text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2 py-1 rounded-full flex items-center gap-1">
            <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
              <path d="M2 6l2.5 2.5L10 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Attended
          </span>
        ) : isPast ? (
          <span className="text-xs text-white/20 font-medium">Not checked in</span>
        ) : (
          <span className="text-xs font-semibold text-indigo-400 bg-indigo-400/10 border border-indigo-400/20 px-2 py-1 rounded-full">
            Confirmed
          </span>
        )}

        <div className="flex items-center gap-2">
          {/* QR button — only show for upcoming non-cancelled */}
          {!isCancelled && !isPast && row.qrDataUrl && (
            <button
              onClick={onShowQr}
              title="Show QR ticket"
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" />
                <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" />
                <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" />
                <path d="M14 14h2v2h-2zM18 14h3M14 18h2M18 18h3v3M20 14v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          )}

          {/* Event detail link */}
          <Link
            href={`/${row.churchSlug}/events/${row.eventId}`}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-colors"
            title="View event"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
              <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>

          {/* Remove RSVP — upcoming non-cancelled only */}
          {!isCancelled && !isPast && (
            confirmCancel ? (
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-white/40">Remove?</span>
                <button
                  onClick={() => { onCancel(); setConfirmCancel(false); }}
                  className="text-xs font-bold text-red-400 hover:text-red-300 transition-colors px-2 py-1 rounded-lg bg-red-400/10 hover:bg-red-400/20"
                >
                  Yes
                </button>
                <button
                  onClick={() => setConfirmCancel(false)}
                  className="text-xs text-white/30 hover:text-white/60 transition-colors"
                >
                  No
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmCancel(true)}
                title="Remove RSVP"
                className="p-1.5 rounded-lg bg-white/5 hover:bg-red-500/20 text-white/25 hover:text-red-400 transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <path d="M3 6h18M8 6V4h8v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────── QR Modal ─────────────────────────────── */

function QrModal({ row, onClose }: { row: MyEventRow; onClose: () => void }) {
  const [month, day] = formatShortDate(new Date(row.eventStartsAt)).split(" ");

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xs bg-[#1a1a1a] border border-white/10 rounded-3xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Coloured top strip */}
        <div className="h-1.5 w-full" style={{ backgroundColor: row.churchBrandColour }} />

        <div className="p-6 flex flex-col items-center gap-4">
          {/* Church + event */}
          <div className="text-center">
            <p
              className="text-xs font-bold uppercase tracking-widest mb-1"
              style={{ color: row.churchBrandColour }}
            >
              {row.churchName}
            </p>
            <h2 className="text-lg font-extrabold text-white leading-snug">
              {row.eventTitle}
            </h2>
            <p className="text-sm text-white/40 mt-1">
              {month} {day} · {row.eventLocation ?? ""}
            </p>
          </div>

          {/* QR code */}
          {row.qrDataUrl ? (
            <div className="p-3 bg-white rounded-2xl shadow-lg">
              <Image
                src={row.qrDataUrl}
                alt="Check-in QR"
                width={180}
                height={180}
                unoptimized
                className="block rounded-lg"
              />
            </div>
          ) : (
            <div className="w-44 h-44 bg-white/5 rounded-2xl flex items-center justify-center">
              <p className="text-xs text-white/30">QR unavailable</p>
            </div>
          )}

          <p className="text-xs text-white/30 text-center">
            Show this at the door to check in instantly
          </p>

          {/* Wallet buttons */}
          <div className="flex flex-col gap-2 w-full">
            {row.appleWalletUrl && (
              <a
                href={row.appleWalletUrl}
                download={`${row.eventTitle.replace(/\s+/g, "-").toLowerCase()}.pkpass`}
                className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-black text-white text-sm font-semibold border border-white/10 hover:bg-white/10 transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                </svg>
                Add to Apple Wallet
              </a>
            )}
            {row.googleWalletUrl && (
              <a
                href={row.googleWalletUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-[#4285F4] text-white text-sm font-semibold hover:bg-[#3b78e7] transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z" />
                </svg>
                Save to Google Wallet
              </a>
            )}
            {/* Fallback check-in link */}
            {row.checkInPageUrl && (
              <a
                href={row.checkInPageUrl}
                className="text-sm font-semibold px-4 py-2 rounded-xl border transition-colors text-center w-full"
                style={{ color: row.churchBrandColour, borderColor: row.churchBrandColour + "40" }}
              >
                Open check-in page →
              </a>
            )}
          </div>

          {/* Ref */}
          <p className="text-[10px] text-white/20 font-mono tracking-widest">
            REF: {row.walletPassToken.slice(-8).toUpperCase()}
          </p>

          <button
            onClick={onClose}
            className="text-sm text-white/30 hover:text-white/60 transition-colors"
          >
            Close
          </button>
        </div>

        <div className="h-1 w-full opacity-30" style={{ backgroundColor: row.churchBrandColour }} />
      </div>
    </div>
  );
}

/* ─────────────────────────────── Empty state ─────────────────────────────── */

function EmptyState({ tab }: { tab: Tab }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center border border-white/5 rounded-2xl">
      <div className="w-16 h-16 rounded-full bg-[#1a1a1a] border border-white/5 flex items-center justify-center mb-4">
        {tab === "upcoming" ? (
          <svg className="w-7 h-7 text-white/20" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" />
            <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        ) : (
          <svg className="w-7 h-7 text-white/20" viewBox="0 0 24 24" fill="none">
            <path d="M9 12l2 2 4-4M12 3a9 9 0 100 18A9 9 0 0012 3z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>
      <p className="text-white/40 font-medium">
        {tab === "upcoming" ? "No upcoming events" : "No past events"}
      </p>
      <p className="text-white/20 text-sm mt-1">
        {tab === "upcoming"
          ? "Browse events and RSVP to see them here"
          : "Events you've attended will appear here"}
      </p>
      {tab === "upcoming" && (
        <Link
          href="/"
          className="mt-5 text-sm font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          Browse events →
        </Link>
      )}
    </div>
  );
}
