import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { PackageForm } from "@/components/admin/PackageForm";

export const dynamic = "force-dynamic";

export default async function EditTripPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const trip = await prisma.tripPackage.findUnique({ where: { id } });
  if (!trip) notFound();

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold">Edit: {trip.name}</h1>
      <div className="mt-6 max-w-4xl">
        <PackageForm
          initial={{
            id: trip.id,
            slug: trip.slug,
            name: trip.name,
            tagline: trip.tagline,
            description: trip.description,
            durationMinutes: trip.durationMinutes,
            customDuration: trip.customDuration,
            basePriceCents: trip.basePriceCents,
            includedGuests: trip.includedGuests,
            maxGuests: trip.maxGuests,
            additionalGuestFeeCents: trip.additionalGuestFeeCents,
            depositMode: trip.depositMode,
            depositPercent: trip.depositPercent,
            included: trip.included,
            whatToBring: trip.whatToBring,
            showFishingExperience: trip.showFishingExperience,
            familyFriendly: trip.familyFriendly,
            featured: trip.featured,
            active: trip.active,
            listed: trip.listed,
            sortOrder: trip.sortOrder,
          }}
        />
      </div>
    </div>
  );
}
