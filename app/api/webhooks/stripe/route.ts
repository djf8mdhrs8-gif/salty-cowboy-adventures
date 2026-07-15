import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getStripe } from "@/lib/stripe";
import { getSettings } from "@/lib/server/settings";
import { issueManageToken } from "@/lib/server/manage-token";
import { sendEmail } from "@/lib/email/send";
import { toBookingEmailData } from "@/lib/email/booking-data";
import {
  bookingConfirmationEmail,
  paymentReceiptEmail,
  paymentFailedEmail,
  refundIssuedEmail,
} from "@/lib/email/templates";

export const dynamic = "force-dynamic";

/**
 * POST /api/webhooks/stripe — signature-verified, idempotent webhook handler.
 * This is the ONLY place a booking transitions to CONFIRMED.
 */
export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    console.error("STRIPE_WEBHOOK_SECRET is not configured");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    const payload = await req.text();
    event = getStripe().webhooks.constructEvent(payload, signature, secret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // Idempotency: record the event id first; a duplicate delivery hits the
  // unique constraint and is acknowledged without re-processing.
  try {
    await prisma.webhookEvent.create({
      data: { stripeEventId: event.id, type: event.type },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json({ received: true, duplicate: true });
    }
    throw err;
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object);
        break;
      case "checkout.session.expired":
        await handleCheckoutExpired(event.data.object);
        break;
      case "payment_intent.payment_failed":
        await handlePaymentFailed(event.data.object);
        break;
      case "charge.refunded":
        await handleChargeRefunded(event.data.object);
        break;
      default:
        break; // event types we don't handle are acknowledged
    }
    return NextResponse.json({ received: true });
  } catch (err) {
    // Delete the idempotency record so Stripe's retry can re-process.
    await prisma.webhookEvent
      .delete({ where: { stripeEventId: event.id } })
      .catch(() => {});
    console.error(`Webhook ${event.type} failed:`, err);
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
  if (session.payment_status !== "paid") return; // async methods settle later

  const amountPaid = session.amount_total ?? 0;
  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id;

  const { booking, isFirstPayment } = await prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findUnique({
      where: { stripeCheckoutSessionId: session.id },
      include: { booking: true },
    });
    if (!payment) throw new Error(`No payment for checkout session ${session.id}`);
    if (payment.status === "PAID") {
      return { booking: null, isFirstPayment: false }; // already processed
    }

    await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: "PAID",
        amountCents: amountPaid,
        stripePaymentIntentId: paymentIntentId,
        paidAt: new Date(),
      },
    });

    const isFirstPayment = payment.booking.amountPaidCents === 0;
    const newPaid = payment.booking.amountPaidCents + amountPaid;

    const booking = await tx.booking.update({
      where: { id: payment.bookingId },
      data: {
        amountPaidCents: newPaid,
        holdExpiresAt: null, // paid bookings never expire
        // Balance payments on an already-confirmed booking keep their status.
        ...(payment.booking.status === "AWAITING_PAYMENT" ||
        payment.booking.status === "PENDING"
          ? { status: "CONFIRMED" as const }
          : {}),
      },
      include: { customer: true, package: true },
    });

    return { booking, isFirstPayment };
  });

  if (!booking) return;

  const settings = await getSettings();
  const manageToken = await issueManageToken(booking.id);
  const emailData = toBookingEmailData(booking, settings, manageToken);

  if (isFirstPayment) {
    await sendEmail({
      to: booking.customer.email,
      type: "BOOKING_CONFIRMATION",
      content: bookingConfirmationEmail(emailData),
      bookingId: booking.id,
    });
  }
  await sendEmail({
    to: booking.customer.email,
    type: "PAYMENT_RECEIPT",
    content: paymentReceiptEmail(emailData, amountPaid),
    bookingId: booking.id,
  });
}

async function handleCheckoutExpired(session: Stripe.Checkout.Session): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findUnique({
      where: { stripeCheckoutSessionId: session.id },
      include: { booking: true },
    });
    if (!payment || payment.status === "PAID") return;

    await tx.payment.update({
      where: { id: payment.id },
      data: { status: "FAILED", failureReason: "Checkout session expired" },
    });

    // Release the slot if nothing was ever paid on this booking.
    if (
      payment.booking.status === "AWAITING_PAYMENT" &&
      payment.booking.amountPaidCents === 0
    ) {
      await tx.booking.update({
        where: { id: payment.bookingId },
        data: {
          status: "CANCELLED",
          slotKey: null,
          cancelledAt: new Date(),
          cancellationReason: "Checkout abandoned",
        },
      });
    }
  });
}

async function handlePaymentFailed(intent: Stripe.PaymentIntent): Promise<void> {
  const payment = await prisma.payment.findUnique({
    where: { stripePaymentIntentId: intent.id },
    include: { booking: { include: { customer: true, package: true } } },
  });
  if (!payment || payment.status === "PAID") return;

  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: "FAILED",
      failureReason: intent.last_payment_error?.message ?? "Payment failed",
    },
  });

  const settings = await getSettings();
  const manageToken = await issueManageToken(payment.booking.id);
  await sendEmail({
    to: payment.booking.customer.email,
    type: "PAYMENT_FAILED",
    content: paymentFailedEmail(
      toBookingEmailData(payment.booking, settings, manageToken),
    ),
    bookingId: payment.booking.id,
  });
}

async function handleChargeRefunded(charge: Stripe.Charge): Promise<void> {
  const paymentIntentId =
    typeof charge.payment_intent === "string"
      ? charge.payment_intent
      : charge.payment_intent?.id;
  if (!paymentIntentId) return;

  const payment = await prisma.payment.findUnique({
    where: { stripePaymentIntentId: paymentIntentId },
    include: { booking: { include: { customer: true, package: true } } },
  });
  if (!payment) return;

  const fullyRefunded = charge.refunded;

  const { refundAmount } = await prisma.$transaction(async (tx) => {
    // Confirm the pending Refund row created by the admin refund action, or
    // record one for refunds initiated directly in the Stripe dashboard.
    const pendingRefund = await tx.refund.findFirst({
      where: { paymentId: payment.id, status: "PENDING" },
      orderBy: { createdAt: "desc" },
    });

    let refundAmount: number;
    if (pendingRefund) {
      await tx.refund.update({
        where: { id: pendingRefund.id },
        data: { status: "SUCCEEDED" },
      });
      refundAmount = pendingRefund.amountCents;
    } else {
      const recorded = await tx.refund.aggregate({
        where: { paymentId: payment.id, status: "SUCCEEDED" },
        _sum: { amountCents: true },
      });
      refundAmount = Math.max(
        0,
        charge.amount_refunded - (recorded._sum.amountCents ?? 0),
      );
      if (refundAmount > 0) {
        await tx.refund.create({
          data: {
            paymentId: payment.id,
            bookingId: payment.bookingId,
            amountCents: refundAmount,
            reason: "Refunded via Stripe dashboard",
            status: "SUCCEEDED",
          },
        });
      }
    }

    await tx.payment.update({
      where: { id: payment.id },
      data: { status: fullyRefunded ? "REFUNDED" : "PARTIALLY_REFUNDED" },
    });

    // Booking-level total = sum of all succeeded refunds across its payments.
    const total = await tx.refund.aggregate({
      where: { bookingId: payment.bookingId, status: "SUCCEEDED" },
      _sum: { amountCents: true },
    });
    await tx.booking.update({
      where: { id: payment.bookingId },
      data: { refundedCents: total._sum.amountCents ?? 0 },
    });

    return { refundAmount };
  });

  // Notify the customer (once per refund event).
  if (refundAmount <= 0) return;
  const settings = await getSettings();
  await sendEmail({
    to: payment.booking.customer.email,
    type: "REFUND_ISSUED",
    content: refundIssuedEmail(
      toBookingEmailData(payment.booking, settings),
      refundAmount,
    ),
    bookingId: payment.booking.id,
  });
}
