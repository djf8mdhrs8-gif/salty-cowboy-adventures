import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateIcs } from "@/lib/ics";
import { getSettings } from "@/lib/server/settings";
import { handleApiError } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

/**
 * GET /api/calendar?session_id=cs_… — downloadable .ics for a booking,
 * authorized by the customer's checkout session id (high entropy).
 */
export async function GET(req: Request) {
  try {
    const sessionId = new URL(req.url).searchParams.get("session_id");
    if (!sessionId || !sessionId.startsWith("cs_")) {
      return NextResponse.json({ error: "Invalid session" }, { status: 400 });
    }
    const payment = await prisma.payment.findUnique({
      where: { stripeCheckoutSessionId: sessionId },
      include: { booking: { include: { package: true } } },
    });
    if (!payment) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const settings = await getSettings();
    const b = payment.booking;
    const ics = generateIcs({
      confirmationNumber: b.confirmationNumber,
      tripName: b.package.name,
      date: b.date,
      startTime: b.startTime,
      durationMinutes: b.durationMinutes,
      location: settings.marinaAddress,
      description: `Confirmation ${b.confirmationNumber}. Arrive 15 minutes early. Questions: ${settings.phone}`,
    });
    return new Response(ics, {
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": `attachment; filename="${b.confirmationNumber}.ics"`,
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}
