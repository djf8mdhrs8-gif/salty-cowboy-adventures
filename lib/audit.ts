import "server-only";
import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";

/** Record an admin action. Never throws — auditing must not break the action. */
export async function logAdminAction(params: {
  adminUserId: string | null;
  action: string;
  entityType: string;
  entityId: string;
  details?: Prisma.InputJsonValue;
  ipAddress?: string;
}): Promise<void> {
  try {
    await prisma.auditLog.create({ data: params });
  } catch (err) {
    console.error("Audit log write failed:", err);
  }
}
