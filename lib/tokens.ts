import { createHash, randomBytes, timingSafeEqual } from "crypto";

/**
 * Booking magic-link tokens: the raw token goes in the emailed URL, only its
 * sha256 hash is stored, so a database leak cannot forge manage links.
 */

export function generateManageToken(): { token: string; hash: string } {
  const token = randomBytes(32).toString("base64url");
  return { token, hash: hashToken(token) };
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function tokenMatchesHash(token: string, hash: string): boolean {
  const a = Buffer.from(hashToken(token), "hex");
  const b = Buffer.from(hash, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}

export const MANAGE_TOKEN_TTL_HOURS = 72;
