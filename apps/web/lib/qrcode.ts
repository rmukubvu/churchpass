import QRCode from "qrcode";

/**
 * Generate a QR code as a base64 PNG data URL.
 * Safe to call server-side (Node.js only).
 */
export async function generateQrDataUrl(text: string): Promise<string> {
  return QRCode.toDataURL(text, {
    errorCorrectionLevel: "M",
    margin: 2,
    width: 300,
    color: {
      dark: "#000000",
      light: "#ffffff",
    },
  });
}

/**
 * Build the attendee check-in URL from a walletPassToken.
 */
export function checkInUrl(token: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return `${base}/check-in/${token}`;
}
