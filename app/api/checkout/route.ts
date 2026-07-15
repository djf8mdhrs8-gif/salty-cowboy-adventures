import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStripe } from "@/lib/stripe";
import { createBooking } from "@/lib/server/bookings";
import { checkoutRequestSchema } from "@/lib/validation/booking";
import { handleApiError, tooManyRequests } from "@/lib/api-helpers";
import { rateLimit, clientIp, maybeCleanup } from "@/lib/rate-limit";
import { getSettings } from "@/lib/server/settings";
import { siteUrl } from "@/lib/site";
import { formatYmd, formatTime } from "@/lib/dates";

export const dynamic = "force-dynamic";

/**
 * POST /api/checkout — create a slot-holding booking and a Stripe Checkout
 * session for the amount due today. The booking is only CONFIRMED once the
 * Stripe webhook verifies payment.
 */
export async function POST(req: Request) {
  try {
    maybeCleanup();
    const ip = clientIp(req);
    const rl = rateLimit(`checkout:${ip}`, { limit: 10, windowSeconds: 600 });
    if (!rl.ok) return tooManyRequests(rl.retryAfterSeconds);

    const body = checkoutRequestSchema.parse(await req.json());
    const settings = await getSettings();

    const result = await createBooking({
      packageId: body.packageId,
      date: body.date,
      startTime: body.startTime,
      guest: {
        ...body.guest,
        specialRequests: body.guest.specialRequests || undefined,
        accessibilityNeeds: body.guest.accessibilityNeeds || undefined,
      },
      addonSelections: body.addons,
      requestedPlan: body.paymentPlan,
      waiver: {
        ipAddress: ip,
        userAgent: req.headers.get("user-agent") ?? undefined,
      },
    });

    const stripe = getStripe();
    const pkg = await prisma.tripPackage.findUniqueOrThrow({
      where: { id: body.packageId },
      select: { name: true, slug: true },
    });

    // Reuse or create the Stripe customer for this email.
    const customer = await prisma.customer.findUniqueOrThrow({
      where: { id: result.customerId },
    });
    let stripeCustomerId = customer.stripeCustomerId;
    if (!stripeCustomerId) {
      const created = await stripe.customers.create(
        {
          email: customer.email,
          name: `${customer.firstName} ${customer.lastName}`,
          phone: customer.phone,
        },
        { idempotencyKey: `customer-${customer.id}` },
      );
      stripeCustomerId = created.id;
      await prisma.customer.update({
        where: { id: customer.id },
        data: { stripeCustomerId },
      });
    }

    const paymentType = result.pricing.paymentPlan === "DEPOSIT" ? "DEPOSIT" : "FULL";
    const description =
      `${formatYmd(body.date)} at ${formatTime(body.startTime)} · ` +
      `Confirmation ${result.confirmationNumber}` +
      (paymentType === "DEPOSIT" ? " · Deposit (balance due before trip)" : "");

    const session = await stripe.checkout.sessions.create(
      {
        mode: "payment",
        customer: stripeCustomerId,
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: "usd",
              unit_amount: result.pricing.dueTodayCents,
              product_data: {
                name:
                  paymentType === "DEPOSIT"
                    ? `${pkg.name} — Deposit`
                    : pkg.name,
                description,
              },
            },
          },
        ],
        metadata: {
          bookingId: result.bookingId,
          paymentType,
        },
        payment_intent_data: {
          metadata: { bookingId: result.bookingId, paymentType },
        },
        // Let the checkout session expire in step with the slot hold
        // (Stripe minimum is 30 minutes).
        expires_at:
          Math.floor(Date.now() / 1000) +
          Math.max(30, settings.holdMinutes) * 60,
        success_url: `${siteUrl()}/booking/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${siteUrl()}/trips/${pkg.slug}?checkout=cancelled`,
      },
      { idempotencyKey: `checkout-${result.bookingId}-${paymentType}` },
    );

    await prisma.payment.create({
      data: {
        bookingId: result.bookingId,
        customerId: customer.id,
        type: paymentType,
        method: "CARD",
        status: "PENDING",
        amountCents: result.pricing.dueTodayCents,
        stripeCheckoutSessionId: session.id,
        stripeCustomerId,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    return handleApiError(err);
  }
}
