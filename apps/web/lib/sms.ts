import twilio from "twilio";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_PHONE_NUMBER;
const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

const client = accountSid && authToken ? twilio(accountSid, authToken) : null;

export interface SmsRsvpData {
  toPhone: string;
  firstName: string;
  churchName: string;
  events: {
    title: string;
    startsAt: Date;
    checkInUrl?: string;
  }[];
}

function formatSmsDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(date);
}

export async function sendRsvpSms(data: SmsRsvpData): Promise<void> {
  if (!client || !fromNumber) {
    console.log("[twilio] No credentials — skipping SMS");
    console.log("[twilio] Would send to:", data.toPhone);
    return;
  }

  if (!data.toPhone) return;

  const isSingle = data.events.length === 1;
  const eventLines = data.events
    .map((e) => `• ${e.title} — ${formatSmsDate(e.startsAt)}`)
    .join("\n");

  const checkInLine =
    data.events.length === 1 && data.events[0]!.checkInUrl
      ? `\n\nYour QR check-in: ${data.events[0]!.checkInUrl}`
      : `\n\nYour tickets: ${appUrl}/my-events`;

  const body = [
    `Hi ${data.firstName}! You're confirmed for ${isSingle ? data.events[0]!.title : `${data.events.length} events`} at ${data.churchName} 🎉`,
    "",
    eventLines,
    checkInLine,
  ].join("\n");

  await client.messages.create({
    body,
    from: fromNumber,
    to: data.toPhone,
  });
}
