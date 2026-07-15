import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatCents } from "@/lib/money";
import { formatTime, formatYmd } from "@/lib/dates";
import { dateToYmd } from "@/lib/availability";
import { BookingStatusBadge } from "@/components/admin/BookingStatusBadge";

export const dynamic = "force-dynamic";

const ACTIVE = ["CONFIRMED", "RESCHEDULED", "WEATHER_HOLD"] as const;

export default async function AdminDashboardPage() {
  const today = dateToYmd(new Date());
  const monthStart = today.slice(0, 8) + "01";

  const [
    todaysTrips,
    upcomingTrips,
    monthlyBookings,
    monthlyRevenue,
    outstanding,
    recentCancellations,
    weatherHolds,
  ] = await Promise.all([
    prisma.booking.findMany({
      where: { date: today, status: { in: [...ACTIVE] } },
      include: { customer: true, package: true },
      orderBy: { startTime: "asc" },
    }),
    prisma.booking.findMany({
      where: { date: { gt: today }, status: { in: [...ACTIVE] } },
      include: { customer: true, package: true },
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
      take: 8,
    }),
    prisma.booking.count({
      where: { createdAt: { gte: new Date(monthStart) }, status: { notIn: ["CANCELLED", "PENDING", "AWAITING_PAYMENT"] } },
    }),
    prisma.payment.aggregate({
      where: { status: "PAID", paidAt: { gte: new Date(monthStart) } },
      _sum: { amountCents: true },
    }),
    prisma.booking.findMany({
      where: { status: { in: [...ACTIVE] }, date: { gte: today } },
      select: { totalCents: true, amountPaidCents: true, refundedCents: true },
    }),
    prisma.booking.findMany({
      where: { status: { in: ["CANCELLED", "REFUNDED"] } },
      include: { customer: true, package: true },
      orderBy: { cancelledAt: "desc" },
      take: 5,
    }),
    prisma.booking.findMany({
      where: { status: "WEATHER_HOLD" },
      include: { customer: true, package: true },
      orderBy: [{ date: "asc" }],
    }),
  ]);

  const outstandingCents = outstanding.reduce(
    (sum, b) => sum + Math.max(0, b.totalCents - b.amountPaidCents - b.refundedCents),
    0,
  );

  const stats = [
    { label: "Today's trips", value: String(todaysTrips.length) },
    { label: "Bookings this month", value: String(monthlyBookings) },
    { label: "Revenue this month", value: formatCents(monthlyRevenue._sum.amountCents ?? 0) },
    { label: "Outstanding balances", value: formatCents(outstandingCents) },
    { label: "Weather holds", value: String(weatherHolds.length) },
  ];

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold">Dashboard</h1>

      <dl className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl bg-white p-5 shadow-card">
            <dt className="text-xs font-bold uppercase tracking-wide text-navy-500">{s.label}</dt>
            <dd className="mt-1 font-heading text-2xl font-bold text-navy-900">{s.value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        <section className="rounded-xl bg-white p-5 shadow-card">
          <h2 className="font-heading text-lg font-bold">Today&apos;s trips</h2>
          <BookingList bookings={todaysTrips} empty="No trips today." />
        </section>

        <section className="rounded-xl bg-white p-5 shadow-card">
          <h2 className="font-heading text-lg font-bold">Upcoming trips</h2>
          <BookingList bookings={upcomingTrips} empty="Nothing on the books yet." showDate />
        </section>

        <section className="rounded-xl bg-white p-5 shadow-card">
          <h2 className="font-heading text-lg font-bold">Weather holds</h2>
          <BookingList bookings={weatherHolds} empty="No bookings on weather hold." showDate />
        </section>

        <section className="rounded-xl bg-white p-5 shadow-card">
          <h2 className="font-heading text-lg font-bold">Recent cancellations</h2>
          <BookingList bookings={recentCancellations} empty="No recent cancellations." showDate />
        </section>
      </div>
    </div>
  );
}

function BookingList({
  bookings,
  empty,
  showDate = false,
}: {
  bookings: Array<{
    id: string;
    date: string;
    startTime: string;
    status: string;
    confirmationNumber: string;
    customer: { firstName: string; lastName: string };
    package: { name: string };
  }>;
  empty: string;
  showDate?: boolean;
}) {
  if (bookings.length === 0) {
    return <p className="mt-3 text-sm text-navy-500">{empty}</p>;
  }
  return (
    <ul className="mt-3 divide-y divide-cream-200">
      {bookings.map((b) => (
        <li key={b.id}>
          <Link
            href={`/admin/bookings/${b.id}`}
            className="flex flex-wrap items-center justify-between gap-2 py-3 hover:bg-cream-50"
          >
            <span>
              <span className="font-semibold text-navy-900">
                {showDate ? `${formatYmd(b.date, "MMM d")} · ` : ""}
                {formatTime(b.startTime)} — {b.package.name}
              </span>
              <span className="block text-sm text-navy-600">
                {b.customer.firstName} {b.customer.lastName} · {b.confirmationNumber}
              </span>
            </span>
            <BookingStatusBadge status={b.status} />
          </Link>
        </li>
      ))}
    </ul>
  );
}
