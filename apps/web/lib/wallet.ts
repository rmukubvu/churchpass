/**
 * Wallet pass generation
 *
 * Apple Wallet (.pkpass) — requires:
 *   APPLE_PASS_TEAM_ID         e.g. "ABCDE12345"
 *   APPLE_PASS_TYPE_ID         e.g. "pass.com.sanctuary.event"
 *   APPLE_PASS_CERT_BASE64     PEM certificate (base64-encoded)
 *   APPLE_PASS_KEY_BASE64      Private key (base64-encoded)
 *   APPLE_PASS_WWDR_BASE64     Apple WWDR cert (base64-encoded)
 *
 * Google Wallet — requires:
 *   GOOGLE_WALLET_CREDENTIALS  JSON service-account key (stringified)
 *   GOOGLE_WALLET_ISSUER_ID    e.g. "3388000000012345678"
 */

import jwt from "jsonwebtoken";

export interface WalletPassInput {
  rsvpId: string;
  walletPassToken: string;
  eventTitle: string;
  eventLocation: string;
  startsAt: Date;
  endsAt: Date | null;
  churchName: string;
  checkInUrl: string;
  appUrl: string;
}

export interface WalletLinks {
  apple: string | null;
  google: string | null;
}

/* ─────────────────────────── Google Wallet ─────────────────────────── */

export function buildGoogleWalletLink(input: WalletPassInput): string | null {
  const credsRaw = process.env.GOOGLE_WALLET_CREDENTIALS;
  const issuerId = process.env.GOOGLE_WALLET_ISSUER_ID;

  if (!credsRaw || !issuerId) return null;

  let creds: { client_email: string; private_key: string };
  try {
    creds = JSON.parse(credsRaw);
  } catch {
    console.error("[wallet] Invalid GOOGLE_WALLET_CREDENTIALS JSON");
    return null;
  }

  const classId = `${issuerId}.sanctuary_event`;
  const objectId = `${issuerId}.rsvp_${input.rsvpId.replace(/[^a-zA-Z0-9_-]/g, "_")}`;

  const now = Math.floor(Date.now() / 1000);

  const passObject = {
    id: objectId,
    classId,
    genericType: "GENERIC_TYPE_UNSPECIFIED",
    hexBackgroundColor: "#1a1a1a",
    logo: {
      sourceUri: {
        uri: `${input.appUrl}/icon.png`,
      },
    },
    cardTitle: {
      defaultValue: { language: "en-US", value: input.churchName },
    },
    subheader: {
      defaultValue: { language: "en-US", value: "Event Ticket" },
    },
    header: {
      defaultValue: { language: "en-US", value: input.eventTitle },
    },
    textModulesData: [
      {
        id: "date",
        header: "Date",
        body: new Intl.DateTimeFormat("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
          timeZone: "UTC",
        }).format(input.startsAt),
      },
      {
        id: "location",
        header: "Location",
        body: input.eventLocation || "See event page",
      },
    ],
    barcode: {
      type: "QR_CODE",
      value: input.checkInUrl,
      alternateText: input.walletPassToken.slice(-8).toUpperCase(),
    },
    state: "ACTIVE",
    validTimeInterval: {
      start: { date: input.startsAt.toISOString() },
      ...(input.endsAt ? { end: { date: input.endsAt.toISOString() } } : {}),
    },
  };

  const payload = {
    iss: creds.client_email,
    aud: "google",
    origins: [input.appUrl],
    typ: "savetowallet",
    iat: now,
    payload: {
      genericObjects: [passObject],
    },
  };

  try {
    const token = jwt.sign(payload, creds.private_key, { algorithm: "RS256" });
    return `https://pay.google.com/gp/v/save/${token}`;
  } catch (err) {
    console.error("[wallet] Google Wallet JWT sign error:", err);
    return null;
  }
}

/* ─────────────────────────── Apple Wallet ─────────────────────────── */

export async function buildAppleWalletPassUrl(input: WalletPassInput): Promise<string | null> {
  const teamId = process.env.APPLE_PASS_TEAM_ID;
  const passTypeId = process.env.APPLE_PASS_TYPE_ID;
  const certB64 = process.env.APPLE_PASS_CERT_BASE64;
  const keyB64 = process.env.APPLE_PASS_KEY_BASE64;
  const wwdrB64 = process.env.APPLE_PASS_WWDR_BASE64;

  if (!teamId || !passTypeId || !certB64 || !keyB64 || !wwdrB64) return null;

  try {
    const { PKPass } = await import("passkit-generator");

    const pass = new PKPass({}, {
      wwdr: Buffer.from(wwdrB64, "base64").toString("utf-8"),
      signerCert: Buffer.from(certB64, "base64").toString("utf-8"),
      signerKey: Buffer.from(keyB64, "base64").toString("utf-8"),
    }, {
      serialNumber: input.walletPassToken,
      passTypeIdentifier: passTypeId,
      teamIdentifier: teamId,
      organizationName: input.churchName,
      description: input.eventTitle,
      foregroundColor: "rgb(255,255,255)",
      backgroundColor: "rgb(26,26,26)",
      labelColor: "rgb(99,102,241)",
    });

    // Generic pass layout
    pass.type = "generic";
    pass.primaryFields.push({
      key: "event",
      label: "EVENT",
      value: input.eventTitle,
    });
    pass.secondaryFields.push(
      {
        key: "church",
        label: "HOSTED BY",
        value: input.churchName,
      },
      {
        key: "date",
        label: "DATE",
        value: new Intl.DateTimeFormat("en-US", {
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
          timeZone: "UTC",
        }).format(input.startsAt),
      }
    );
    if (input.eventLocation) {
      pass.auxiliaryFields.push({
        key: "location",
        label: "LOCATION",
        value: input.eventLocation,
      });
    }

    // QR barcode
    pass.setBarcodes({
      format: "PKBarcodeFormatQR",
      message: input.checkInUrl,
      messageEncoding: "iso-8859-1",
    });

    const buffer = await pass.getAsBuffer();

    // Serve the .pkpass via a signed URL — for now return a data URL
    // In production, upload to R2/S3 and return the object URL
    const base64 = buffer.toString("base64");
    return `data:application/vnd.apple.pkpass;base64,${base64}`;
  } catch (err) {
    console.error("[wallet] Apple Wallet generation error:", err);
    return null;
  }
}

/* ─────────────────────────── Combined helper ─────────────────────────── */

export async function buildWalletLinks(input: WalletPassInput): Promise<WalletLinks> {
  const [apple, google] = await Promise.all([
    buildAppleWalletPassUrl(input).catch(() => null),
    Promise.resolve(buildGoogleWalletLink(input)),
  ]);
  return { apple, google };
}
