import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { packageSchema } from "@/lib/validation/admin";
import { handleApiError } from "@/lib/api-helpers";
import { logAdminAction } from "@/lib/audit";

export const dynamic = "force-dynamic";

/** POST /api/admin/packages — create a trip package. */
export async function POST(req: Request) {
  try {
    const admin = await requireAdmin();
    const data = packageSchema.parse(await req.json());
    const pkg = await prisma.tripPackage.create({ data });
    await logAdminAction({
      adminUserId: admin.adminUserId,
      action: "package.create",
      entityType: "TripPackage",
      entityId: pkg.id,
      details: { slug: pkg.slug },
    });
    return NextResponse.json({ ok: true, id: pkg.id });
  } catch (err) {
    return handleApiError(err);
  }
}
