import { prisma } from "@/lib/db";
import { AvailabilityManager } from "@/components/admin/AvailabilityManager";
import { getSettings } from "@/lib/server/settings";
import { dateToYmd } from "@/lib/availability";

export const dynamic = "force-dynamic";

export default async function AdminAvailabilityPage() {
  const today = dateToYmd(new Date());
  const [rules, blockedDates, packages, settings] = await Promise.all([
    prisma.availabilityRule.findMany({
      include: { package: { select: { name: true } } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.blockedDate.findMany({
      where: { date: { gte: today } },
      orderBy: { date: "asc" },
    }),
    prisma.tripPackage.findMany({
      select: { id: true, name: true },
      orderBy: { sortOrder: "asc" },
    }),
    getSettings(),
  ]);

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold">Availability</h1>
      <p className="mt-1 text-sm text-navy-600">
        Booking window: {settings.minNoticeHours}h minimum notice · up to {settings.maxAdvanceDays}{" "}
        days ahead · {settings.turnaroundMinutes} min turnaround between trips (change in Settings).
      </p>
      <div className="mt-6">
        <AvailabilityManager
          rules={rules.map((r) => ({
            id: r.id,
            packageId: r.packageId,
            packageName: r.package?.name ?? null,
            daysOfWeek: r.daysOfWeek,
            startTimes: r.startTimes,
            seasonStart: r.seasonStart,
            seasonEnd: r.seasonEnd,
            label: r.label,
            active: r.active,
          }))}
          blockedDates={blockedDates.map((b) => ({
            id: b.id,
            date: b.date,
            startTime: b.startTime,
            endTime: b.endTime,
            reason: b.reason,
          }))}
          packages={packages}
        />
      </div>
    </div>
  );
}
