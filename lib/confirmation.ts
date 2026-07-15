import { randomBytes } from "crypto";

// No 0/O/1/I to keep confirmation numbers easy to read over the phone.
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** Unpredictable, human-friendly confirmation number, e.g. "SCA-7GQ2M9KX". */
export function generateConfirmationNumber(): string {
  const bytes = randomBytes(8);
  let code = "";
  for (let i = 0; i < 8; i++) code += ALPHABET[bytes[i] % ALPHABET.length];
  return `SCA-${code}`;
}

export function isValidConfirmationNumber(value: string): boolean {
  return /^SCA-[A-Z2-9]{8}$/.test(value.toUpperCase());
}
