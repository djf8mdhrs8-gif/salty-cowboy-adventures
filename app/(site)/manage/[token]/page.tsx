import type { Metadata } from "next";
import Link from "next/link";
import { bookingFromManageToken } from "@/lib/server/manage-auth";
import { getSettings } from "@/lib/server/settings";
import { formatCents } from "@/lib/money";
import { formatYmd, formatTime, formatDuration } from "@/lib/dates";
import { ManageActions } from "@/components/manage/ManageActions";
import { POLICY_LABELS, POLICY_KEYS } from "@/lib/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Your booking",
  robots: { index: false },
};

const STATUS_LABELS: Record<string, { label: string; tone: string }> = {
  PENDING: { label: "Pending", tone: "bg-tan-100 text-tan-800" },
  AWAITING_PAYMENT: { label: "Awaiting payment", tone: "bg-tan-100 text-tan-800" },
  CONFIRMED: { label: "Confirmed", tone: "bg-seafoam-100 text-seafoam-800" },
  RESCHEDULED: { label: "Rescheduled", tone: "bg-coastal-100 text-coastal-800" },
  COMPLETED: { label: "Completed", tone: "bg-navy-100 text-navy-800" },
  CANCELLED: { label: "Cancelled", tone: "bg-red-100 text-red-800" },
  REFUNDED: { label: "Refunded", tone: "bg-red-100 text-red-800" },
  WEATHER_HOLD: { label: "Weather hold", tone: "bg-coastal-100 text-coastal-800" },
  NO_SHOW: { label: "No-show", tone: "bg-red-100 text-red-800" },
};

export default async function ManageBookingPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const booking = await bookingFromManageToken(token);

  if (!booking) {
    return (
      <div className="bg-cream-50 py-14">
        <div className="container-content max-w-lg text-center">
          <h1 className="text-3xl font-bold">Link expired</h1>
          <p className="mt-3 text-navy-600">
            This booking link is invalid or has expired for your security.
          </p>
          <Link href="/manage" className="btn-primary mt-6">
            Request a new link
          </Link>
        </div>
      </div>
    );
  }

  const settings = await getSettings();
  const status = STATUS_LABELS[booking.status] ?? STATUS_LABELS.PENDING;
  const balance = Math.max(
    0,
    booking.totalCents - booking.amountPaidCents - booking.refundedCents,
  );
  const modifiable = ["CONFIRMED", "RESCHEDULED", "WEATHER_HOLD", "AWAITING_PAYMENT"].includes(
    booking.status,
  );

  return (
    <div className="bg-cream-50 py-12">
      <div className="container-content max-w-3xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-3xl font-bold">Your booking</h1>
          <span className={`rounded-full px-3.5 py-1.5 text-xs font-bold uppercase tracking-wide ${status.tone}`}>
            {status.label}
          </span>
        </div>
        <p className="mt-1 text-navy-600">
          Confirmation{" "}
          <span className="font-heading font-bold text-navy-900">{booking.confirmationNumber}</span>
        </p>

        <div className="mt-6 overflow-hidden rounded-xl border border-tan-200 bg-white shadow-card">
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
              ["Trip total", formatCents(booking.totalCents)],
              ["Paid", formatCents(booking.amountPaidCents)],
              ...(booking.refundedCents > 0
                ? ([["Refunded", formatCents(booking.refundedCents)]] as const)
                : []),
              ["Balance due", formatCents(balance)],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="text-xs font-bold uppercase tracking-wide text-navy-500">{k}</dt>
                <dd className="mt-0.5 font-semibold text-navy-900">{v}</dd>
              </div>
            ))}
          </dl>
          {booking.addons.length > 0 ? (
            <div className="border-t border-tan-100 px-6 py-4">
              <h2 className="text-xs font-bold uppercase tracking-wide text-navy-500">Add-ons</h2>
              <ul className="mt-2 space-y-1 text-sm text-navy-800">
                {booking.addons.map((a, i) => (
                  <li key={i} className="flex justify-between">
                    <span>
                      {a.addon.name}
                      {a.quantity > 1 ? ` × ${a.quantity}` : ""}
                    </span>
                    <span className="tabular-nums">{formatCents(a.totalCents)}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>

        <div className="mt-8">
          <ManageActions
            token={token}
            packageSlug={booking.package.slug}
            balanceCents={balance}
            modifiable={modifiable}
            details={{
              phone: booking.customer.phone,
              emergencyContactName: booking.emergencyContactName,
              emergencyContactPhone: booking.emergencyContactPhone,
              specialRequests: booking.specialRequests ?? "",
              accessibilityNeeds: booking.accessibilityNeeds ?? "",
            }}
          />
        </div>

        <section className="mt-10 rounded-xl border border-tan-200 bg-cream-100 p-6 text-sm leading-relaxed text-navy-700">
          <h2 className="font-heading text-base font-bold text-navy-900">Policies</h2>
          <ul className="mt-2 flex flex-wrap gap-x-5 gap-y-1">
            {POLICY_KEYS.map((key) => (
              <li key={key}>
                <Link href={POLICY_LABELS[key].href} className="underline underline-offset-4">
                  {POLICY_LABELS[key].label}
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-4">
            Need help? Call {settings.phone} or email{" "}
            <a href={`mailto:${settings.email}`} className="underline underline-offset-4">
              {settings.email}
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
