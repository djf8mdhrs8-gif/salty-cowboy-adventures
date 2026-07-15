import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSettings } from "@/lib/server/settings";
import { issueManageToken } from "@/lib/server/manage-token";
import { sendEmail } from "@/lib/email/send";
import { toBookingEmailData } from "@/lib/email/booking-data";
import { tripReminderEmail, balanceReminderEmail } from "@/lib/email/templates";
import { dateToYmd } from "@/lib/availability";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const ACTIVE = ["CONFIRMED", "RESCHEDULED"] as const;

/**
 * GET /api/cron/reminders — run daily (Vercel Cron). Sends:
 *  - trip reminders N days out (N from settings.reminderDaysBefore, default 7 & 1),
 *  - balance reminders settings.balanceReminderDays before the trip.
 * EmailLog is checked so each reminder sends at most once per booking/day-offset.
 */
export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const settings = await getSettings();
  const today = new Date();
  let sent = 0;

  // ── Trip reminders ───────────────────────────────────────────────
  for (const daysOut of settings.reminderDaysBefore) {
    const target = new Date(today);
    target.setDate(target.getDate() + daysOut);
    const targetYmd = dateToYmd(target);

    const bookings = await prisma.booking.findMany({
      where: { date: targetYmd, status: { in: [...ACTIVE] } },
      include: { customer: true, package: true, emailLogs: true },
    });

    for (const booking of bookings) {
      const alreadySent = booking.emailLogs.some(
        (log) =>
          log.type === "TRIP_REMINDER" &&
          log.status !== "FAILED" &&
          log.subject.includes(daysOut <= 1 ? "tomorrow" : `in ${daysOut} days`),
      );
      if (alreadySent) continue;

      const manageToken = await issueManageToken(booking.id);
      await sendEmail({
        to: booking.customer.email,
        type: "TRIP_REMINDER",
        content: tripReminderEmail(
          toBookingEmailData(booking, settings, manageToken),
          daysOut,
        ),
        bookingId: booking.id,
      });
      sent++;
    }
  }

  // ── Balance reminders ────────────────────────────────────────────
  const balTarget = new Date(today);
  balTarget.setDate(balTarget.getDate() + settings.balanceReminderDays);
  const balYmd = dateToYmd(balTarget);

  const withBalances = await prisma.booking.findMany({
    where: { date: balYmd, status: { in: [...ACTIVE] } },
    include: { customer: true, package: true, emailLogs: true },
  });

  for (const booking of withBalances) {
    const balance = booking.totalCents - booking.amountPaidCents - booking.refundedCents;
    if (balance <= 0) continue;
    const alreadySent = booking.emailLogs.some(
      (log) => log.type === "BALANCE_REMINDER" && log.status !== "FAILED",
    );
    if (alreadySent) continue;

    const manageToken = await issueManageToken(booking.id);
    await sendEmail({
      to: booking.customer.email,
      type: "BALANCE_REMINDER",
      content: balanceReminderEmail(toBookingEmailData(booking, settings, manageToken)),
      bookingId: booking.id,
    });
    sent++;
  }

  // ── Housekeeping: cancel long-expired unpaid holds ───────────────
  const stale = await prisma.booking.updateMany({
    where: {
      status: { in: ["PENDING", "AWAITING_PAYMENT"] },
      amountPaidCents: 0,
      holdExpiresAt: { lt: new Date(Date.now() - 60 * 60 * 1000) },
    },
    data: {
      status: "CANCELLED",
      slotKey: null,
      cancellationReason: "Hold expired without payment",
      cancelledAt: new Date(),
    },
  });

  return NextResponse.json({ sent, expiredHoldsCancelled: stale.count });
}
