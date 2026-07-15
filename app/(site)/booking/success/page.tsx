import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  CheckCircle2,
  CalendarPlus,
  Download,
  Printer,
  Phone,
} from "lucide-react";
import { prisma } from "@/lib/db";
import { getSettings } from "@/lib/server/settings";
import { formatCents } from "@/lib/money";
import { formatYmd, formatTime, formatDuration } from "@/lib/dates";
import { googleCalendarUrl } from "@/lib/ics";
import { ConfirmationPoller } from "@/components/booking/ConfirmationPoller";
import { PrintButton } from "@/components/booking/PrintButton";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Booking confirmation",
  robots: { index: false },
};

interface Props {
  searchParams: Promise<{ session_id?: string }>;
}

export default async function BookingSuccessPage({ searchParams }: Props) {
  const { session_id: sessionId } = await searchParams;
  if (!sessionId?.startsWith("cs_")) notFound();

  const payment = await prisma.payment.findUnique({
    where: { stripeCheckoutSessionId: sessionId },
    include: {
      booking: {
        include: { package: true, customer: true },
      },
    },
  });
  if (!payment) notFound();

  const booking = payment.booking;
  const settings = await getSettings();
  const confirmed = payment.status === "PAID";
  const balance = Math.max(
    0,
    booking.totalCents - booking.amountPaidCents - booking.refundedCents,
  );

  const calendarEvent = {
    confirmationNumber: booking.confirmationNumber,
    tripName: booking.package.name,
    date: booking.date,
    startTime: booking.startTime,
    durationMinutes: booking.durationMinutes,
    location: settings.marinaAddress,
    description: `Confirmation ${booking.confirmationNumber}. Arrive 15 minutes early.`,
  };

  return (
    <div className="bg-cream-50 py-12">
      <div className="container-content max-w-3xl">
        {!confirmed ? (
          <>
            <h1 className="text-3xl font-bold">Almost there…</h1>
            <div className="mt-6">
              <ConfirmationPoller
                sessionId={sessionId}
                tripSlug={booking.package.slug}
                dueTodayCents={payment.amountCents}
              />
            </div>
          </>
        ) : (
          <>
            <div className="text-center">
              <CheckCircle2 className="mx-auto h-14 w-14 text-seafoam-600" aria-hidden />
              <h1 className="mt-4 text-3xl font-bold sm:text-4xl">
                You&apos;re booked, partner!
              </h1>
              <p className="mt-3 text-lg text-navy-600">
                Confirmation number{" "}
                <span className="font-heading font-bold text-navy-900">
                  {booking.confirmationNumber}
                </span>{" "}
                — a confirmation email is on its way to {booking.customer.email}.
              </p>
            </div>

            <div className="mt-8 overflow-hidden rounded-xl border border-tan-200 bg-white shadow-card">
              <div className="rope-divider" role="presentation" />
              <dl className="grid gap-x-8 gap-y-4 p-6 sm:grid-cols-2">
                {[
                  ["Trip", booking.package.name],
                  ["Date", formatYmd(booking.date)],
                  ["Departure", formatTime(booking.startTime)],
                  ["Duration", formatDuration(booking.durationMinutes)],
                  [
                    "Guests",
                    `${booking.adults} adult${booking.adults === 1 ? "" : "s"}${booking.children ? `, ${booking.children} child${booking.children === 1 ? "" : "ren"}` : ""}`,
                  ],
                  ["Departs from", booking.pickupLocation ?? settings.marinaAddress],
                  ["Amount paid", formatCents(booking.amountPaidCents)],
                  ["Remaining balance", formatCents(balance)],
                ].map(([k, v]) => (
                  <div key={k}>
                    <dt className="text-xs font-bold uppercase tracking-wide text-navy-500">{k}</dt>
                    <dd className="mt-0.5 font-semibold text-navy-900">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 no-print">
              <a
                href={googleCalendarUrl(calendarEvent)}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary"
              >
                <CalendarPlus className="h-5 w-5" aria-hidden /> Add to Google Calendar
              </a>
              <a
                href={`/api/calendar?session_id=${encodeURIComponent(sessionId)}`}
                className="btn-secondary"
              >
                <Download className="h-5 w-5" aria-hidden /> Download calendar file
              </a>
              <PrintButton className="btn-secondary">
                <Printer className="h-5 w-5" aria-hidden /> Print confirmation
              </PrintButton>
              <a href={`tel:${settings.phone.replace(/[^+\d]/g, "")}`} className="btn-secondary">
                <Phone className="h-5 w-5" aria-hidden /> Contact captain
              </a>
            </div>

            <section className="mt-8 rounded-xl border border-tan-200 bg-cream-100 p-6">
              <h2 className="text-xl font-bold">What to bring</h2>
              <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-navy-700">
                {booking.package.whatToBring.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <p className="mt-4 text-sm text-navy-600">
                Please arrive 15 minutes before departure.{" "}
                {balance > 0
                  ? `Your remaining balance of ${formatCents(balance)} can be paid from your booking page or at the dock.`
                  : "You're fully paid — just show up ready for a great day."}
              </p>
            </section>

            <section className="mt-6 text-sm leading-relaxed text-navy-600">
              <h2 className="font-heading text-base font-bold text-navy-900">
                Need to make a change?
              </h2>
              <p className="mt-2">
                Manage, reschedule, or cancel from{" "}
                <Link href="/manage" className="font-semibold underline underline-offset-4">
                  your booking page
                </Link>{" "}
                (you&apos;ll need your confirmation number and email). Cancellations follow our{" "}
                <Link href="/policies/cancellation" className="underline underline-offset-4">
                  cancellation policy
                </Link>
                . Questions? Call {settings.phone} or email {settings.email}.
              </p>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
