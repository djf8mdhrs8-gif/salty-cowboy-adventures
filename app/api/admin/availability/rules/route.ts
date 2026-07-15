import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { availabilityRuleSchema } from "@/lib/validation/admin";
import { handleApiError } from "@/lib/api-helpers";
import { logAdminAction } from "@/lib/audit";

export const dynamic = "force-dynamic";

/** POST /api/admin/availability/rules — create an availability rule. */
export async function POST(req: Request) {
  try {
    const admin = await requireAdmin();
    const data = availabilityRuleSchema.parse(await req.json());
    const rule = await prisma.availabilityRule.create({ data });
    await logAdminAction({
      adminUserId: admin.adminUserId,
      action: "availability-rule.create",
      entityType: "AvailabilityRule",
      entityId: rule.id,
    });
    return NextResponse.json({ ok: true, id: rule.id });
  } catch (err) {
    return handleApiError(err);
  }
}
