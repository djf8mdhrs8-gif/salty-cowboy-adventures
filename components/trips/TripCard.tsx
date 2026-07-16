import Link from "next/link";
import Image from "next/image";
import { Clock, Users } from "lucide-react";
import type { TripPackage } from "@prisma/client";
import { formatCents } from "@/lib/money";
import { formatDuration } from "@/lib/dates";
import { ScenicImage } from "@/components/shared/ScenicImage";
import { DURATION_CARD_LABELS } from "@/lib/trip-groups";

const SCENE_BY_SLUG: Record<string, "ocean" | "sunset" | "marsh"> = {
  "sunset-cruise": "sunset",
  "dolphin-wildlife-tour": "marsh",
  "private-coastal-adventure": "sunset",
};

export function TripCard({ trip }: { trip: TripPackage }) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border border-tan-200 bg-white shadow-card transition-shadow hover:shadow-card-hover">
      <Link
        href={`/trips/${trip.slug}`}
        className="flex h-full flex-col"
        aria-label={`${trip.name} — details and booking`}
      >
        {trip.imageUrl ? (
          <div className="relative h-44 w-full overflow-hidden">
            <Image
              src={trip.imageUrl}
              alt={`${trip.name} — a recent catch aboard the Salty Cowboy`}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover object-[center_30%]"
            />
          </div>
        ) : (
          <ScenicImage
            label={`${trip.name} scenic view`}
            scene={SCENE_BY_SLUG[trip.slug] ?? "ocean"}
            className="h-44 w-full"
          />
        )}
        <div className="flex flex-1 flex-col p-5">
          <h3 className="text-xl font-bold group-hover:text-coastal-700">{trip.name}</h3>
          <p className="mt-2 flex-1 text-sm leading-relaxed text-navy-600">{trip.tagline}</p>

          <dl className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-sm text-navy-700">
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-coastal-600" aria-hidden />
              <dt className="sr-only">Duration</dt>
              <dd>
                {DURATION_CARD_LABELS[trip.slug] ??
                  (trip.customDuration ? "Custom duration" : formatDuration(trip.durationMinutes))}
              </dd>
            </div>
            <div className="flex items-center gap-1.5">
              <Users className="h-4 w-4 text-coastal-600" aria-hidden />
              <dt className="sr-only">Capacity</dt>
              <dd>Up to {trip.maxGuests} guests</dd>
            </div>
          </dl>

          <div className="mt-4 flex items-center justify-between border-t border-tan-100 pt-4">
            <p>
              <span className="text-xs uppercase tracking-wide text-navy-500">Starting at</span>{" "}
              <span className="font-heading text-xl font-bold text-navy-900">
                {formatCents(trip.basePriceCents, { compact: true })}
              </span>
            </p>
            <span className="btn-accent !min-h-9 !px-4 !py-1.5 text-sm">View & Book</span>
          </div>
        </div>
      </Link>
    </article>
  );
}
