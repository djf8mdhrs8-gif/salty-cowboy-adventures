import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStripe } from "@/lib/stripe";
import { requireAdmin } from "@/lib/auth";
import { refundRequestSchema } from "@/lib/validation/admin";
import { handleApiError } from "@/lib/api-helpers";
import { logAdminAction } from "@/lib/audit";
import { clientIp } from "@/lib/rate-limit";
import { getSettings } from "@/lib/server/settings";
import { sendEmail } from "@/lib/email/send";
import { toBookingEmailData } from "@/lib/email/booking-data";
import { refundIssuedEmail } from "@/lib/email/templates";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/refunds — issue a full or partial refund on a card payment.
 * The Refund row starts PENDING; the charge.refunded webhook marks it
 * SUCCEEDED and updates booking totals + emails the customer.
 */
export async function POST(req: Request) {
  try {
    const admin = await requireAdmin();
    const body = refundRequestSchema.parse(await req.json());

    const payment = await prisma.payment.findUnique({
      where: { id: body.paymentId },
      include: { refunds: { where: { status: { in: ["PENDING", "SUCCEEDED"] } } } },
    });
    if (!payment || payment.bookingId !== body.bookingId) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }
    if (payment.status !== "PAID" && payment.status !== "PARTIALLY_REFUNDED") {
      return NextResponse.json({ error: "Payment is not refundable" }, { status: 400 });
    }
    if (!payment.stripePaymentIntentId) {
      return NextResponse.json(
        { error: "Manual payments must be refunded outside Stripe; record it as an internal note." },
        { status: 400 },
      );
    }

    const alreadyRefunded = payment.refunds.reduce((s, r) => s + r.amountCents, 0);
    if (body.amountCents + alreadyRefunded > payment.amountCents) {
      return NextResponse.json(
        { error: "Refund exceeds the remaining refundable amount for this payment." },
        { status: 400 },
      );
    }

    const refund = await prisma.refund.create({
      data: {
        paymentId: payment.id,
        bookingId: payment.bookingId,
        amountCents: body.amountCents,
        reason: body.reason,
        status: "PENDING",
        issuedById: admin.adminUserId,
      },
    });

    try {
      const stripeRefund = await getStripe().refunds.create(
        {
          payment_intent: payment.stripePaymentIntentId,
          amount: body.amountCents,
          metadata: { bookingId: payment.bookingId, refundId: refund.id },
        },
        { idempotencyKey: `refund-${refund.id}` },
      );
      await prisma.refund.update({
        where: { id: refund.id },
        data: { stripeRefundId: stripeRefund.id },
      });

      // Stripe usually settles refunds synchronously — finalize right away so
      // totals and the customer email don't depend on webhook delivery. The
      // charge.refunded webhook is idempotent against this (delta becomes 0).
      if (stripeRefund.status === "succeeded") {
        await prisma.$transaction(async (tx) => {
          await tx.refund.update({
            where: { id: refund.id },
            data: { status: "SUCCEEDED" },
          });
          const refundedOnPayment = await tx.refund.aggregate({
            where: { paymentId: payment.id, status: "SUCCEEDED" },
            _sum: { amountCents: true },
          });
          await tx.payment.update({
            where: { id: payment.id },
            data: {
              status:
                (refundedOnPayment._sum.amountCents ?? 0) >= payment.amountCents
                  ? "REFUNDED"
                  : "PARTIALLY_REFUNDED",
            },
          });
          const total = await tx.refund.aggregate({
            where: { bookingId: payment.bookingId, status: "SUCCEEDED" },
            _sum: { amountCents: true },
          });
          await tx.booking.update({
            where: { id: payment.bookingId },
            data: { refundedCents: total._sum.amountCents ?? 0 },
          });
        });

        const booking = await prisma.booking.findUniqueOrThrow({
          where: { id: payment.bookingId },
          include: { customer: true, package: true },
        });
        const settings = await getSettings();
        await sendEmail({
          to: booking.customer.email,
          type: "REFUND_ISSUED",
          content: refundIssuedEmail(
            toBookingEmailData(booking, settings),
            body.amountCents,
          ),
          bookingId: booking.id,
        });
      }
    } catch (err) {
      await prisma.refund.update({
        where: { id: refund.id },
        data: { status: "FAILED" },
      });
      throw err;
    }

    await logAdminAction({
      adminUserId: admin.adminUserId,
      action: "refund.issue",
      entityType: "Booking",
      entityId: payment.bookingId,
      details: { amountCents: body.amountCents, paymentId: payment.id },
      ipAddress: clientIp(req),
    });

    return NextResponse.json({
      ok: true,
      message: "Refund submitted — it will be confirmed by Stripe within a few moments.",
    });
  } catch (err) {
    return handleApiError(err);
  }
}
