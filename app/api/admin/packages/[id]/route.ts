import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { packageUpdateSchema } from "@/lib/validation/admin";
import { handleApiError } from "@/lib/api-helpers";
import { logAdminAction } from "@/lib/audit";

export const dynamic = "force-dynamic";

/** PATCH /api/admin/packages/[id] — update a trip package (partial). */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;
    const data = packageUpdateSchema.parse(await req.json());
    const pkg = await prisma.tripPackage.update({ where: { id }, data });
    await logAdminAction({
      adminUserId: admin.adminUserId,
      action: "package.update",
      entityType: "TripPackage",
      entityId: id,
      details: { fields: Object.keys(data) },
    });
    return NextResponse.json({ ok: true, id: pkg.id });
  } catch (err) {
    return handleApiError(err);
  }
}
