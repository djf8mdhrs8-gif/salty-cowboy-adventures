import "server-only";
import type { Booking, Customer, TripPackage, SiteSettings } from "@prisma/client";
import { sendEmail } from "@/lib/email/send";
import { formatCents } from "@/lib/money";
import { formatYmd, formatTime, formatDuration } from "@/lib/dates";
import { siteUrl } from "@/lib/site";

type BookingFull = Booking & { customer: Customer; package: TripPackage };

/**
 * Owner notifications for new bookings: an email to the business inbox
 * (always, when email is configured) and an SMS via Twilio (only when the
 * TWILIO_* env vars are set — see .env.example). Failures never break the
 * customer's booking.
 */
export async function notifyOwnerOfNewBooking(
  booking: BookingFull,
  settings: SiteSettings,
): Promise<void> {
  const guests = booking.adults + booking.children;
  const balance = Math.max(
    0,
    booking.totalCents - booking.amountPaidCents - booking.refundedCents,
  );
  const when = `${formatYmd(booking.date, "EEE, MMM d")} at ${formatTime(booking.startTime)}`;

  // ── Email to the business inbox ────────────────────────────────────
  await sendEmail({
    to: settings.email,
    type: "OWNER_NEW_BOOKING",
    bookingId: booking.id,
    content: {
      subject: `🎣 New booking: ${booking.package.name} — ${when} (${guests} guests)`,
      html: `<div style="font-family:Georgia,serif;color:#1b2c42;max-width:520px;">
        <h2 style="margin:0 0 12px;">New booking on the calendar</h2>
        <table style="border-collapse:collapse;font-size:15px;">
          ${[
            ["Trip", booking.package.name],
            ["When", `${formatYmd(booking.date)} · ${formatTime(booking.startTime)} · ${formatDuration(booking.durationMinutes)}`],
            ["Guests", `${booking.adults} adults${booking.children ? `, ${booking.children} children` : ""}`],
            ["Customer", `${booking.customer.firstName} ${booking.customer.lastName}`],
            ["Phone", booking.customer.phone],
            ["Email", booking.customer.email],
            ["Paid", formatCents(booking.amountPaidCents)],
            ["Balance due", formatCents(balance)],
            ["Confirmation", booking.confirmationNumber],
            ...(booking.specialRequests ? [["Requests", booking.specialRequests]] : []),
          ]
            .map(
              ([k, v]) =>
                `<tr><td style="padding:4px 16px 4px 0;color:#7f5a3c;white-space:nowrap;">${k}</td><td style="padding:4px 0;font-weight:bold;">${v}</td></tr>`,
            )
            .join("")}
        </table>
        <p style="margin-top:16px;">
          <a href="${siteUrl()}/admin/bookings/${booking.id}" style="background:#1b2c42;color:#fff;text-decoration:none;padding:10px 22px;border-radius:6px;display:inline-block;">Open in admin</a>
        </p>
      </div>`,
    },
  });

  // ── SMS via Twilio (optional) ──────────────────────────────────────
  await sendOwnerSms(
    `🎣 New booking: ${booking.package.name}, ${when}, ${guests} guests — ` +
      `${booking.customer.firstName} ${booking.customer.lastName} (${booking.customer.phone}). ` +
      `Paid ${formatCents(booking.amountPaidCents)}${balance > 0 ? `, balance ${formatCents(balance)}` : ""}.`,
  );
}

/**
 * Send an SMS to the owner's phone through Twilio's REST API. Silently
 * skipped unless TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER,
 * and BOOKING_ALERT_PHONE are all configured.
 */
export async function sendOwnerSms(body: string): Promise<void> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_NUMBER;
  const to = process.env.BOOKING_ALERT_PHONE;
  if (!sid || !token || !from || !to) return;

  try {
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ From: from, To: to, Body: body }),
      },
    );
    if (!res.ok) {
      console.error("Twilio SMS failed:", res.status, await res.text());
    }
  } catch (err) {
    console.error("Twilio SMS error:", err);
  }
}
