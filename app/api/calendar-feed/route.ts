import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { prisma } from "@/lib/db";
import { getSettings } from "@/lib/server/settings";
import { generateIcsFeed, type FeedEvent } from "@/lib/ics";
import { formatCents } from "@/lib/money";
import { dateToYmd } from "@/lib/availability";

export const dynamic = "force-dynamic";

function keysMatch(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

/**
 * GET /api/calendar-feed?key=… — iCal subscription feed of bookings and
 * blocked dates for the captain's calendar app (Outlook/Apple/Google).
 * Protected by the secret feed key shown in Admin → Settings.
 */
export async function GET(req: Request) {
  const key = new URL(req.url).searchParams.get("key") ?? "";
  const settings = await getSettings();
  if (!key || !keysMatch(key, settings.calendarFeedKey)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // 30 days of history plus everything upcoming.
  const from = new Date();
  from.setDate(from.getDate() - 30);
  const fromYmd = dateToYmd(from);

  const [bookings, blockedDates] = await Promise.all([
    prisma.booking.findMany({
      where: {
        date: { gte: fromYmd },
        status: { in: ["CONFIRMED", "RESCHEDULED", "WEATHER_HOLD", "COMPLETED"] },
      },
      include: {
        customer: true,
        package: { select: { name: true } },
      },
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
    }),
    prisma.blockedDate.findMany({ where: { date: { gte: fromYmd } } }),
  ]);

  const events: FeedEvent[] = bookings.map((b) => {
    const guests = b.adults + b.children;
    const balance = Math.max(0, b.totalCents - b.amountPaidCents - b.refundedCents);
    const flags =
      b.status === "WEATHER_HOLD" ? "⛈ WEATHER HOLD — " : "";
    return {
      uid: `booking-${b.id}@saltycowboyadventures`,
      summary: `${flags}${b.package.name} — ${b.customer.firstName} ${b.customer.lastName} (${guests})`,
      description: [
        `Confirmation: ${b.confirmationNumber}`,
        `Guests: ${b.adults} adults${b.children ? `, ${b.children} children` : ""}`,
        `Customer: ${b.customer.firstName} ${b.customer.lastName} · ${b.customer.phone} · ${b.customer.email}`,
        `Paid: ${formatCents(b.amountPaidCents)} · Balance due: ${formatCents(balance)}`,
        b.specialRequests ? `Requests: ${b.specialRequests}` : "",
        b.accessibilityNeeds ? `Accessibility: ${b.accessibilityNeeds}` : "",
      ]
        .filter(Boolean)
        .join("\n"),
      location: b.pickupLocation ?? settings.marinaAddress,
      date: b.date,
      startTime: b.startTime,
      durationMinutes: b.durationMinutes,
      lastModified: b.updatedAt,
    };
  });

  for (const block of blockedDates) {
    events.push({
      uid: `block-${block.id}@saltycowboyadventures`,
      summary: `🚫 Blocked${block.reason ? ` — ${block.reason}` : ""}`,
      description: block.startTime
        ? `Blocked ${block.startTime}–${block.endTime}`
        : "Whole day blocked",
      location: "",
      ...(block.startTime && block.endTime
        ? {
            date: block.date,
            startTime: block.startTime,
            durationMinutes: minutesBetween(block.startTime, block.endTime),
          }
        : { allDayDate: block.date }),
    });
  }

  const ics = generateIcsFeed("Salty Cowboy Bookings", events);
  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Cache-Control": "private, max-age=300",
    },
  });
}

function minutesBetween(start: string, end: string): number {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  return Math.max(15, eh * 60 + em - (sh * 60 + sm));
}
