export interface RsvpEventSummary {
  id: string;
  title: string;
  startsAt: Date;
  endsAt: Date | null;
  location: string | null;
  bannerUrl: string | null;
  /** base64 PNG data URL of the QR code (data:image/png;base64,...) */
  qrDataUrl?: string;
  /** The check-in URL encoded in the QR */
  checkInUrl?: string;
  /** CID used for inline attachment (populated by sendgrid.ts) */
  qrCid?: string;
  /** Attendance conditions — newline-separated list */
  conditions?: string | null;
}

export interface RsvpConfirmationData {
  firstName: string;
  email: string;
  churchName: string;
  churchSlug: string;
  events: RsvpEventSummary[];
  appUrl: string;
}

function formatEventDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(date);
}

function formatGoogleCalendarDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

function googleCalendarLink(event: RsvpEventSummary, churchName: string, appUrl: string): string {
  const start = formatGoogleCalendarDate(event.startsAt);
  const end = event.endsAt
    ? formatGoogleCalendarDate(event.endsAt)
    : formatGoogleCalendarDate(new Date(event.startsAt.getTime() + 2 * 60 * 60 * 1000));

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `${event.title} — ${churchName}`,
    dates: `${start}/${end}`,
    details: `RSVP confirmed via Church Pass\n${appUrl}/${churchName.toLowerCase().replace(/\s+/g, "-")}/events/${event.id}`,
    location: event.location ?? "",
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function eventCard(event: RsvpEventSummary, churchName: string, appUrl: string): string {
  const calLink = googleCalendarLink(event, churchName, appUrl);
  const eventUrl = `${appUrl}/${churchName.toLowerCase().replace(/\s+/g, "-")}/events/${event.id}`;

  // QR image: use CID if available (inline attachment), fall back to nothing
  const qrBlock = event.qrCid
    ? `
      <table cellpadding="0" cellspacing="0" width="100%" style="margin-top:20px;border-top:1px dashed #333;padding-top:20px;">
        <tr>
          <td align="center">
            <p style="margin:0 0 12px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#6b7280;">
              Your check-in pass
            </p>
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="background:#ffffff;border-radius:12px;padding:10px;line-height:0;">
                  <a href="${event.checkInUrl ?? eventUrl}">
                    <img
                      src="cid:${event.qrCid}"
                      alt="Check-in QR code"
                      width="160"
                      height="160"
                      style="display:block;width:160px;height:160px;"
                    />
                  </a>
                </td>
              </tr>
            </table>
            <p style="margin:10px 0 0;font-size:12px;color:#6b7280;">
              Scan this QR code at the door to check in instantly
            </p>
          </td>
        </tr>
      </table>`
    : "";

  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
      <tr>
        <td style="background:#111111;border-radius:12px;border:1px solid #2a2a2a;overflow:hidden;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <!-- Indigo top accent bar -->
            <tr>
              <td style="background:#4f46e5;height:4px;font-size:0;line-height:0;">&nbsp;</td>
            </tr>
            <tr>
              <td style="padding:20px 24px 24px;">
                <p style="margin:0 0 4px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#6366f1;">
                  ${churchName}
                </p>
                <h3 style="margin:0 0 14px;font-size:20px;font-weight:700;color:#ffffff;line-height:1.3;">
                  ${event.title}
                </h3>

                <!-- Date row -->
                <table cellpadding="0" cellspacing="0" style="margin-bottom:6px;">
                  <tr>
                    <td style="width:20px;vertical-align:top;padding-top:1px;font-size:14px;">📅</td>
                    <td style="font-size:14px;color:#9ca3af;line-height:1.5;">
                      ${formatEventDate(event.startsAt)}
                    </td>
                  </tr>
                </table>

                ${event.location ? `
                <!-- Location row -->
                <table cellpadding="0" cellspacing="0" style="margin-bottom:6px;">
                  <tr>
                    <td style="width:20px;vertical-align:top;padding-top:1px;font-size:14px;">📍</td>
                    <td style="font-size:14px;color:#9ca3af;line-height:1.5;">
                      ${event.location}
                    </td>
                  </tr>
                </table>` : ""}

                ${event.conditions ? `
                <!-- Attendance conditions -->
                <table cellpadding="0" cellspacing="0" width="100%" style="margin-top:16px;">
                  <tr>
                    <td style="background:#1a1a2e;border-radius:10px;border:1px solid #2e2e4a;padding:14px 16px;">
                      <p style="margin:0 0 10px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#6366f1;">
                        ⚠️ Attendance conditions
                      </p>
                      ${event.conditions.split("\n").filter((l: string) => l.trim()).map((line: string) => `
                      <table cellpadding="0" cellspacing="0" style="margin-bottom:6px;">
                        <tr>
                          <td style="width:16px;vertical-align:top;padding-top:5px;">
                            <div style="width:5px;height:5px;border-radius:50%;background:#6366f1;"></div>
                          </td>
                          <td style="font-size:13px;color:#d1d5db;line-height:1.5;">${line.trim()}</td>
                        </tr>
                      </table>`).join("")}
                    </td>
                  </tr>
                </table>` : ""}

                <!-- CTAs -->
                <table cellpadding="0" cellspacing="0" style="margin-top:18px;">
                  <tr>
                    <td style="padding-right:10px;">
                      <a href="${eventUrl}" style="display:inline-block;background:#4f46e5;color:#ffffff;font-size:13px;font-weight:600;padding:10px 20px;border-radius:8px;text-decoration:none;">
                        View event →
                      </a>
                    </td>
                    <td>
                      <a href="${calLink}" style="display:inline-block;background:#1e1e2e;color:#a5b4fc;font-size:13px;font-weight:600;padding:10px 20px;border-radius:8px;text-decoration:none;border:1px solid #3730a3;">
                        + Add to calendar
                      </a>
                    </td>
                  </tr>
                </table>

                ${qrBlock}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;
}

export function buildRsvpConfirmationEmail(data: RsvpConfirmationData): {
  subject: string;
  html: string;
  text: string;
} {
  const { firstName, churchName, events, appUrl } = data;
  const isSingle = events.length === 1;
  const subject = isSingle
    ? `You're in! Your pass for ${events[0]!.title}`
    : `You're in! ${events.length} passes confirmed at ${churchName}`;

  const eventCards = events.map((e) => eventCard(e, churchName, appUrl)).join("");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background-color:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0a;padding:48px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom:36px;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:#4f46e5;border-radius:8px;width:32px;height:32px;text-align:center;vertical-align:middle;">
                    <span style="color:#ffffff;font-size:18px;font-weight:900;line-height:32px;display:inline-block;">✦</span>
                  </td>
                  <td style="padding-left:10px;vertical-align:middle;">
                    <span style="font-size:22px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">Church Pass</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Hero card -->
          <tr>
            <td style="background:#161616;border-radius:20px;border:1px solid #2a2a2a;overflow:hidden;">
              <table width="100%" cellpadding="0" cellspacing="0">

                <!-- Green success bar at top -->
                <tr>
                  <td style="background:#16a34a;height:5px;font-size:0;line-height:0;">&nbsp;</td>
                </tr>

                <tr>
                  <td style="padding:40px 40px 36px;" align="center">

                    <!-- Checkmark circle (table-based for Gmail) -->
                    <table cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                      <tr>
                        <td align="center" style="width:72px;height:72px;background:#052e16;border-radius:50%;border:2px solid #16a34a;text-align:center;vertical-align:middle;">
                          <span style="font-size:32px;color:#22c55e;line-height:72px;display:inline-block;">✓</span>
                        </td>
                      </tr>
                    </table>

                    <!-- Heading -->
                    <h1 style="margin:0 0 10px;font-size:28px;font-weight:800;color:#ffffff;line-height:1.2;">
                      You're confirmed!
                    </h1>
                    <p style="margin:0 0 36px;font-size:16px;color:#9ca3af;line-height:1.6;">
                      Hi <strong style="color:#ffffff;">${firstName}</strong>, your ${isSingle ? "RSVP is" : `${events.length} RSVPs are`} confirmed for <strong style="color:#a5b4fc;">${churchName}</strong>.
                    </p>

                    <!-- Event cards -->
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="left">
                          ${eventCards}
                        </td>
                      </tr>
                    </table>

                    <!-- Divider -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0 24px;">
                      <tr>
                        <td style="border-top:1px solid #2a2a2a;font-size:0;line-height:0;">&nbsp;</td>
                      </tr>
                    </table>

                    <!-- Footer note -->
                    <p style="margin:0;font-size:13px;color:#6b7280;line-height:1.7;">
                      Your spot${isSingle ? " is" : "s are"} reserved. See you there 🙌<br/>
                      Need help? Reply to this email or contact <a href="mailto:help@churchpass.events" style="color:#6366f1;text-decoration:none;">help@churchpass.events</a>
                    </p>

                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding:28px 0 0;">
              <p style="margin:0;font-size:12px;color:#4b5563;line-height:1.8;">
                Sent by <a href="${appUrl}" style="color:#6366f1;text-decoration:none;">Church Pass</a> on behalf of ${churchName}<br/>
                <a href="mailto:help@churchpass.events" style="color:#4b5563;text-decoration:none;">help@churchpass.events</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();

  const text = [
    `You're confirmed! Hi ${firstName},`,
    "",
    `Your ${isSingle ? "RSVP is" : `${events.length} RSVPs are`} confirmed for ${churchName}.`,
    "",
    ...events.map((e) => [
      `• ${e.title}`,
      `  ${formatEventDate(e.startsAt)}`,
      e.location ? `  ${e.location}` : "",
      e.checkInUrl ? `  Check in: ${e.checkInUrl}` : "",
    ].filter(Boolean).join("\n")),
    "",
    "See you there!",
    "— Church Pass",
    "",
    `Questions? Email help@churchpass.events`,
  ].join("\n");

  return { subject, html, text };
}
