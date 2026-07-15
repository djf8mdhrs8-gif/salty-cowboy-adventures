import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStripe } from "@/lib/stripe";
import { requireAdmin } from "@/lib/auth";
import { refundRequestSchema } from "@/lib/validation/admin";
import { handleApiError } from "@/lib/api-helpers";
import { logAdminAction } from "@/lib/audit";
import { clientIp } from "@/lib/rate-limit";

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
