import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStripe } from "@/lib/stripe";
import { applyPaidCheckoutSession } from "@/lib/server/payments";
import { handleApiError } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

/**
 * GET /api/booking-status?session_id=cs_… — polled by the success page while
 * waiting for payment confirmation. The checkout session id is a
 * high-entropy secret known only to the paying customer.
 *
 * If the payment is still pending here, we verify it directly with Stripe
 * and confirm the booking on the spot — so bookings work even before a
 * webhook endpoint is configured (the webhook remains the backstop for
 * customers who never return to the site after paying).
 */
export async function GET(req: Request) {
  try {
    const sessionId = new URL(req.url).searchParams.get("session_id");
    if (!sessionId || !sessionId.startsWith("cs_")) {
      return NextResponse.json({ error: "Invalid session" }, { status: 400 });
    }
    let payment = await prisma.payment.findUnique({
      where: { stripeCheckoutSessionId: sessionId },
      select: { status: true, booking: { select: { status: true } } },
    });
    if (!payment) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (payment.status === "PENDING" && process.env.STRIPE_SECRET_KEY) {
      try {
        const session = await getStripe().checkout.sessions.retrieve(sessionId);
        await applyPaidCheckoutSession({
          id: session.id,
          payment_status: session.payment_status,
          amount_total: session.amount_total,
          paymentIntentId:
            typeof session.payment_intent === "string"
              ? session.payment_intent
              : (session.payment_intent?.id ?? null),
        });
        payment = await prisma.payment.findUnique({
          where: { stripeCheckoutSessionId: sessionId },
          select: { status: true, booking: { select: { status: true } } },
        });
      } catch (err) {
        // Verification is best-effort; the webhook remains the backstop.
        console.error("Inline checkout verification failed:", err);
      }
    }

    return NextResponse.json(
      { paymentStatus: payment?.status, bookingStatus: payment?.booking.status },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (err) {
    return handleApiError(err);
  }
}
