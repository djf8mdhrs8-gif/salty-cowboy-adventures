import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";
import { siteUrl } from "@/lib/site";
import { POLICY_DOCS } from "@/lib/policies";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const now = new Date();

  let tripEntries: MetadataRoute.Sitemap = [];
  try {
    const trips = await prisma.tripPackage.findMany({
      where: { active: true, listed: true },
      select: { slug: true, updatedAt: true },
    });
    tripEntries = trips.map((t) => ({
      url: `${base}/trips/${t.slug}`,
      lastModified: t.updatedAt,
      changeFrequency: "weekly",
      priority: 0.9,
    }));
  } catch {
    // DB unavailable at build — static entries still ship
  }

  return [
    { url: base, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/trips`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    ...tripEntries,
    { url: `${base}/faq`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/contact`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    ...POLICY_DOCS.map((p) => ({
      url: `${base}/policies/${p.slug}`,
      lastModified: now,
      changeFrequency: "yearly" as const,
      priority: 0.3,
    })),
  ];
}
