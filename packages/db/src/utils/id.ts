import { randomBytes } from "crypto";

/** Generate a URL-safe random ID (similar to cuid2 but no dep) */
export function createId(): string {
  return randomBytes(16).toString("base64url");
}
