import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { availabilityRuleUpdateSchema } from "@/lib/validation/admin";
import { handleApiError } from "@/lib/api-helpers";
import { logAdminAction } from "@/lib/audit";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Params) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;
    const data = availabilityRuleUpdateSchema.parse(await req.json());
    await prisma.availabilityRule.update({ where: { id }, data });
    await logAdminAction({
      adminUserId: admin.adminUserId,
      action: "availability-rule.update",
      entityType: "AvailabilityRule",
      entityId: id,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(req: Request, { params }: Params) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;
    await prisma.availabilityRule.delete({ where: { id } });
    await logAdminAction({
      adminUserId: admin.adminUserId,
      action: "availability-rule.delete",
      entityType: "AvailabilityRule",
      entityId: id,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
