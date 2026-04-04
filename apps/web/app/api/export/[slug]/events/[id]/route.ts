import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { churches, events, rsvps, attendees, checkins } from "@sanctuary/db";
import { eq, and } from "drizzle-orm";
import { isChurchAdmin } from "@/lib/auth/isChurchAdmin";

type Params = { params: Promise<{ slug: string; id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug, id: eventId } = await params;

  if (!(await isChurchAdmin(slug))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Verify church + event exist
  const [church] = await db
    .select({ id: churches.id, name: churches.name })
    .from(churches)
    .where(eq(churches.slug, slug))
    .limit(1);

  if (!church) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [event] = await db
    .select({ id: events.id, title: events.title, startsAt: events.startsAt })
    .from(events)
    .where(and(eq(events.id, eventId), eq(events.churchId, church.id)))
    .limit(1);

  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Fetch guest list
  const rows = await db
    .select({
      firstName: attendees.firstName,
      lastName: attendees.lastName,
      email: attendees.email,
      phone: attendees.phone,
      rsvpStatus: rsvps.status,
      isFirstTimer: rsvps.isFirstTimer,
      rsvpCreatedAt: rsvps.createdAt,
      checkedInAt: checkins.checkedInAt,
      checkinMethod: checkins.method,
    })
    .from(rsvps)
    .innerJoin(attendees, eq(rsvps.attendeeId, attendees.id))
    .leftJoin(
      checkins,
      and(eq(checkins.rsvpId, rsvps.id), eq(checkins.eventId, eventId))
    )
    .where(eq(rsvps.eventId, eventId))
    .orderBy(rsvps.createdAt);

  // Build CSV
  const csvHeaders = [
    "First Name",
    "Last Name",
    "Email",
    "Phone",
    "RSVP Status",
    "First Timer",
    "RSVP Date",
    "Checked In",
    "Check-in Time",
    "Check-in Method",
  ];

  function escape(val: string | null | undefined): string {
    if (val === null || val === undefined) return "";
    const str = String(val);
    // Wrap in quotes if it contains comma, quote, or newline
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }

  const csvRows = rows.map((r) =>
    [
      escape(r.firstName),
      escape(r.lastName),
      escape(r.email),
      escape(r.phone),
      escape(r.rsvpStatus),
      r.isFirstTimer ? "Yes" : "No",
      escape(r.rsvpCreatedAt?.toISOString() ?? ""),
      r.checkedInAt ? "Yes" : "No",
      escape(r.checkedInAt?.toISOString() ?? ""),
      escape(r.checkinMethod),
    ].join(",")
  );

  const csv = [csvHeaders.join(","), ...csvRows].join("\n");

  // Sanitise filename
  const safeTitle = event.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
  const dateStr = event.startsAt.toISOString().slice(0, 10);
  const filename = `${safeTitle}-${dateStr}-attendees.csv`;

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
