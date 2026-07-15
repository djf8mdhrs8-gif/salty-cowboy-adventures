import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { settingsSchema } from "@/lib/validation/admin";
import { handleApiError } from "@/lib/api-helpers";
import { logAdminAction } from "@/lib/audit";

export const dynamic = "force-dynamic";

/** PATCH /api/admin/settings — update business settings (partial). */
export async function PATCH(req: Request) {
  try {
    const admin = await requireAdmin();
    const data = settingsSchema.partial().parse(await req.json());
    await prisma.siteSettings.upsert({
      where: { id: "default" },
      update: data,
      create: { id: "default", ...data },
    });
    await logAdminAction({
      adminUserId: admin.adminUserId,
      action: "settings.update",
      entityType: "SiteSettings",
      entityId: "default",
      details: { fields: Object.keys(data) },
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
