import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { siteUrl } from "@/lib/site";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { TripCard } from "@/components/trips/TripCard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Trips & Charters — Pricing and Details",
  description:
    "Browse fishing charters, sunset cruises, dolphin tours, and private coastal adventures. See pricing, trip details, and live availability.",
  alternates: { canonical: `${siteUrl()}/trips` },
};

export default async function TripsPage() {
  const trips = await prisma.tripPackage.findMany({
    where: { active: true },
    orderBy: { sortOrder: "asc" },
  });

  return (
    <div className="bg-cream-50 py-14">
      <div className="container-content">
        <SectionHeading
          eyebrow="Charters & tours"
          title="Trips & Charters"
          intro="Every trip is private to your group. Pick a package to see full details, live availability, and book online."
        />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {trips.map((trip) => (
            <TripCard key={trip.id} trip={trip} />
          ))}
        </div>
      </div>
    </div>
  );
}
