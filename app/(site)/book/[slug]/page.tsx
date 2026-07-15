import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSettings } from "@/lib/server/settings";
import { BookingWizard } from "@/components/booking/BookingWizard";
import { formatCents } from "@/lib/money";
import { formatDuration } from "@/lib/dates";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ date?: string; time?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const trip = await prisma.tripPackage.findUnique({ where: { slug } });
  return {
    title: trip ? `Book: ${trip.name}` : "Book your trip",
    robots: { index: false }, // checkout flow shouldn't be indexed
  };
}

export default async function BookPage({ params, searchParams }: Props) {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const trip = await prisma.tripPackage.findFirst({
    where: { slug, active: true },
    include: {
      addons: { where: { active: true } },
    },
  });
  if (!trip) notFound();

  const [globalAddons, settings] = await Promise.all([
    prisma.tripAddon.findMany({
      where: { active: true, global: true },
      orderBy: { sortOrder: "asc" },
    }),
    getSettings(),
  ]);

  // Merge package-specific and global add-ons (deduped).
  const addonMap = new Map(
    [...globalAddons, ...trip.addons].map((a) => [a.id, a]),
  );
  const addons = [...addonMap.values()].sort((a, b) => a.sortOrder - b.sortOrder);

  const initialSelection =
    sp.date && sp.time && /^\d{4}-\d{2}-\d{2}$/.test(sp.date) && /^\d{2}:\d{2}$/.test(sp.time)
      ? { date: sp.date, startTime: sp.time }
      : null;

  return (
    <div className="bg-cream-50 py-10">
      <div className="container-content">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-tan-600">Booking</p>
        <h1 className="mt-1 text-3xl font-bold">{trip.name}</h1>
        <p className="mt-2 text-navy-600">
          {trip.customDuration
            ? `${formatDuration(trip.durationMinutes)} base (extend with add-ons)`
            : formatDuration(trip.durationMinutes)}{" "}
          · up to {trip.maxGuests} guests · from {formatCents(trip.basePriceCents, { compact: true })}
        </p>

        <div className="mt-8">
          <BookingWizard
            pkg={{
              id: trip.id,
              slug: trip.slug,
              name: trip.name,
              durationMinutes: trip.durationMinutes,
              basePriceCents: trip.basePriceCents,
              includedGuests: trip.includedGuests,
              maxGuests: trip.maxGuests,
              additionalGuestFeeCents: trip.additionalGuestFeeCents,
              depositMode: trip.depositMode,
              depositPercent: trip.depositPercent,
              showFishingExperience: trip.showFishingExperience,
            }}
            addons={addons.map((a) => ({
              id: a.id,
              name: a.name,
              description: a.description,
              priceCents: a.priceCents,
              pricing: a.pricing,
              maxQuantity: a.maxQuantity,
            }))}
            settings={{
              taxRateBps: settings.taxRateBps,
              bookingFeeBps: settings.bookingFeeBps,
            }}
            initialSelection={initialSelection}
          />
        </div>
      </div>
    </div>
  );
}
