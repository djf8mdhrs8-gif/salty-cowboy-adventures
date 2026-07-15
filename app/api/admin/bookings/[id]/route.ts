import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { bookingActionSchema } from "@/lib/validation/admin";
import { handleApiError } from "@/lib/api-helpers";
import { logAdminAction } from "@/lib/audit";
import {
  rescheduleBooking,
  updateBookingStatus,
} from "@/lib/server/bookings";
import { getSettings } from "@/lib/server/settings";
import { issueManageToken } from "@/lib/server/manage-token";
import { sendEmail } from "@/lib/email/send";
import { toBookingEmailData } from "@/lib/email/booking-data";
import {
  bookingCancelledEmail,
  bookingRescheduledEmail,
  balanceReminderEmail,
  weatherDelayEmail,
  weatherCancellationEmail,
} from "@/lib/email/templates";
import { clientIp } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

/** PATCH /api/admin/bookings/[id] — admin actions on a booking. */
export async function PATCH(req: Request, { params }: Params) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;
    const body = bookingActionSchema.parse(await req.json());

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { customer: true, package: true },
    });
    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const settings = await getSettings();
    const ip = clientIp(req);
    const audit = (action: string, details?: Record<string, unknown>) =>
      logAdminAction({
        adminUserId: admin.adminUserId,
        action,
        entityType: "Booking",
        entityId: id,
        // JSON round-trip drops undefined values for Prisma's Json column.
        details: details ? JSON.parse(JSON.stringify(details)) : undefined,
        ipAddress: ip,
      });

    switch (body.action) {
      case "status": {
        await prisma.$transaction(async (tx) => {
          await updateBookingStatus(tx, id, body.status, {
            ...(body.reason ? { cancellationReason: body.reason } : {}),
          });
        });
        await audit("booking.status", { from: booking.status, to: body.status, reason: body.reason });

        if (body.sendEmail !== false) {
          const manageToken = await issueManageToken(id);
          const data = toBookingEmailData(booking, settings, manageToken);
          if (body.status === "CANCELLED") {
            const isWeather = /weather/i.test(body.reason ?? "");
            await sendEmail({
              to: booking.customer.email,
              type: isWeather ? "WEATHER_CANCELLATION" : "BOOKING_CANCELLED",
              content: isWeather
                ? weatherCancellationEmail(data)
                : bookingCancelledEmail(data, body.reason),
              bookingId: id,
            });
          } else if (body.status === "WEATHER_HOLD") {
            await sendEmail({
              to: booking.customer.email,
              type: "WEATHER_DELAY",
              content: weatherDelayEmail(data),
              bookingId: id,
            });
          }
        }
        return NextResponse.json({ ok: true });
      }

      case "notes": {
        await prisma.booking.update({
          where: { id },
          data: { internalNotes: body.internalNotes },
        });
        await audit("booking.notes");
        return NextResponse.json({ ok: true });
      }

      case "reschedule": {
        const { fromDate, fromTime } = await rescheduleBooking({
          bookingId: id,
          newDate: body.date,
          newStartTime: body.startTime,
          skipAvailabilityWindowChecks: true, // admins may override notice rules
        });
        await audit("booking.reschedule", {
          from: `${fromDate} ${fromTime}`,
          to: `${body.date} ${body.startTime}`,
        });
        if (body.sendEmail !== false) {
          const updated = await prisma.booking.findUniqueOrThrow({
            where: { id },
            include: { customer: true, package: true },
          });
          const manageToken = await issueManageToken(id);
          await sendEmail({
            to: booking.customer.email,
            type: "BOOKING_RESCHEDULED",
            content: bookingRescheduledEmail(
              toBookingEmailData(updated, settings, manageToken),
              fromDate,
              fromTime,
            ),
            bookingId: id,
          });
        }
        return NextResponse.json({ ok: true });
      }

      case "manual-payment": {
        await prisma.$transaction(async (tx) => {
          await tx.payment.create({
            data: {
              bookingId: id,
              customerId: booking.customerId,
              type: "MANUAL",
              method: body.method,
              status: "PAID",
              amountCents: body.amountCents,
              note: body.note,
              paidAt: new Date(),
            },
          });
          await tx.booking.update({
            where: { id },
            data: {
              amountPaidCents: { increment: body.amountCents },
              ...(booking.status === "AWAITING_PAYMENT" || booking.status === "PENDING"
                ? { status: "CONFIRMED", holdExpiresAt: null }
                : {}),
            },
          });
        });
        await audit("booking.manual-payment", {
          amountCents: body.amountCents,
          method: body.method,
        });
        return NextResponse.json({ ok: true });
      }

      case "send-balance-reminder": {
        const manageToken = await issueManageToken(id);
        await sendEmail({
          to: booking.customer.email,
          type: "BALANCE_REMINDER",
          content: balanceReminderEmail(toBookingEmailData(booking, settings, manageToken)),
          bookingId: id,
        });
        await audit("booking.balance-reminder");
        return NextResponse.json({ ok: true });
      }

      case "send-weather-delay": {
        const manageToken = await issueManageToken(id);
        await sendEmail({
          to: booking.customer.email,
          type: "WEATHER_DELAY",
          content: weatherDelayEmail(toBookingEmailData(booking, settings, manageToken)),
          bookingId: id,
        });
        await audit("booking.weather-delay-email");
        return NextResponse.json({ ok: true });
      }
    }
  } catch (err) {
    return handleApiError(err);
  }
}
