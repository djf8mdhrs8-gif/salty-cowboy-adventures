import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { addonSchema } from "@/lib/validation/admin";
import { handleApiError } from "@/lib/api-helpers";
import { logAdminAction } from "@/lib/audit";

export const dynamic = "force-dynamic";

/** PATCH /api/admin/addons/[id] — update an add-on (partial). */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;
    const data = addonSchema.partial().parse(await req.json());
    await prisma.tripAddon.update({ where: { id }, data });
    await logAdminAction({
      adminUserId: admin.adminUserId,
      action: "addon.update",
      entityType: "TripAddon",
      entityId: id,
      details: { fields: Object.keys(data) },
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
