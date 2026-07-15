import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { addonSchema } from "@/lib/validation/admin";
import { handleApiError } from "@/lib/api-helpers";
import { logAdminAction } from "@/lib/audit";

export const dynamic = "force-dynamic";

/** POST /api/admin/addons — create an add-on. */
export async function POST(req: Request) {
  try {
    const admin = await requireAdmin();
    const data = addonSchema.parse(await req.json());
    const addon = await prisma.tripAddon.create({ data });
    await logAdminAction({
      adminUserId: admin.adminUserId,
      action: "addon.create",
      entityType: "TripAddon",
      entityId: addon.id,
    });
    return NextResponse.json({ ok: true, id: addon.id });
  } catch (err) {
    return handleApiError(err);
  }
}
