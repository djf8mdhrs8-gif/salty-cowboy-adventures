import { prisma } from "@/lib/db";
import { AdminCalendar } from "@/components/admin/AdminCalendar";

export const dynamic = "force-dynamic";

export default async function AdminCalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { month } = await searchParams;
  const now = new Date();
  const viewMonth =
    month && /^\d{4}-\d{2}$/.test(month)
      ? month
      : `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  // Fetch a padded range so week view at month edges has data.
  const [y, m] = viewMonth.split("-").map(Number);
  const pad = (n: number) => String(n).padStart(2, "0");
  const prev = new Date(y, m - 2, 15);
  const next = new Date(y, m, 15);
  const fromDate = `${prev.getFullYear()}-${pad(prev.getMonth() + 1)}-01`;
  const toDate = `${next.getFullYear()}-${pad(next.getMonth() + 1)}-31`;

  const [bookings, blockedDates] = await Promise.all([
    prisma.booking.findMany({
      where: {
        date: { gte: fromDate, lte: toDate },
        status: { in: ["CONFIRMED", "RESCHEDULED", "WEATHER_HOLD", "COMPLETED", "AWAITING_PAYMENT"] },
      },
      include: {
        customer: { select: { firstName: true, lastName: true } },
        package: { select: { name: true } },
      },
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
    }),
    prisma.blockedDate.findMany({
      where: { date: { gte: fromDate, lte: toDate } },
    }),
  ]);

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold">Booking calendar</h1>
      <div className="mt-6">
        <AdminCalendar
          month={viewMonth}
          bookings={bookings.map((b) => ({
            id: b.id,
            date: b.date,
            startTime: b.startTime,
            durationMinutes: b.durationMinutes,
            status: b.status,
            tripName: b.package.name,
            customerName: `${b.customer.firstName} ${b.customer.lastName}`,
            guestCount: b.adults + b.children,
            confirmationNumber: b.confirmationNumber,
          }))}
          blockedDates={blockedDates.map((bd) => ({
            date: bd.date,
            startTime: bd.startTime,
            endTime: bd.endTime,
            reason: bd.reason,
          }))}
        />
      </div>
    </div>
  );
}
