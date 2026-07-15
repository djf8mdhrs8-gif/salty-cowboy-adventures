import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getStripe } from "@/lib/stripe";
import { bookingFromManageToken } from "@/lib/server/manage-auth";
import { rescheduleBooking, updateBookingStatus } from "@/lib/server/bookings";
import { handleApiError, tooManyRequests } from "@/lib/api-helpers";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { getSettings } from "@/lib/server/settings";
import { sendEmail } from "@/lib/email/send";
import { toBookingEmailData } from "@/lib/email/booking-data";
import {
  bookingCancelledEmail,
  bookingRescheduledEmail,
} from "@/lib/email/templates";
import { ymdSchema, hhmmSchema, phoneSchema } from "@/lib/validation/booking";
import { siteUrl } from "@/lib/site";
import { formatYmd, formatTime } from "@/lib/dates";

export const dynamic = "force-dynamic";

const actionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("pay-balance") }),
  z.object({
    action: z.literal("cancel"),
    reason: z.string().trim().max(500).optional(),
  }),
  z.object({
    action: z.literal("reschedule"),
    date: ymdSchema,
    startTime: hhmmSchema,
  }),
  z.object({
    action: z.literal("update-details"),
    phone: phoneSchema,
    emergencyContactName: z.string().trim().min(1).max(120),
    emergencyContactPhone: phoneSchema,
    specialRequests: z.string().trim().max(1000).optional().or(z.literal("")),
    accessibilityNeeds: z.string().trim().max(1000).optional().or(z.literal("")),
  }),
]);

const MODIFIABLE = new Set(["CONFIRMED", "RESCHEDULED", "WEATHER_HOLD", "AWAITING_PAYMENT"]);

/** POST /api/manage/[token] — customer self-service actions on a booking. */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const rl = rateLimit(`manage:${clientIp(req)}`, { limit: 20, windowSeconds: 600 });
    if (!rl.ok) return tooManyRequests(rl.retryAfterSeconds);

    const { token } = await params;
    const booking = await bookingFromManageToken(token);
    if (!booking) {
      return NextResponse.json(
        { error: "This link is invalid or has expired. Request a new one from the lookup page." },
        { status: 404 },
      );
    }

    const body = actionSchema.parse(await req.json());
    const settings = await getSettings();

    switch (body.action) {
      case "pay-balance": {
        const balance =
          booking.totalCents - booking.amountPaidCents - booking.refundedCents;
        if (balance <= 0) {
          return NextResponse.json({ error: "No balance is due." }, { status: 400 });
        }
        if (!MODIFIABLE.has(booking.status)) {
          return NextResponse.json(
            { error: "This booking can no longer be paid online." },
            { status: 400 },
          );
        }
        const stripe = getStripe();
        const session = await stripe.checkout.sessions.create({
          mode: "payment",
          customer: booking.customer.stripeCustomerId ?? undefined,
          customer_email: booking.customer.stripeCustomerId
            ? undefined
            : booking.customer.email,
          line_items: [
            {
              quantity: 1,
              price_data: {
                currency: "usd",
                unit_amount: balance,
                product_data: {
                  name: `${booking.package.name} — Remaining balance`,
                  description: `${formatYmd(booking.date)} at ${formatTime(booking.startTime)} · ${booking.confirmationNumber}`,
                },
              },
            },
          ],
          metadata: { bookingId: booking.id, paymentType: "BALANCE" },
          payment_intent_data: {
            metadata: { bookingId: booking.id, paymentType: "BALANCE" },
          },
          success_url: `${siteUrl()}/booking/success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${siteUrl()}/manage/${token}`,
        });
        await prisma.payment.create({
          data: {
            bookingId: booking.id,
            customerId: booking.customerId,
            type: "BALANCE",
            method: "CARD",
            status: "PENDING",
            amountCents: balance,
            stripeCheckoutSessionId: session.id,
            stripeCustomerId: booking.customer.stripeCustomerId,
          },
        });
        return NextResponse.json({ url: session.url });
      }

      case "cancel": {
        if (!MODIFIABLE.has(booking.status)) {
          return NextResponse.json(
            { error: "This booking can no longer be cancelled online. Please contact us." },
            { status: 400 },
          );
        }
        await prisma.$transaction(async (tx) => {
          await updateBookingStatus(tx, booking.id, "CANCELLED", {
            cancellationReason: body.reason || "Cancelled by customer",
          });
        });
        await sendEmail({
          to: booking.customer.email,
          type: "BOOKING_CANCELLED",
          content: bookingCancelledEmail(
            toBookingEmailData(booking, settings),
            body.reason || undefined,
          ),
          bookingId: booking.id,
        });
        return NextResponse.json({
          message:
            "Your booking is cancelled. Any refund due under our cancellation policy will be processed within 3 business days.",
        });
      }

      case "reschedule": {
        if (!MODIFIABLE.has(booking.status)) {
          return NextResponse.json(
            { error: "This booking can no longer be rescheduled online. Please contact us." },
            { status: 400 },
          );
        }
        const { fromDate, fromTime } = await rescheduleBooking({
          bookingId: booking.id,
          newDate: body.date,
          newStartTime: body.startTime,
        });
        const updated = await prisma.booking.findUniqueOrThrow({
          where: { id: booking.id },
          include: { customer: true, package: true },
        });
        await sendEmail({
          to: booking.customer.email,
          type: "BOOKING_RESCHEDULED",
          content: bookingRescheduledEmail(
            toBookingEmailData(updated, settings),
            fromDate,
            fromTime,
          ),
          bookingId: booking.id,
        });
        return NextResponse.json({ message: "Your booking has been rescheduled." });
      }

      case "update-details": {
        await prisma.booking.update({
          where: { id: booking.id },
          data: {
            emergencyContactName: body.emergencyContactName,
            emergencyContactPhone: body.emergencyContactPhone,
            specialRequests: body.specialRequests || null,
            accessibilityNeeds: body.accessibilityNeeds || null,
            customer: { update: { phone: body.phone } },
          },
        });
        return NextResponse.json({ message: "Your details have been updated." });
      }
    }
  } catch (err) {
    return handleApiError(err);
  }
}
