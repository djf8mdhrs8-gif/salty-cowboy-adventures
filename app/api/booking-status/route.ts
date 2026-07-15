import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { handleApiError } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

/**
 * GET /api/booking-status?session_id=cs_… — polled by the success page while
 * waiting for the Stripe webhook to confirm. The checkout session id is a
 * high-entropy secret known only to the paying customer.
 */
export async function GET(req: Request) {
  try {
    const sessionId = new URL(req.url).searchParams.get("session_id");
    if (!sessionId || !sessionId.startsWith("cs_")) {
      return NextResponse.json({ error: "Invalid session" }, { status: 400 });
    }
    const payment = await prisma.payment.findUnique({
      where: { stripeCheckoutSessionId: sessionId },
      select: { status: true, booking: { select: { status: true } } },
    });
    if (!payment) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(
      { paymentStatus: payment.status, bookingStatus: payment.booking.status },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (err) {
    return handleApiError(err);
  }
}
