import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { handleApiError } from "@/lib/api-helpers";
import { logAdminAction } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;
    await prisma.blockedDate.delete({ where: { id } });
    await logAdminAction({
      adminUserId: admin.adminUserId,
      action: "blocked-date.delete",
      entityType: "BlockedDate",
      entityId: id,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
