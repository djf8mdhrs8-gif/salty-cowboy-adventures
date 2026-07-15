import "server-only";
import { prisma } from "@/lib/db";
import type { SiteSettings } from "@prisma/client";

/**
 * Singleton business settings row, created on first access with schema
 * defaults so a fresh database works without manual setup.
 */
export async function getSettings(): Promise<SiteSettings> {
  return prisma.siteSettings.upsert({
    where: { id: "default" },
    update: {},
    create: { id: "default" },
  });
}
