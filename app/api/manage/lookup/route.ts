import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { lookupRequestSchema } from "@/lib/validation/booking";
import { handleApiError, tooManyRequests } from "@/lib/api-helpers";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { issueManageToken } from "@/lib/server/manage-token";
import { sendEmail } from "@/lib/email/send";
import { magicLinkEmail } from "@/lib/email/templates";
import { siteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

/**
 * POST /api/manage/lookup — customer booking lookup. On a confirmation-number
 * + email match, a magic link is emailed. The response is identical whether
 * or not a booking matched, so the endpoint can't be used to probe bookings.
 */
export async function POST(req: Request) {
  try {
    const rl = rateLimit(`lookup:${clientIp(req)}`, { limit: 5, windowSeconds: 600 });
    if (!rl.ok) return tooManyRequests(rl.retryAfterSeconds);

    const { confirmationNumber, email } = lookupRequestSchema.parse(await req.json());

    const booking = await prisma.booking.findUnique({
      where: { confirmationNumber: confirmationNumber.toUpperCase().trim() },
      include: { customer: true },
    });

    if (booking && booking.customer.email === email.toLowerCase().trim()) {
      const token = await issueManageToken(booking.id);
      await sendEmail({
        to: booking.customer.email,
        type: "MAGIC_LINK",
        content: magicLinkEmail({
          customerFirstName: booking.customer.firstName,
          confirmationNumber: booking.confirmationNumber,
          manageUrl: `${siteUrl()}/manage/${token}`,
        }),
        bookingId: booking.id,
      });
    }

    // Deliberately identical response for hit and miss.
    return NextResponse.json({
      message:
        "If that confirmation number and email match a booking, we've emailed you a secure access link (valid 72 hours).",
    });
  } catch (err) {
    return handleApiError(err);
  }
}
