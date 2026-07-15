import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatCents } from "@/lib/money";
import { formatDuration } from "@/lib/dates";
import { AddonManager } from "@/components/admin/AddonManager";

export const dynamic = "force-dynamic";

export default async function AdminTripsPage() {
  const [trips, addons] = await Promise.all([
    prisma.tripPackage.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.tripAddon.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-2xl font-bold">Trips &amp; add-ons</h1>
        <Link href="/admin/trips/new" className="btn-primary !min-h-10 !px-4 !py-2 text-sm">
          New trip package
        </Link>
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl bg-white shadow-card">
        <table className="w-full min-w-[48rem] text-left text-sm">
          <thead>
            <tr className="border-b border-cream-200 text-xs uppercase tracking-wide text-navy-500">
              <th className="px-4 py-3">Trip</th>
              <th className="px-4 py-3">Duration</th>
              <th className="px-4 py-3">Capacity</th>
              <th className="px-4 py-3 text-right">Base price</th>
              <th className="px-4 py-3">Deposit</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {trips.map((t) => (
              <tr key={t.id} className="border-b border-cream-100 hover:bg-cream-50">
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/trips/${t.id}`}
                    className="font-semibold text-coastal-700 underline underline-offset-2"
                  >
                    {t.name}
                  </Link>
                  <span className="block text-xs text-navy-500">/{t.slug}</span>
                </td>
                <td className="px-4 py-3">
                  {formatDuration(t.durationMinutes)}
                  {t.customDuration ? " (custom)" : ""}
                </td>
                <td className="px-4 py-3">
                  {t.includedGuests} incl. / {t.maxGuests} max
                </td>
                <td className="px-4 py-3 text-right tabular-nums">
                  {formatCents(t.basePriceCents)}
                </td>
                <td className="px-4 py-3">
                  {t.depositMode === "FULL_ONLY"
                    ? "Full only"
                    : `${t.depositPercent}% ${t.depositMode === "DEPOSIT_ONLY" ? "(deposit only)" : "(choice)"}`}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-[0.7rem] font-bold uppercase ${t.active ? "bg-seafoam-100 text-seafoam-800" : "bg-cream-200 text-navy-500"}`}
                  >
                    {t.active ? "Active" : "Disabled"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <section className="mt-10">
        <h2 className="font-heading text-xl font-bold">Add-ons</h2>
        <div className="mt-4">
          <AddonManager
            addons={addons.map((a) => ({
              id: a.id,
              slug: a.slug,
              name: a.name,
              description: a.description,
              priceCents: a.priceCents,
              pricing: a.pricing,
              maxQuantity: a.maxQuantity,
              global: a.global,
              active: a.active,
              sortOrder: a.sortOrder,
            }))}
          />
        </div>
      </section>
    </div>
  );
}
