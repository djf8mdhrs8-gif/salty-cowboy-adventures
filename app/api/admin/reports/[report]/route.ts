import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { handleApiError } from "@/lib/api-helpers";
import { toCsv, csvResponse } from "@/lib/csv";
import { logAdminAction } from "@/lib/audit";

export const dynamic = "force-dynamic";

const money = (cents: number) => (cents / 100).toFixed(2);

/**
 * GET /api/admin/reports/[report] — CSV exports:
 * bookings, revenue-by-month, bookings-by-trip, cancellation-rate,
 * deposit-balances, customers, tax-totals.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ report: string }> },
) {
  try {
    const admin = await requireAdmin();
    const { report } = await params;

    await logAdminAction({
      adminUserId: admin.adminUserId,
      action: "report.export",
      entityType: "Report",
      entityId: report,
    });

    switch (report) {
      case "bookings": {
        const rows = await prisma.booking.findMany({
          include: { customer: true, package: true },
          orderBy: [{ date: "desc" }, { startTime: "desc" }],
        });
        return csvResponse(
          "bookings.csv",
          toCsv(
            [
              "Confirmation", "Status", "Trip", "Date", "Start", "Adults", "Children",
              "Customer", "Email", "Phone", "Total", "Paid", "Refunded", "Balance", "Created",
            ],
            rows.map((b) => [
              b.confirmationNumber,
              b.status,
              b.package.name,
              b.date,
              b.startTime,
              b.adults,
              b.children,
              `${b.customer.firstName} ${b.customer.lastName}`,
              b.customer.email,
              b.customer.phone,
              money(b.totalCents),
              money(b.amountPaidCents),
              money(b.refundedCents),
              money(Math.max(0, b.totalCents - b.amountPaidCents - b.refundedCents)),
              b.createdAt.toISOString(),
            ]),
          ),
        );
      }

      case "revenue-by-month": {
        const payments = await prisma.payment.findMany({
          where: { status: { in: ["PAID", "PARTIALLY_REFUNDED", "REFUNDED"] }, paidAt: { not: null } },
          select: { amountCents: true, paidAt: true },
        });
        const refunds = await prisma.refund.findMany({
          where: { status: "SUCCEEDED" },
          select: { amountCents: true, createdAt: true },
        });
        const byMonth = new Map<string, { gross: number; refunded: number }>();
        for (const p of payments) {
          const key = p.paidAt!.toISOString().slice(0, 7);
          const m = byMonth.get(key) ?? { gross: 0, refunded: 0 };
          m.gross += p.amountCents;
          byMonth.set(key, m);
        }
        for (const r of refunds) {
          const key = r.createdAt.toISOString().slice(0, 7);
          const m = byMonth.get(key) ?? { gross: 0, refunded: 0 };
          m.refunded += r.amountCents;
          byMonth.set(key, m);
        }
        const rows = [...byMonth.entries()].sort();
        return csvResponse(
          "revenue-by-month.csv",
          toCsv(
            ["Month", "Gross", "Refunded", "Net"],
            rows.map(([month, m]) => [month, money(m.gross), money(m.refunded), money(m.gross - m.refunded)]),
          ),
        );
      }

      case "bookings-by-trip": {
        const groups = await prisma.booking.groupBy({
          by: ["packageId", "status"],
          _count: { _all: true },
          _sum: { totalCents: true },
        });
        const packages = await prisma.tripPackage.findMany({ select: { id: true, name: true } });
        const nameById = new Map(packages.map((p) => [p.id, p.name]));
        return csvResponse(
          "bookings-by-trip.csv",
          toCsv(
            ["Trip", "Status", "Bookings", "Total value"],
            groups.map((g) => [
              nameById.get(g.packageId) ?? g.packageId,
              g.status,
              g._count._all,
              money(g._sum.totalCents ?? 0),
            ]),
          ),
        );
      }

      case "cancellation-rate": {
        const total = await prisma.booking.count({
          where: { status: { notIn: ["PENDING", "AWAITING_PAYMENT"] } },
        });
        const cancelled = await prisma.booking.count({
          where: { status: { in: ["CANCELLED", "REFUNDED"] } },
        });
        return csvResponse(
          "cancellation-rate.csv",
          toCsv(
            ["Total bookings", "Cancelled/refunded", "Cancellation rate"],
            [[total, cancelled, total > 0 ? `${((cancelled / total) * 100).toFixed(1)}%` : "0%"]],
          ),
        );
      }

      case "deposit-balances": {
        const rows = await prisma.booking.findMany({
          where: { status: { in: ["CONFIRMED", "RESCHEDULED", "WEATHER_HOLD"] } },
          include: { customer: true, package: true },
          orderBy: { date: "asc" },
        });
        const withBalance = rows.filter(
          (b) => b.totalCents - b.amountPaidCents - b.refundedCents > 0,
        );
        return csvResponse(
          "deposit-balances.csv",
          toCsv(
            ["Confirmation", "Trip", "Date", "Customer", "Email", "Total", "Paid", "Balance due"],
            withBalance.map((b) => [
              b.confirmationNumber,
              b.package.name,
              b.date,
              `${b.customer.firstName} ${b.customer.lastName}`,
              b.customer.email,
              money(b.totalCents),
              money(b.amountPaidCents),
              money(b.totalCents - b.amountPaidCents - b.refundedCents),
            ]),
          ),
        );
      }

      case "customers": {
        const customers = await prisma.customer.findMany({
          include: {
            bookings: { select: { amountPaidCents: true, refundedCents: true, status: true } },
          },
          orderBy: { createdAt: "desc" },
        });
        return csvResponse(
          "customers.csv",
          toCsv(
            ["Name", "Email", "Phone", "Bookings", "Total spent", "Joined"],
            customers.map((c) => [
              `${c.firstName} ${c.lastName}`,
              c.email,
              c.phone,
              c.bookings.length,
              money(c.bookings.reduce((s, b) => s + b.amountPaidCents - b.refundedCents, 0)),
              c.createdAt.toISOString().slice(0, 10),
            ]),
          ),
        );
      }

      case "tax-totals": {
        const bookings = await prisma.booking.findMany({
          where: { status: { in: ["CONFIRMED", "RESCHEDULED", "COMPLETED", "WEATHER_HOLD", "NO_SHOW"] } },
          select: { date: true, taxCents: true, feeCents: true, totalCents: true },
        });
        const byMonth = new Map<string, { tax: number; fees: number; total: number }>();
        for (const b of bookings) {
          const key = b.date.slice(0, 7);
          const m = byMonth.get(key) ?? { tax: 0, fees: 0, total: 0 };
          m.tax += b.taxCents;
          m.fees += b.feeCents;
          m.total += b.totalCents;
          byMonth.set(key, m);
        }
        return csvResponse(
          "tax-totals.csv",
          toCsv(
            ["Trip month", "Tax collected", "Booking fees", "Booked total"],
            [...byMonth.entries()]
              .sort()
              .map(([month, m]) => [month, money(m.tax), money(m.fees), money(m.total)]),
          ),
        );
      }

      default:
        return NextResponse.json({ error: "Unknown report" }, { status: 404 });
    }
  } catch (err) {
    return handleApiError(err);
  }
}
