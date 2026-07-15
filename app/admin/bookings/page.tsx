import Link from "next/link";
import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import { formatCents } from "@/lib/money";
import { formatTime } from "@/lib/dates";
import { BookingStatusBadge } from "@/components/admin/BookingStatusBadge";

export const dynamic = "force-dynamic";

const STATUSES = [
  "ALL",
  "AWAITING_PAYMENT",
  "CONFIRMED",
  "RESCHEDULED",
  "WEATHER_HOLD",
  "COMPLETED",
  "CANCELLED",
  "REFUNDED",
  "NO_SHOW",
] as const;

export default async function AdminBookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const { status = "ALL", q = "" } = await searchParams;

  const where: Prisma.BookingWhereInput = {
    ...(status !== "ALL" && STATUSES.includes(status as (typeof STATUSES)[number])
      ? { status: status as Prisma.EnumBookingStatusFilter["equals"] }
      : {}),
    ...(q
      ? {
          OR: [
            { confirmationNumber: { contains: q, mode: "insensitive" } },
            { customer: { email: { contains: q, mode: "insensitive" } } },
            { customer: { lastName: { contains: q, mode: "insensitive" } } },
            { customer: { firstName: { contains: q, mode: "insensitive" } } },
          ],
        }
      : {}),
  };

  const bookings = await prisma.booking.findMany({
    where,
    include: { customer: true, package: true },
    orderBy: [{ date: "desc" }, { startTime: "desc" }],
    take: 200,
  });

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold">Bookings</h1>

      <form className="mt-5 flex flex-wrap items-end gap-3" method="get">
        <div>
          <label htmlFor="status" className="field-label">Status</label>
          <select id="status" name="status" defaultValue={status} className="field-input !w-52">
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1 sm:max-w-xs">
          <label htmlFor="q" className="field-label">Search</label>
          <input
            id="q"
            name="q"
            defaultValue={q}
            placeholder="Confirmation, name, or email"
            className="field-input"
          />
        </div>
        <button type="submit" className="btn-primary !min-h-[2.9rem]">Filter</button>
      </form>

      <div className="mt-6 overflow-x-auto rounded-xl bg-white shadow-card">
        <table className="w-full min-w-[56rem] text-left text-sm">
          <thead>
            <tr className="border-b border-cream-200 text-xs uppercase tracking-wide text-navy-500">
              <th className="px-4 py-3">Confirmation</th>
              <th className="px-4 py-3">Trip</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Total</th>
              <th className="px-4 py-3 text-right">Balance</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((b) => {
              const balance = Math.max(0, b.totalCents - b.amountPaidCents - b.refundedCents);
              return (
                <tr key={b.id} className="border-b border-cream-100 hover:bg-cream-50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/bookings/${b.id}`}
                      className="font-semibold text-coastal-700 underline underline-offset-2"
                    >
                      {b.confirmationNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{b.package.name}</td>
                  <td className="whitespace-nowrap px-4 py-3">
                    {b.date} · {formatTime(b.startTime)}
                  </td>
                  <td className="px-4 py-3">
                    {b.customer.firstName} {b.customer.lastName}
                    <span className="block text-xs text-navy-500">{b.customer.email}</span>
                  </td>
                  <td className="px-4 py-3">
                    <BookingStatusBadge status={b.status} />
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">{formatCents(b.totalCents)}</td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {balance > 0 ? (
                      <span className="font-semibold text-tan-700">{formatCents(balance)}</span>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              );
            })}
            {bookings.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-navy-500">
                  No bookings match.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
