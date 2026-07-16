import "server-only";
import { prisma } from "@/lib/db";
import { getSettings } from "@/lib/server/settings";
import { issueManageToken } from "@/lib/server/manage-token";
import { sendEmail } from "@/lib/email/send";
import { toBookingEmailData } from "@/lib/email/booking-data";
import {
  bookingConfirmationEmail,
  paymentReceiptEmail,
} from "@/lib/email/templates";

/** The slice of a Stripe Checkout Session this module needs. */
export interface PaidSessionInput {
  id: string;
  payment_status: string | null;
  amount_total: number | null;
  paymentIntentId: string | null;
}

/**
 * Apply a paid Stripe Checkout session to its booking: mark the payment PAID,
 * credit the booking, confirm it, and send confirmation/receipt emails.
 *
 * Idempotent — an already-PAID payment is a no-op — and shared by both the
 * webhook handler and the success-page verification fallback, so bookings
 * confirm even before a webhook endpoint is configured.
 */
export async function applyPaidCheckoutSession(session: PaidSessionInput): Promise<void> {
  if (session.payment_status !== "paid") return;

  const amountPaid = session.amount_total ?? 0;

  const { booking, isFirstPayment } = await prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findUnique({
      where: { stripeCheckoutSessionId: session.id },
      include: { booking: true },
    });
    if (!payment) throw new Error(`No payment for checkout session ${session.id}`);

    // Atomic claim: the webhook and the success-page verification can run
    // concurrently — only the caller whose update matches processes further.
    const claimed = await tx.payment.updateMany({
      where: { id: payment.id, status: { not: "PAID" } },
      data: {
        status: "PAID",
        amountCents: amountPaid,
        stripePaymentIntentId: session.paymentIntentId,
        paidAt: new Date(),
      },
    });
    if (claimed.count === 0) {
      return { booking: null, isFirstPayment: false }; // already processed
    }

    const isFirstPayment = payment.booking.amountPaidCents === 0;

    const booking = await tx.booking.update({
      where: { id: payment.bookingId },
      data: {
        amountPaidCents: { increment: amountPaid },
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
