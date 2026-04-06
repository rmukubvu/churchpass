import sgMail from "@sendgrid/mail";
import {
  buildRsvpConfirmationEmail,
  type RsvpConfirmationData,
  type RsvpEventSummary,
} from "./email-templates/rsvp-confirmation";
import { generateQrDataUrl, checkInUrl } from "./qrcode";

const apiKey = process.env.SENDGRID_API_KEY;
const fromEmail = process.env.SENDGRID_FROM_EMAIL ?? "dotnotreply@churchpass.events";

if (apiKey) {
  sgMail.setApiKey(apiKey);
}

/**
 * Generate QR codes and attach them as CID inline images.
 * Returns enriched events + the attachment list for SendGrid.
 */
async function withQrAttachments(
  events: RsvpConfirmationData["events"],
  tokens: (string | null)[]
): Promise<{
  events: RsvpEventSummary[];
  attachments: NonNullable<sgMail.MailDataRequired["attachments"]>;
}> {
  const attachments: NonNullable<sgMail.MailDataRequired["attachments"]> = [];
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

      attachments.push({
        content: base64,
        type: "image/png",
        filename: `qr-${i}.png`,
        disposition: "inline",
        contentId: cid,
      });

      enriched.push({ ...event, qrCid: cid, checkInUrl: url });
    } catch {
      enriched.push(event);
    }
  }

  return { events: enriched, attachments };
}

export async function sendRsvpConfirmation(
  data: RsvpConfirmationData & { walletPassTokens?: (string | null)[] }
): Promise<void> {
  const tokens = data.walletPassTokens ?? data.events.map(() => null);
  const { events: enrichedEvents, attachments } = await withQrAttachments(data.events, tokens);

  const enrichedData: RsvpConfirmationData = { ...data, events: enrichedEvents };

  if (!apiKey) {
    const { subject, text } = buildRsvpConfirmationEmail(enrichedData);
    console.log("[sendgrid] No API key — skipping email send");
    console.log("[sendgrid] To:", data.email);
    console.log("[sendgrid] Subject:", subject);
    console.log("[sendgrid] Body preview:\n", text.slice(0, 400));
    return;
  }

  const { subject, html, text } = buildRsvpConfirmationEmail(enrichedData);

  await sgMail.send({
    to: data.email,
    from: { email: fromEmail, name: "Church Pass" },
    subject,
    html,
    text,
    ...(attachments.length > 0 && { attachments }),
  } as sgMail.MailDataRequired);
}
