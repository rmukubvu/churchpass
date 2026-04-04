import { auth } from "@clerk/nextjs/server";
import { db } from "@/server/db";
import { rsvps, attendees } from "@sanctuary/db";
import { eq, and } from "drizzle-orm";
import { generateQrDataUrl, checkInUrl } from "@/lib/qrcode";
import Image from "next/image";

type Props = {
  eventId: string;
  brandColour: string;
};

export async function MyTicket({ eventId, brandColour }: Props) {
  const { userId } = await auth();
  if (!userId) return null;

  try {
    // Find the attendee record for this Clerk user (any church)
    const [attendee] = await db
      .select({ id: attendees.id })
      .from(attendees)
      .where(eq(attendees.clerkUserId, userId))
      .limit(1);

    if (!attendee) return null;

    // Find their RSVP for this event
    const [rsvp] = await db
      .select({ id: rsvps.id, walletPassToken: rsvps.walletPassToken, status: rsvps.status })
      .from(rsvps)
      .where(and(eq(rsvps.eventId, eventId), eq(rsvps.attendeeId, attendee.id)))
      .limit(1);

    if (!rsvp || rsvp.status === "cancelled") return null;

    const url = checkInUrl(rsvp.walletPassToken);
    const qrDataUrl = await generateQrDataUrl(url);

    const isAttended = rsvp.status === "attended";

    return (
      <div className="mt-6 pt-5 border-t border-white/5">
        <p className="text-[10px] font-bold uppercase tracking-wider text-white/30 mb-3 text-center">
          Your ticket
        </p>

        <div className="flex flex-col items-center gap-3">
          {/* QR code */}
          <div className="relative">
            <div className="p-2.5 bg-white rounded-2xl shadow-lg shadow-black/40">
              <Image
                src={qrDataUrl}
                alt="Check-in QR code"
                width={140}
                height={140}
                className="block rounded-lg"
                unoptimized
              />
            </div>
            {isAttended && (
              <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/60 backdrop-blur-sm">
                <div className="flex flex-col items-center gap-1">
                  <svg className="w-8 h-8 text-emerald-400" viewBox="0 0 24 24" fill="none">
                    <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span className="text-xs font-bold text-emerald-400">Checked in</span>
                </div>
              </div>
            )}
          </div>

          <p className="text-xs text-white/30 text-center leading-relaxed">
            {isAttended
              ? "You're checked in 🎉"
              : "Show this QR at the door"}
          </p>

          {/* Check-in link (fallback for manual scan) */}
          <a
            href={url}
            className="text-[11px] font-semibold px-3 py-1.5 rounded-lg border transition-colors"
            style={{ color: brandColour, borderColor: `${brandColour}40` }}
          >
            Open check-in page →
          </a>
        </div>
      </div>
    );
  } catch {
    return null;
  }
}
