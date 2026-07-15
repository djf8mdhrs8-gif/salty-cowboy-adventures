import "server-only";
import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import {
  getSlotsForDate,
  type RuleData,
  type BlockedDateData,
  type BookingSlotData,
  type ScheduleSettings,
  type Slot,
} from "@/lib/availability";
import { getSettings } from "@/lib/server/settings";

type Db = Prisma.TransactionClient | typeof prisma;

export interface AvailabilityContext {
  rules: RuleData[];
  blockedDates: BlockedDateData[];
  bookings: BookingSlotData[];
  settings: ScheduleSettings;
}

/** Load everything the pure availability engine needs for a date range. */
export async function loadAvailabilityContext(
  packageId: string,
  fromDate: string,
  toDate: string,
  db: Db = prisma,
): Promise<AvailabilityContext> {
  const [rules, blockedDates, bookings, settings] = await Promise.all([
    db.availabilityRule.findMany({
      where: { active: true, OR: [{ packageId: null }, { packageId }] },
      select: {
        packageId: true,
        daysOfWeek: true,
        startTimes: true,
        seasonStart: true,
        seasonEnd: true,
        active: true,
      },
    }),
    db.blockedDate.findMany({
      where: { date: { gte: fromDate, lte: toDate } },
      select: { date: true, startTime: true, endTime: true },
    }),
    // Single boat: bookings for ANY package block the calendar.
    db.booking.findMany({
      where: {
        date: { gte: fromDate, lte: toDate },
        status: {
          in: [
            "PENDING",
            "AWAITING_PAYMENT",
            "CONFIRMED",
            "RESCHEDULED",
            "COMPLETED",
            "WEATHER_HOLD",
          ],
        },
      },
      select: {
        date: true,
        startTime: true,
        durationMinutes: true,
        status: true,
        holdExpiresAt: true,
      },
    }),
    getSettings(),
  ]);

  return {
    rules,
    blockedDates,
    bookings,
    settings: {
      minNoticeHours: settings.minNoticeHours,
      maxAdvanceDays: settings.maxAdvanceDays,
      turnaroundMinutes: settings.turnaroundMinutes,
    },
  };
}

export function slotsForDateFromContext(
  ctx: AvailabilityContext,
  params: { date: string; packageId: string; durationMinutes: number; now?: Date },
): Slot[] {
  return getSlotsForDate({
    date: params.date,
    packageId: params.packageId,
    durationMinutes: params.durationMinutes,
    rules: ctx.rules,
    blockedDates: ctx.blockedDates,
    bookings: ctx.bookings,
    settings: ctx.settings,
    now: params.now ?? new Date(),
  });
}
