import {
  buildRsvpConfirmationEmail,
  type RsvpConfirmationData,
  type RsvpEventSummary,
} from "./email-templates/rsvp-confirmation";
import { buildOtpEmail } from "./email-templates/otp-verification";
import { generateQrDataUrl, checkInUrl } from "./qrcode";

const apiKey = process.env.ZEPTOMAIL_TOKEN;
const apiUrl = process.env.ZEPTOMAIL_API_URL ?? "https://api.zeptomail.com/v1.1/email";
const fromEmail = process.env.ZEPTOMAIL_FROM_EMAIL ?? "noreply@churchpass.events";

interface ZeptoMailInlineImage {
  content: string;
  mime_type: string;
  cid: string;
}

/**
 * Generate QR codes and attach them as CID inline images.
 * Returns enriched events + the inline_images list for ZeptoMail.
 */
async function withQrInlineImages(
  events: RsvpConfirmationData["events"],
  tokens: (string | null)[]
): Promise<{
  events: RsvpEventSummary[];
  inlineImages: ZeptoMailInlineImage[];
}> {
  const inlineImages: ZeptoMailInlineImage[] = [];
  const enriched: RsvpEventSummary[] = [];

  for (let i = 0; i < events.length; i++) {
    const event = events[i]!;
    const token = tokens[i] ?? null;

    if (!token) {
      enriched.push(event);
      continue;
    }

    try {
      const url = checkInUrl(token);
      const dataUrl = await generateQrDataUrl(url);
      // Strip the "data:image/png;base64," prefix to get raw base64
      const base64 = dataUrl.replace(/^data:image\/png;base64,/, "");
      const cid = `qr_${i}_${token.slice(0, 8)}@churchpass`;

      inlineImages.push({
        content: base64,
        mime_type: "image/png",
        cid: cid,
      });

      enriched.push({ ...event, qrCid: cid, checkInUrl: url });
    } catch {
      enriched.push(event);
    }
  }

  return { events: enriched, inlineImages };
}

export async function sendRsvpConfirmation(
  data: RsvpConfirmationData & { walletPassTokens?: (string | null)[] }
): Promise<void> {
  const tokens = data.walletPassTokens ?? data.events.map(() => null);
  const { events: enrichedEvents, inlineImages } = await withQrInlineImages(data.events, tokens);

  const enrichedData: RsvpConfirmationData = { ...data, events: enrichedEvents };
  const { subject, html, text } = buildRsvpConfirmationEmail(enrichedData);

  if (!apiKey) {
    console.log("[zeptomail] No API token — skipping email send");
    console.log("[zeptomail] To:", data.email);
    console.log("[zeptomail] Subject:", subject);
    console.log("[zeptomail] Body preview:\n", text.slice(0, 400));
    return;
  }

  try {
    const payload = {
      from: {
        address: fromEmail,
        name: "Church Pass",
      },
      to: [
        {
          email_address: {
            address: data.email,
            name: data.firstName,
          },
        },
      ],
      subject,
      htmlbody: html,
      textbody: text,
      ...(inlineImages.length > 0 && { inline_images: inlineImages }),
    };

    const res = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: apiKey,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("[zeptomail] Send failed:", res.status, errText);
    } else {
      console.log("[zeptomail] Email successfully sent to", data.email);
    }
  } catch (err) {
    console.error("[zeptomail] Send failed due to network error:", err);
  }
}

export async function sendOtpEmail(email: string, code: string): Promise<void> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const { subject, html, text } = buildOtpEmail({ email, code, appUrl });

  if (!apiKey) {
    console.log("[zeptomail] No API token — skipping OTP email send");
    console.log("[zeptomail] To:", email);
    console.log("[zeptomail] Subject:", subject);
    console.log("[zeptomail] Body preview:\n", text.slice(0, 400));
    return;
  }

  try {
    const payload = {
      from: {
        address: fromEmail,
        name: "Church Pass",
      },
      to: [
        {
          email_address: {
            address: email,
            name: email.split("@")[0] || "User",
          },
        },
      ],
      subject,
      htmlbody: html,
      textbody: text,
    };

    const res = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: apiKey,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("[zeptomail] Send OTP failed:", res.status, errText);
    } else {
      console.log("[zeptomail] OTP Email successfully sent to", email);
    }
  } catch (err) {
    console.error("[zeptomail] Send OTP failed due to network error:", err);
  }
}
