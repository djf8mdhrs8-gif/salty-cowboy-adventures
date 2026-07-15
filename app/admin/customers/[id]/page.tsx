import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { formatCents } from "@/lib/money";
import { formatTime } from "@/lib/dates";
import { BookingStatusBadge } from "@/components/admin/BookingStatusBadge";

export const dynamic = "force-dynamic";

export default async function AdminCustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      bookings: {
        include: { package: true },
        orderBy: [{ date: "desc" }],
      },
      payments: { orderBy: { createdAt: "desc" }, take: 20 },
      waiverAcceptances: { orderBy: { acceptedAt: "desc" } },
    },
  });
  if (!customer) notFound();

  const totalSpent = customer.bookings.reduce(
    (s, b) => s + b.amountPaidCents - b.refundedCents,
    0,
  );

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold">
        {customer.firstName} {customer.lastName}
      </h1>
      <p className="mt-1 text-sm text-navy-600">
        {customer.email} · {customer.phone} · customer since{" "}
        {customer.createdAt.toLocaleDateString()}
      </p>

      <dl className="mt-6 grid gap-4 sm:grid-cols-3">
        {[
          ["Bookings", String(customer.bookings.length)],
          ["Total spent", formatCents(totalSpent)],
          ["Waivers on file", String(customer.waiverAcceptances.length)],
        ].map(([k, v]) => (
          <div key={k} className="rounded-xl bg-white p-5 shadow-card">
            <dt className="text-xs font-bold uppercase tracking-wide text-navy-500">{k}</dt>
            <dd className="mt-1 font-heading text-2xl font-bold">{v}</dd>
          </div>
        ))}
      </dl>

      <section className="mt-8 rounded-xl bg-white p-5 shadow-card">
        <h2 className="font-heading text-lg font-bold">Booking history</h2>
        <ul className="mt-3 divide-y divide-cream-200">
          {customer.bookings.map((b) => (
            <li key={b.id}>
              <Link
                href={`/admin/bookings/${b.id}`}
                className="flex flex-wrap items-center justify-between gap-2 py-3 hover:bg-cream-50"
              >
                <span>
                  <span className="font-semibold">
                    {b.date} · {formatTime(b.startTime)} — {b.package.name}
                  </span>
                  <span className="block text-sm text-navy-600">
                    {b.confirmationNumber} · {formatCents(b.totalCents)} total ·{" "}
                    {formatCents(b.amountPaidCents)} paid
                  </span>
                </span>
                <BookingStatusBadge status={b.status} />
              </Link>
            </li>
          ))}
          {customer.bookings.length === 0 ? (
            <li className="py-3 text-sm text-navy-500">No bookings yet.</li>
          ) : null}
        </ul>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl bg-white p-5 shadow-card">
          <h2 className="font-heading text-lg font-bold">Payment history</h2>
          <ul className="mt-3 space-y-1.5 text-sm">
            {customer.payments.map((p) => (
              <li key={p.id} className="flex justify-between gap-3">
                <span>
                  {p.type} · {p.method} · {p.status}
                </span>
                <span className="tabular-nums">
                  {formatCents(p.amountCents)} ·{" "}
                  <span className="text-xs text-navy-500">
                    {(p.paidAt ?? p.createdAt).toLocaleDateString()}
                  </span>
                </span>
              </li>
            ))}
            {customer.payments.length === 0 ? (
              <li className="text-navy-500">No payments.</li>
            ) : null}
          </ul>
        </section>

        <section className="rounded-xl bg-white p-5 shadow-card">
          <h2 className="font-heading text-lg font-bold">Waiver acceptances</h2>
          <ul className="mt-3 space-y-1.5 text-sm">
            {customer.waiverAcceptances.map((w) => (
              <li key={w.id}>
                Version {w.policyVersion} — {w.acceptedAt.toLocaleString()}
                <span className="block text-xs text-navy-500">
                  {w.policiesAccepted.join(", ")}
                </span>
              </li>
            ))}
            {customer.waiverAcceptances.length === 0 ? (
              <li className="text-navy-500">None on file.</li>
            ) : null}
          </ul>
          {customer.notes ? (
            <>
              <h3 className="mt-4 text-xs font-bold uppercase tracking-wide text-navy-500">Notes</h3>
              <p className="mt-1 text-sm">{customer.notes}</p>
            </>
          ) : null}
        </section>
      </div>
    </div>
  );
}
