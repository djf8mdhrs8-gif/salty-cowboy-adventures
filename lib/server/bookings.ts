import "server-only";
import { prisma } from "@/lib/db";
import type { FishingExperience, Prisma } from "@prisma/client";
import { computePricing, type PricingBreakdown, type PaymentPlan } from "@/lib/pricing";
import { generateConfirmationNumber } from "@/lib/confirmation";
import { generateManageToken, MANAGE_TOKEN_TTL_HOURS } from "@/lib/tokens";
import {
  loadAvailabilityContext,
  slotsForDateFromContext,
} from "@/lib/server/availability-data";
import { getSettings } from "@/lib/server/settings";
import { POLICY_KEYS } from "@/lib/site";

export class SlotUnavailableError extends Error {
  constructor() {
    super("That time slot is no longer available. Please pick another.");
  }
}

/**
 * Stable advisory-lock key for a calendar date. Every booking write for the
 * same date serializes on this lock, which (combined with the re-check inside
 * the transaction) prevents race-condition double bookings even for
 * overlapping-but-not-identical slots. The unique `slotKey` column is a final
 * database-level guard for identical slots.
 */
export function advisoryLockKeyForDate(date: string): bigint {
  let h = 0xcbf29ce484222325n; // FNV-1a 64-bit
  for (const ch of `sca-slot:${date}`) {
    h ^= BigInt(ch.charCodeAt(0));
    h = (h * 0x100000001b3n) & 0xffffffffffffffffn;
  }
  // Postgres advisory locks take a signed bigint.
  return BigInt.asIntN(64, h);
}

export interface GuestDetailsInput {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  adults: number;
  children: number;
  emergencyContactName: string;
  emergencyContactPhone: string;
  specialRequests?: string;
  accessibilityNeeds?: string;
  fishingExperience?: FishingExperience;
}

export interface CreateBookingInput {
  packageId: string;
  date: string;
  startTime: string;
  guest: GuestDetailsInput;
  addonSelections: Array<{ addonId: string; quantity: number }>;
  requestedPlan: PaymentPlan;
  waiver: { ipAddress?: string; userAgent?: string };
  createdByAdmin?: boolean;
}

export interface CreateBookingResult {
  bookingId: string;
  confirmationNumber: string;
  manageToken: string;
  pricing: PricingBreakdown;
  customerId: string;
  customerEmail: string;
  holdExpiresAt: Date;
}

/**
 * Create a booking atomically:
 *  1. take the per-date advisory lock,
 *  2. re-validate the slot against rules/blocks/active bookings,
 *  3. recompute pricing server-side,
 *  4. upsert customer, create booking + guests + addons + waiver acceptance.
 * The booking starts AWAITING_PAYMENT with a hold that expires if checkout
 * is abandoned; the Stripe webhook flips it to CONFIRMED.
 */
export async function createBooking(input: CreateBookingInput): Promise<CreateBookingResult> {
  const settings = await getSettings();

  const pkg = await prisma.tripPackage.findFirst({
    where: { id: input.packageId, active: true },
    include: { addons: true },
  });
  if (!pkg) throw new Error("Trip package not found.");

  // Resolve selected add-ons against those valid for this package.
  const validAddons = await prisma.tripAddon.findMany({
    where: {
      active: true,
      OR: [{ global: true }, { packages: { some: { id: pkg.id } } }],
    },
  });
  const addonById = new Map(validAddons.map((a) => [a.id, a]));
  const addonSelections = input.addonSelections.map((sel) => {
    const addon = addonById.get(sel.addonId);
    if (!addon) throw new Error("Invalid add-on selection.");
    return { addon, quantity: sel.quantity };
  });

  const pricing = computePricing({
    pkg,
    adults: input.guest.adults,
    children: input.guest.children,
    addons: addonSelections,
    settings,
    requestedPlan: input.requestedPlan,
  });

  const confirmationNumber = generateConfirmationNumber();
  const { token: manageToken, hash: manageTokenHash } = generateManageToken();
  const holdExpiresAt = new Date(Date.now() + settings.holdMinutes * 60 * 1000);

  const result = await prisma.$transaction(
    async (tx) => {
      // Serialize all booking writes for this date.
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(${advisoryLockKeyForDate(input.date)})`;

      // Re-check availability with fresh data inside the lock.
      const ctx = await loadAvailabilityContext(pkg.id, input.date, input.date, tx);
      const slots = slotsForDateFromContext(ctx, {
        date: input.date,
        packageId: pkg.id,
        durationMinutes: pkg.durationMinutes,
      });
      const slot = slots.find((s) => s.startTime === input.startTime);
      if (!slot?.available) throw new SlotUnavailableError();

      const customer = await tx.customer.upsert({
        where: { email: input.guest.email.toLowerCase().trim() },
        update: {
          firstName: input.guest.firstName,
          lastName: input.guest.lastName,
          phone: input.guest.phone,
        },
        create: {
          email: input.guest.email.toLowerCase().trim(),
          firstName: input.guest.firstName,
          lastName: input.guest.lastName,
          phone: input.guest.phone,
        },
      });

      const booking = await tx.booking.create({
        data: {
          confirmationNumber,
          packageId: pkg.id,
          customerId: customer.id,
          status: "AWAITING_PAYMENT",
          date: input.date,
          startTime: input.startTime,
          durationMinutes: pkg.durationMinutes,
          slotKey: `${input.date}|${input.startTime}`,
          holdExpiresAt,
          adults: input.guest.adults,
          children: input.guest.children,
          specialRequests: input.guest.specialRequests,
          accessibilityNeeds: input.guest.accessibilityNeeds,
          fishingExperience: input.guest.fishingExperience,
          emergencyContactName: input.guest.emergencyContactName,
          emergencyContactPhone: input.guest.emergencyContactPhone,
          paymentPlan: pricing.paymentPlan,
          subtotalCents: pricing.subtotalCents,
          addonsCents: pricing.addonsCents,
          taxCents: pricing.taxCents,
          feeCents: pricing.feeCents,
          totalCents: pricing.totalCents,
          depositCents: pricing.depositCents,
          manageTokenHash,
          manageTokenExpiresAt: new Date(
            Date.now() + MANAGE_TOKEN_TTL_HOURS * 60 * 60 * 1000,
          ),
          createdByAdmin: input.createdByAdmin ?? false,
          guests: {
            create: [
              ...Array.from({ length: input.guest.adults }, () => ({
                type: "ADULT" as const,
              })),
              ...Array.from({ length: input.guest.children }, () => ({
                type: "CHILD" as const,
              })),
            ],
          },
          addons: {
            create: pricing.addonLines.map((line) => ({
              addonId: line.addonId,
              quantity: line.quantity,
              unitPriceCents: line.unitPriceCents,
              totalCents: line.totalCents,
            })),
          },
          waiverAcceptance: {
            create: {
              customerId: customer.id,
              policyVersion: settings.policyVersion,
              policiesAccepted: [...POLICY_KEYS],
              ipAddress: input.waiver.ipAddress,
              userAgent: input.waiver.userAgent,
            },
          },
        },
      });

      return { booking, customer };
    },
    { timeout: 15_000 },
  );

  return {
    bookingId: result.booking.id,
    confirmationNumber,
    manageToken,
    pricing,
    customerId: result.customer.id,
    customerEmail: result.customer.email,
    holdExpiresAt,
  };
}

/**
 * Move a confirmed booking to a new slot (admin action or approved customer
 * request). Uses the same advisory-lock + revalidation approach.
 */
export async function rescheduleBooking(params: {
  bookingId: string;
  newDate: string;
  newStartTime: string;
  skipAvailabilityWindowChecks?: boolean; // admins may override notice/window rules
}): Promise<{ fromDate: string; fromTime: string }> {
  return prisma.$transaction(async (tx) => {
    const booking = await tx.booking.findUniqueOrThrow({
      where: { id: params.bookingId },
      include: { package: true },
    });

    await tx.$executeRaw`SELECT pg_advisory_xact_lock(${advisoryLockKeyForDate(params.newDate)})`;

    const ctx = await loadAvailabilityContext(
      booking.packageId,
      params.newDate,
      params.newDate,
      tx,
    );
    // Exclude this booking itself from conflict checks (same-day moves).
    ctx.bookings = ctx.bookings.filter(
      (b) => !(b.date === booking.date && b.startTime === booking.startTime),
    );
    if (params.skipAvailabilityWindowChecks) {
      ctx.settings = { ...ctx.settings, minNoticeHours: 0, maxAdvanceDays: 3650 };
    }
    const slots = slotsForDateFromContext(ctx, {
      date: params.newDate,
      packageId: booking.packageId,
      durationMinutes: booking.durationMinutes,
    });
    const slot = slots.find((s) => s.startTime === params.newStartTime);
    if (!slot?.available) throw new SlotUnavailableError();

    await tx.booking.update({
      where: { id: booking.id },
      data: {
        date: params.newDate,
        startTime: params.newStartTime,
        slotKey: `${params.newDate}|${params.newStartTime}`,
        status: "RESCHEDULED",
        rescheduledFromDate: booking.date,
        rescheduledFromTime: booking.startTime,
      },
    });

    return { fromDate: booking.date, fromTime: booking.startTime };
  });
}

/** Statuses that should release the calendar slot when entered. */
const SLOT_RELEASING: ReadonlySet<string> = new Set(["CANCELLED", "REFUNDED", "NO_SHOW"]);

/** Update a booking's status, clearing the slotKey when the slot frees up. */
export async function updateBookingStatus(
  tx: Prisma.TransactionClient,
  bookingId: string,
  status: "PENDING" | "AWAITING_PAYMENT" | "CONFIRMED" | "RESCHEDULED" | "COMPLETED" | "CANCELLED" | "REFUNDED" | "WEATHER_HOLD" | "NO_SHOW",
  extra?: Prisma.BookingUpdateInput,
): Promise<void> {
  await tx.booking.update({
    where: { id: bookingId },
    data: {
      status,
      ...(SLOT_RELEASING.has(status) ? { slotKey: null } : {}),
      ...(status === "CANCELLED" ? { cancelledAt: new Date() } : {}),
      ...(status === "COMPLETED" ? { completedAt: new Date() } : {}),
      ...extra,
    },
  });
}
