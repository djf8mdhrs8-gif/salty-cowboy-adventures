import "server-only";
import { prisma } from "@/lib/db";
import { hashToken } from "@/lib/tokens";
import type { Booking, Customer, TripPackage, Payment } from "@prisma/client";

export type ManagedBooking = Booking & {
  customer: Customer;
  package: TripPackage;
  payments: Payment[];
  addons: Array<{ quantity: number; totalCents: number; addon: { name: string } }>;
};

/**
 * Resolve a manage token to its booking. Tokens are stored hashed and expire;
 * an invalid/expired token resolves to null (no information leak).
 */
export async function bookingFromManageToken(token: string): Promise<ManagedBooking | null> {
  if (!token || token.length < 20 || token.length > 100) return null;
  const booking = await prisma.booking.findFirst({
    where: {
      manageTokenHash: hashToken(token),
      manageTokenExpiresAt: { gt: new Date() },
    },
    include: {
      customer: true,
      package: true,
      payments: { orderBy: { createdAt: "asc" } },
      addons: { include: { addon: { select: { name: true } } } },
    },
  });
  return booking;
}
