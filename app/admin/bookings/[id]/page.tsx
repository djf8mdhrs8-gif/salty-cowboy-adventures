import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { formatCents } from "@/lib/money";
import { formatYmd, formatTime, formatDuration } from "@/lib/dates";
import { BookingStatusBadge } from "@/components/admin/BookingStatusBadge";
import { BookingAdminActions } from "@/components/admin/BookingAdminActions";

export const dynamic = "force-dynamic";

export default async function AdminBookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      customer: true,
      package: true,
      payments: { orderBy: { createdAt: "asc" }, include: { refunds: true } },
      addons: { include: { addon: true } },
      waiverAcceptance: true,
      refunds: true,
      emailLogs: { orderBy: { createdAt: "desc" }, take: 10 },
    },
  });
  if (!booking) notFound();

  const balance = Math.max(0, booking.totalCents - booking.amountPaidCents - booking.refundedCents);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-heading text-2xl font-bold">{booking.confirmationNumber}</h1>
        <BookingStatusBadge status={booking.status} />
      </div>
      <p className="mt-1 text-sm text-navy-600">
        Created {booking.createdAt.toLocaleString()} {booking.createdByAdmin ? "· by admin" : ""}
      </p>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          {/* Trip + customer */}
          <section className="rounded-xl bg-white p-5 shadow-card">
            <h2 className="font-heading text-lg font-bold">Trip details</h2>
            <dl className="mt-3 grid gap-x-6 gap-y-3 sm:grid-cols-2">
              {[
                ["Trip", booking.package.name],
                ["Date", formatYmd(booking.date)],
                ["Departure", formatTime(booking.startTime)],
                ["Duration", formatDuration(booking.durationMinutes)],
                ["Adults", String(booking.adults)],
                ["Children", String(booking.children)],
                ...(booking.rescheduledFromDate
                  ? ([["Rescheduled from", `${booking.rescheduledFromDate} ${booking.rescheduledFromTime}`]] as const)
                  : []),
                ...(booking.cancellationReason
                  ? ([["Cancellation reason", booking.cancellationReason]] as const)
                  : []),
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="text-xs font-bold uppercase tracking-wide text-navy-500">{k}</dt>
                  <dd className="mt-0.5 text-sm font-semibold">{v}</dd>
                </div>
              ))}
            </dl>
            {booking.addons.length > 0 ? (
              <>
                <h3 className="mt-4 text-xs font-bold uppercase tracking-wide text-navy-500">
                  Add-ons
                </h3>
                <ul className="mt-1 text-sm">
                  {booking.addons.map((a) => (
                    <li key={a.id} className="flex justify-between py-0.5">
                      <span>
                        {a.addon.name}
                        {a.quantity > 1 ? ` × ${a.quantity}` : ""}
                      </span>
                      <span className="tabular-nums">{formatCents(a.totalCents)}</span>
                    </li>
                  ))}
                </ul>
              </>
            ) : null}
          </section>

          <section className="rounded-xl bg-white p-5 shadow-card">
            <h2 className="font-heading text-lg font-bold">Customer</h2>
            <dl className="mt-3 grid gap-x-6 gap-y-3 sm:grid-cols-2">
              {[
                [
                  "Name",
                  <Link
                    key="n"
                    href={`/admin/customers/${booking.customerId}`}
                    className="text-coastal-700 underline underline-offset-2"
                  >
                    {booking.customer.firstName} {booking.customer.lastName}
                  </Link>,
                ],
                ["Email", booking.customer.email],
                ["Phone", booking.customer.phone],
                ["Emergency contact", `${booking.emergencyContactName} · ${booking.emergencyContactPhone}`],
                ["Special requests", booking.specialRequests ?? "—"],
                ["Accessibility needs", booking.accessibilityNeeds ?? "—"],
                ...(booking.fishingExperience
                  ? ([["Fishing experience", booking.fishingExperience]] as const)
                  : []),
              ].map(([k, v], i) => (
                <div key={i}>
                  <dt className="text-xs font-bold uppercase tracking-wide text-navy-500">{k}</dt>
                  <dd className="mt-0.5 text-sm font-semibold">{v}</dd>
                </div>
              ))}
            </dl>
            {booking.waiverAcceptance ? (
              <p className="mt-4 rounded-md bg-seafoam-50 p-3 text-xs text-seafoam-800">
                Waivers accepted {booking.waiverAcceptance.acceptedAt.toLocaleString()} — version{" "}
                {booking.waiverAcceptance.policyVersion} (
                {booking.waiverAcceptance.policiesAccepted.join(", ")})
              </p>
            ) : (
              <p className="mt-4 rounded-md bg-red-50 p-3 text-xs text-red-800">
                No waiver acceptance on file.
              </p>
            )}
          </section>

          {/* Payments */}
          <section className="rounded-xl bg-white p-5 shadow-card">
            <h2 className="font-heading text-lg font-bold">Payments</h2>
            <dl className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                ["Total", formatCents(booking.totalCents)],
                ["Paid", formatCents(booking.amountPaidCents)],
                ["Refunded", formatCents(booking.refundedCents)],
                ["Balance", formatCents(balance)],
              ].map(([k, v]) => (
                <div key={k} className="rounded-lg bg-cream-100 p-3">
                  <dt className="text-xs font-bold uppercase tracking-wide text-navy-500">{k}</dt>
                  <dd className="mt-0.5 font-heading font-bold">{v}</dd>
                </div>
              ))}
            </dl>
            <table className="mt-4 w-full text-left text-sm">
              <thead>
                <tr className="border-b border-cream-200 text-xs uppercase tracking-wide text-navy-500">
                  <th className="py-2 pr-3">Type</th>
                  <th className="py-2 pr-3">Method</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2 pr-3 text-right">Amount</th>
                  <th className="py-2">When</th>
                </tr>
              </thead>
              <tbody>
                {booking.payments.map((p) => (
                  <tr key={p.id} className="border-b border-cream-100">
                    <td className="py-2 pr-3">{p.type}</td>
                    <td className="py-2 pr-3">{p.method}</td>
                    <td className="py-2 pr-3">{p.status}</td>
                    <td className="py-2 pr-3 text-right tabular-nums">{formatCents(p.amountCents)}</td>
                    <td className="py-2 text-xs text-navy-500">
                      {(p.paidAt ?? p.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
                {booking.payments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-4 text-center text-navy-500">
                      No payments yet.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
            {booking.refunds.length > 0 ? (
              <p className="mt-3 text-xs text-navy-500">
                Refunds:{" "}
                {booking.refunds
                  .map((r) => `${formatCents(r.amountCents)} (${r.status})`)
                  .join(", ")}
              </p>
            ) : null}
          </section>

          {/* Email history */}
          <section className="rounded-xl bg-white p-5 shadow-card">
            <h2 className="font-heading text-lg font-bold">Recent emails</h2>
            <ul className="mt-3 space-y-1.5 text-sm">
              {booking.emailLogs.map((log) => (
                <li key={log.id} className="flex justify-between gap-3">
                  <span className="truncate">{log.subject}</span>
                  <span className="shrink-0 text-xs text-navy-500">
                    {log.status} · {log.createdAt.toLocaleDateString()}
                  </span>
                </li>
              ))}
              {booking.emailLogs.length === 0 ? (
                <li className="text-navy-500">No emails sent yet.</li>
              ) : null}
            </ul>
          </section>
        </div>

        <BookingAdminActions
          bookingId={booking.id}
          status={booking.status}
          packageSlug={booking.package.slug}
          internalNotes={booking.internalNotes ?? ""}
          balanceCents={balance}
          payments={booking.payments
            .filter((p) => p.status === "PAID" || p.status === "PARTIALLY_REFUNDED")
            .map((p) => ({
              id: p.id,
              label: `${p.type} · ${formatCents(p.amountCents)} · ${p.method}`,
              amountCents: p.amountCents,
              refundedCents: p.refunds
                .filter((r) => r.status !== "FAILED")
                .reduce((s, r) => s + r.amountCents, 0),
              stripe: Boolean(p.stripePaymentIntentId),
            }))}
        />
      </div>
    </div>
  );
}
