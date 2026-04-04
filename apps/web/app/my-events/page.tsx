import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/server/db";
import { rsvps, attendees, events, churches, checkins } from "@sanctuary/db";
import { eq, and, inArray } from "drizzle-orm";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { MyEventsShell } from "@/components/my-events/MyEventsShell";
import { generateQrDataUrl, checkInUrl } from "@/lib/qrcode";
import { buildWalletLinks } from "@/lib/wallet";

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export default async function MyEventsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in?redirect_url=/my-events");

  let rows: Awaited<ReturnType<typeof fetchMyEvents>> = [];
  try {
    rows = await fetchMyEvents(userId);
  } catch (err) {
    console.error("[my-events] DB error:", err);
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      <SiteHeader />
      <MyEventsShell rows={rows} />
    </div>
  );
}

async function fetchMyEvents(clerkUserId: string) {
  const myAttendees = await db
    .select({ id: attendees.id })
    .from(attendees)
    .where(eq(attendees.clerkUserId, clerkUserId));

  if (!myAttendees.length) return [];

  const attendeeIds = myAttendees.map((a) => a.id);

  const myRsvps = await db
    .select({
      rsvpId: rsvps.id,
      rsvpStatus: rsvps.status,
      rsvpCreatedAt: rsvps.createdAt,
      isFirstTimer: rsvps.isFirstTimer,
      walletPassToken: rsvps.walletPassToken,
      eventId: events.id,
      eventTitle: events.title,
      eventStartsAt: events.startsAt,
      eventEndsAt: events.endsAt,
      eventLocation: events.location,
      eventBannerUrl: events.bannerUrl,
      eventCategory: events.category,
      churchName: churches.name,
      churchSlug: churches.slug,
      churchBrandColour: churches.brandColour,
      checkedInAt: checkins.checkedInAt,
    })
    .from(rsvps)
    .innerJoin(events, eq(rsvps.eventId, events.id))
    .innerJoin(churches, eq(events.churchId, churches.id))
    .leftJoin(checkins, and(eq(checkins.rsvpId, rsvps.id), eq(checkins.eventId, rsvps.eventId)))
    .where(inArray(rsvps.attendeeId, attendeeIds))
    .orderBy(events.startsAt);

  // Generate QR codes + wallet links in parallel per row
  const withExtras = await Promise.all(
    myRsvps.map(async (row) => {
      try {
        const url = checkInUrl(row.walletPassToken);
        const [qrDataUrl, walletLinks] = await Promise.all([
          generateQrDataUrl(url),
          buildWalletLinks({
            rsvpId: row.rsvpId,
            walletPassToken: row.walletPassToken,
            eventTitle: row.eventTitle,
            eventLocation: row.eventLocation ?? "",
            startsAt: row.eventStartsAt,
            endsAt: row.eventEndsAt ?? null,
            churchName: row.churchName,
            checkInUrl: url,
            appUrl,
          }),
        ]);
        return {
          ...row,
          qrDataUrl,
          checkInPageUrl: url,
          appleWalletUrl: walletLinks.apple,
          googleWalletUrl: walletLinks.google,
        };
      } catch {
        return {
          ...row,
          qrDataUrl: null,
          checkInPageUrl: null,
          appleWalletUrl: null,
          googleWalletUrl: null,
        };
      }
    })
  );

  return withExtras;
}

export type MyEventRow = Awaited<ReturnType<typeof fetchMyEvents>>[number];
