import "server-only";
import { prisma } from "@/lib/db";
import { generateManageToken, MANAGE_TOKEN_TTL_HOURS } from "@/lib/tokens";

/**
 * Rotate and return a fresh manage token for a booking. Only the hash is
 * stored; the raw token goes into the emailed magic link.
 */
export async function issueManageToken(bookingId: string): Promise<string> {
  const { token, hash } = generateManageToken();
  await prisma.booking.update({
    where: { id: bookingId },
    data: {
      manageTokenHash: hash,
      manageTokenExpiresAt: new Date(Date.now() + MANAGE_TOKEN_TTL_HOURS * 3600_000),
    },
  });
  return token;
}
