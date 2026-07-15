import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { blockedDateSchema } from "@/lib/validation/admin";
import { handleApiError } from "@/lib/api-helpers";
import { logAdminAction } from "@/lib/audit";

export const dynamic = "force-dynamic";

/** POST /api/admin/blocked-dates — block a date or time range. */
export async function POST(req: Request) {
  try {
    const admin = await requireAdmin();
    const data = blockedDateSchema.parse(await req.json());
    const block = await prisma.blockedDate.create({ data });
    await logAdminAction({
      adminUserId: admin.adminUserId,
      action: "blocked-date.create",
      entityType: "BlockedDate",
      entityId: block.id,
      details: { date: data.date, startTime: data.startTime, endTime: data.endTime },
    });
    return NextResponse.json({ ok: true, id: block.id });
  } catch (err) {
    return handleApiError(err);
  }
}
