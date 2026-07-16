import { formatCents } from "@/lib/money";
import { formatYmd, formatTime, formatDuration } from "@/lib/dates";
import { SITE_NAME, siteUrl } from "@/lib/site";

/**
 * Transactional email templates. Plain, well-structured HTML that renders in
 * every client — no external images, brand colors inlined.
 */

export interface BookingEmailData {
  confirmationNumber: string;
  customerFirstName: string;
  tripName: string;
  date: string; // yyyy-MM-dd
  startTime: string; // HH:mm
  durationMinutes: number;
  guestCount: number;
  amountPaidCents: number;
  remainingBalanceCents: number;
  totalCents: number;
  manageUrl: string;
  marinaAddress: string;
  companyPhone: string;
  companyEmail: string;
}

export interface EmailContent {
  subject: string;
  html: string;
}

const BRAND = {
  navy: "#1b2c42",
  coastal: "#3d829b",
  cream: "#faf5e8",
  tan: "#ad8452",
};

function layout(title: string, bodyHtml: string, footerNote: string): string {
  return `<!doctype html>
<html>
<body style="margin:0;padding:0;background:${BRAND.cream};font-family:Georgia,serif;color:${BRAND.navy};">
  <div style="max-width:560px;margin:0 auto;padding:24px 16px;">
    <div style="text-align:center;padding:20px 0;">
      <img src="${siteUrl()}/logo-email.png" width="88" height="88" alt="${SITE_NAME} logo" style="display:block;margin:0 auto 8px;" />
      <div style="font-size:22px;font-weight:bold;letter-spacing:1px;">${SITE_NAME}</div>
      <div style="font-size:12px;color:${BRAND.coastal};letter-spacing:2px;text-transform:uppercase;">Explore More. Live Salty.</div>
    </div>
    <div style="background:#ffffff;border:1px solid #e3d4bb;border-radius:10px;padding:28px;">
      <h1 style="font-size:20px;margin:0 0 16px;color:${BRAND.navy};">${title}</h1>
      ${bodyHtml}
    </div>
    <p style="font-size:12px;color:#7f5a3c;text-align:center;margin-top:20px;line-height:1.6;">${footerNote}</p>
  </div>
</body>
</html>`;
}

function detailsTable(d: BookingEmailData): string {
  const rows: Array<[string, string]> = [
    ["Confirmation #", d.confirmationNumber],
    ["Trip", d.tripName],
    ["Date", formatYmd(d.date)],
    ["Departure", formatTime(d.startTime)],
    ["Duration", formatDuration(d.durationMinutes)],
    ["Guests", String(d.guestCount)],
    ["Paid", formatCents(d.amountPaidCents)],
    ["Balance due", formatCents(d.remainingBalanceCents)],
    ["Departs from", d.marinaAddress],
  ];
  return `<table style="width:100%;border-collapse:collapse;font-size:14px;margin:16px 0;">
    ${rows
      .map(
        ([k, v]) =>
          `<tr><td style="padding:6px 0;color:#997046;white-space:nowrap;padding-right:16px;">${k}</td><td style="padding:6px 0;font-weight:bold;">${v}</td></tr>`,
      )
      .join("")}
  </table>`;
}

function manageButton(url: string, label = "Manage your booking"): string {
  return `<p style="text-align:center;margin:24px 0 8px;">
    <a href="${url}" style="background:${BRAND.navy};color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:6px;font-size:15px;display:inline-block;">${label}</a>
  </p>`;
}

function contactLine(d: BookingEmailData): string {
  return `<p style="font-size:13px;color:#684a35;">Questions? Call us at ${d.companyPhone} or reply to this email (${d.companyEmail}).</p>`;
}

const FOOTER = `${SITE_NAME} · This mailbox is monitored — reply anytime.`;

export function bookingConfirmationEmail(d: BookingEmailData): EmailContent {
  return {
    subject: `You're booked! ${d.tripName} on ${formatYmd(d.date, "MMM d")} — ${d.confirmationNumber}`,
    html: layout(
      "Saddle up — your adventure is confirmed!",
      `<p style="font-size:15px;line-height:1.6;">Howdy ${d.customerFirstName},</p>
       <p style="font-size:15px;line-height:1.6;">Your trip with ${SITE_NAME} is confirmed. Here are your details:</p>
       ${detailsTable(d)}
       ${d.remainingBalanceCents > 0 ? `<p style="font-size:14px;line-height:1.6;background:${BRAND.cream};padding:12px;border-radius:6px;">A balance of <strong>${formatCents(d.remainingBalanceCents)}</strong> remains — you can pay it any time from your booking page, or settle up at the dock.</p>` : ""}
       <p style="font-size:14px;line-height:1.6;">Please arrive 15 minutes before departure. Bring sunscreen, sunglasses, and anything on your trip's "what to bring" list.</p>
       ${manageButton(d.manageUrl)}
       ${contactLine(d)}`,
      FOOTER,
    ),
  };
}

export function paymentReceiptEmail(
  d: BookingEmailData,
  paidNowCents: number,
): EmailContent {
  return {
    subject: `Payment received — ${formatCents(paidNowCents)} for ${d.confirmationNumber}`,
    html: layout(
      "Payment received",
      `<p style="font-size:15px;line-height:1.6;">Howdy ${d.customerFirstName},</p>
       <p style="font-size:15px;line-height:1.6;">We received your payment of <strong>${formatCents(paidNowCents)}</strong> for booking <strong>${d.confirmationNumber}</strong>.</p>
       ${detailsTable(d)}
       ${manageButton(d.manageUrl)}
       ${contactLine(d)}`,
      FOOTER,
    ),
  };
}

export function paymentFailedEmail(d: BookingEmailData): EmailContent {
  return {
    subject: `Payment issue with your booking ${d.confirmationNumber}`,
    html: layout(
      "There was a problem with your payment",
      `<p style="font-size:15px;line-height:1.6;">Howdy ${d.customerFirstName},</p>
       <p style="font-size:15px;line-height:1.6;">Your recent payment for <strong>${d.tripName}</strong> didn't go through, and your spot isn't locked in yet. No charge was made.</p>
       <p style="font-size:15px;line-height:1.6;">You can try again with a different card from your booking page:</p>
       ${manageButton(d.manageUrl, "Retry payment")}
       ${contactLine(d)}`,
      FOOTER,
    ),
  };
}

export function tripReminderEmail(d: BookingEmailData, daysOut: number): EmailContent {
  const when = daysOut <= 1 ? "tomorrow" : `in ${daysOut} days`;
  return {
    subject: `Your ${d.tripName} is ${when}! — ${d.confirmationNumber}`,
    html: layout(
      `Your adventure is ${when}`,
      `<p style="font-size:15px;line-height:1.6;">Howdy ${d.customerFirstName},</p>
       <p style="font-size:15px;line-height:1.6;">Just a friendly heads-up from the crew — your trip is coming up ${when}.</p>
       ${detailsTable(d)}
       <p style="font-size:14px;line-height:1.6;">Please arrive 15 minutes early. If weather looks questionable, we'll reach out — see our weather policy on your booking page.</p>
       ${manageButton(d.manageUrl)}
       ${contactLine(d)}`,
      FOOTER,
    ),
  };
}

export function balanceReminderEmail(d: BookingEmailData): EmailContent {
  return {
    subject: `Balance due for your upcoming trip — ${d.confirmationNumber}`,
    html: layout(
      "A balance remains on your booking",
      `<p style="font-size:15px;line-height:1.6;">Howdy ${d.customerFirstName},</p>
       <p style="font-size:15px;line-height:1.6;">Your <strong>${d.tripName}</strong> on ${formatYmd(d.date)} has an outstanding balance of <strong>${formatCents(d.remainingBalanceCents)}</strong>.</p>
       <p style="font-size:15px;line-height:1.6;">You can settle it online in a minute:</p>
       ${manageButton(d.manageUrl, "Pay remaining balance")}
       ${contactLine(d)}`,
      FOOTER,
    ),
  };
}

export function bookingRescheduledEmail(
  d: BookingEmailData,
  fromDate: string,
  fromTime: string,
): EmailContent {
  return {
    subject: `Your booking has been rescheduled — ${d.confirmationNumber}`,
    html: layout(
      "Your trip has a new date",
      `<p style="font-size:15px;line-height:1.6;">Howdy ${d.customerFirstName},</p>
       <p style="font-size:15px;line-height:1.6;">Your <strong>${d.tripName}</strong> originally set for ${formatYmd(fromDate)} at ${formatTime(fromTime)} has been moved to:</p>
       ${detailsTable(d)}
       ${manageButton(d.manageUrl)}
       ${contactLine(d)}`,
      FOOTER,
    ),
  };
}

export function bookingCancelledEmail(d: BookingEmailData, reason?: string): EmailContent {
  return {
    subject: `Your booking has been cancelled — ${d.confirmationNumber}`,
    html: layout(
      "Booking cancelled",
      `<p style="font-size:15px;line-height:1.6;">Howdy ${d.customerFirstName},</p>
       <p style="font-size:15px;line-height:1.6;">Your <strong>${d.tripName}</strong> on ${formatYmd(d.date)} has been cancelled${reason ? ` (${reason})` : ""}.</p>
       <p style="font-size:15px;line-height:1.6;">If a refund applies under our cancellation policy, you'll receive a separate confirmation once it's processed.</p>
       ${contactLine(d)}`,
      FOOTER,
    ),
  };
}

export function refundIssuedEmail(d: BookingEmailData, refundCents: number): EmailContent {
  return {
    subject: `Refund issued — ${formatCents(refundCents)} for ${d.confirmationNumber}`,
    html: layout(
      "Your refund is on its way",
      `<p style="font-size:15px;line-height:1.6;">Howdy ${d.customerFirstName},</p>
       <p style="font-size:15px;line-height:1.6;">We've issued a refund of <strong>${formatCents(refundCents)}</strong> for booking <strong>${d.confirmationNumber}</strong>. Depending on your bank, it can take 5–10 business days to appear.</p>
       ${contactLine(d)}`,
      FOOTER,
    ),
  };
}

export function weatherDelayEmail(d: BookingEmailData): EmailContent {
  return {
    subject: `Weather update for your trip — ${d.confirmationNumber}`,
    html: layout(
      "Weather hold on your trip",
      `<p style="font-size:15px;line-height:1.6;">Howdy ${d.customerFirstName},</p>
       <p style="font-size:15px;line-height:1.6;">The captain is watching conditions for your <strong>${d.tripName}</strong> on ${formatYmd(d.date)}. Your booking is on a temporary weather hold — we'll confirm, reschedule, or refund per our weather policy as the forecast firms up.</p>
       ${manageButton(d.manageUrl)}
       ${contactLine(d)}`,
      FOOTER,
    ),
  };
}

export function weatherCancellationEmail(d: BookingEmailData): EmailContent {
  return {
    subject: `Trip cancelled due to weather — ${d.confirmationNumber}`,
    html: layout(
      "Cancelled for weather — let's make it right",
      `<p style="font-size:15px;line-height:1.6;">Howdy ${d.customerFirstName},</p>
       <p style="font-size:15px;line-height:1.6;">For everyone's safety, the captain has called off your <strong>${d.tripName}</strong> on ${formatYmd(d.date)} due to weather.</p>
       <p style="font-size:15px;line-height:1.6;">Per our weather policy you're entitled to a free reschedule or a full refund — reply to this email or use your booking page to choose.</p>
       ${manageButton(d.manageUrl)}
       ${contactLine(d)}`,
      FOOTER,
    ),
  };
}

export function magicLinkEmail(params: {
  customerFirstName: string;
  confirmationNumber: string;
  manageUrl: string;
}): EmailContent {
  return {
    subject: `Your booking access link — ${params.confirmationNumber}`,
    html: layout(
      "Access your booking",
      `<p style="font-size:15px;line-height:1.6;">Howdy ${params.customerFirstName},</p>
       <p style="font-size:15px;line-height:1.6;">Use the secure link below to view or manage booking <strong>${params.confirmationNumber}</strong>. The link expires in 72 hours.</p>
       ${manageButton(params.manageUrl, "Open my booking")}
       <p style="font-size:13px;color:#684a35;">If you didn't request this link, you can safely ignore this email.</p>`,
      FOOTER,
    ),
  };
}
