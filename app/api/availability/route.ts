import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import {
  loadAvailabilityContext,
  slotsForDateFromContext,
} from "@/lib/server/availability-data";
import { handleApiError } from "@/lib/api-helpers";

const querySchema = z.object({
  package: z.string().min(1),
  month: z.string().regex(/^\d{4}-\d{2}$/),
});

/**
 * GET /api/availability?package=<slug>&month=YYYY-MM
 * Returns per-day slot availability for the whole month.
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const { package: slug, month } = querySchema.parse({
      package: url.searchParams.get("package"),
      month: url.searchParams.get("month"),
    });

    const pkg = await prisma.tripPackage.findFirst({
      where: { slug, active: true },
      select: { id: true, durationMinutes: true },
    });
    if (!pkg) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 });
    }

    const [yearStr, monthStr] = month.split("-");
    const year = Number(yearStr);
    const monthNum = Number(monthStr);
    if (monthNum < 1 || monthNum > 12) {
      return NextResponse.json({ error: "Invalid month" }, { status: 400 });
    }
    const daysInMonth = new Date(year, monthNum, 0).getDate();
    const pad = (n: number) => String(n).padStart(2, "0");
    const fromDate = `${month}-01`;
    const toDate = `${month}-${pad(daysInMonth)}`;

    const ctx = await loadAvailabilityContext(pkg.id, fromDate, toDate);
    const now = new Date();

    const days = Array.from({ length: daysInMonth }, (_, i) => {
      const date = `${month}-${pad(i + 1)}`;
      const slots = slotsForDateFromContext(ctx, {
        date,
        packageId: pkg.id,
        durationMinutes: pkg.durationMinutes,
        now,
      });
      return {
        date,
        hasAvailability: slots.some((s) => s.available),
        slots,
      };
    });

    return NextResponse.json(
      { month, days },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (err) {
    return handleApiError(err);
  }
}
