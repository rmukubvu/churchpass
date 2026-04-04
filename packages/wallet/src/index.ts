export type WalletPassOptions = {
  eventTitle: string;
  eventLocation: string;
  startsAt: Date;
  churchName: string;
  churchLogoUrl?: string;
  /** NFC/QR token embedded in the pass */
  passToken: string;
};

export type GeneratedPass = {
  applePassUrl: string;
  googlePassUrl: string;
};

/**
 * Stub — real implementation requires Apple WWDR certificate
 * and Google Wallet API credentials, configured via env vars.
 */
export async function generateWalletPass(
  _options: WalletPassOptions
): Promise<GeneratedPass> {
  throw new Error(
    "Wallet pass generation requires APPLE_PASS_CERT and GOOGLE_WALLET_CREDENTIALS env vars. See DESIGN.md."
  );
}
