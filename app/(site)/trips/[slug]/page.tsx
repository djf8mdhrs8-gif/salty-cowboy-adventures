import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Check, Clock, Users, Wallet, Umbrella, ShieldCheck } from "lucide-react";
import { prisma } from "@/lib/db";
import { formatCents } from "@/lib/money";
import { formatDuration } from "@/lib/dates";
import { siteUrl } from "@/lib/site";
import { tripProductSchema } from "@/lib/schema-org";
import { JsonLd } from "@/components/shared/JsonLd";
import { ScenicImage } from "@/components/shared/ScenicImage";
import { TripAvailability } from "@/components/trips/TripAvailability";
import { durationGroupFor } from "@/lib/trip-groups";
import Link from "next/link";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const trip = await prisma.tripPackage.findUnique({ where: { slug } });
  if (!trip) return {};
  return {
    title: `${trip.name} — ${formatCents(trip.basePriceCents, { compact: true })}`,
    description: trip.seoDescription ?? trip.tagline,
    alternates: { canonical: `${siteUrl()}/trips/${trip.slug}` },
    openGraph: { title: trip.name, description: trip.tagline },
  };
}

export default async function TripDetailPage({ params }: Props) {
  const { slug } = await params;
  const trip = await prisma.tripPackage.findFirst({
    where: { slug, active: true },
  });
  if (!trip) notFound();

  // Trip-length options (e.g. inshore 4h vs 8h) share one card; the detail
  // page lets the customer switch between the active variants.
  const groupSlugs = durationGroupFor(slug);
  const variants = groupSlugs
    ? (
        await prisma.tripPackage.findMany({
          where: { slug: { in: groupSlugs }, active: true },
          select: { slug: true, durationMinutes: true, basePriceCents: true },
        })
      ).sort((a, b) => a.durationMinutes - b.durationMinutes)
    : [];

  const depositLabel =
    trip.depositMode === "FULL_ONLY"
      ? "Full payment due at booking"
      : trip.depositMode === "DEPOSIT_ONLY"
        ? `${trip.depositPercent}% deposit due at booking`
        : `${trip.depositPercent}% deposit or full payment — your choice`;

  return (
    <>
      <JsonLd data={tripProductSchema(trip)} />

      {trip.imageUrl ? (
        <div className="relative h-56 w-full sm:h-72">
          <Image
            src={trip.imageUrl}
            alt={`${trip.name} — a recent catch aboard the Salty Cowboy`}
            fill
            priority
            sizes="100vw"
            className="object-cover object-[center_25%]"
          />
        </div>
      ) : (
        <ScenicImage
          label={`${trip.name} — scenic coastal water view`}
          scene={slug.includes("sunset") ? "sunset" : slug.includes("dolphin") ? "marsh" : "ocean"}
          className="h-56 w-full sm:h-72"
        />
      )}

      <div className="container-content grid gap-10 py-10 lg:grid-cols-[1fr_minmax(22rem,26rem)]">
        <div>
          <nav aria-label="Breadcrumb" className="mb-4 text-sm text-navy-500">
            <Link href="/trips" className="underline underline-offset-4 hover:text-coastal-700">
              Trips
            </Link>{" "}
            / {trip.name}
          </nav>
          <h1 className="text-3xl font-bold sm:text-4xl">{trip.name}</h1>
          <p className="mt-3 text-lg text-navy-600">{trip.tagline}</p>

          {variants.length > 1 ? (
            <nav aria-label="Trip length" className="mt-5">
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-navy-500">
                Choose your trip length
              </p>
              <div className="flex flex-wrap gap-2">
                {variants.map((v) => {
                  const current = v.slug === trip.slug;
                  return (
                    <Link
                      key={v.slug}
                      href={`/trips/${v.slug}`}
                      aria-current={current ? "page" : undefined}
                      className={`min-h-11 rounded-md px-4 py-2.5 text-sm font-semibold ring-1 transition-colors ${
                        current
                          ? "bg-navy-800 text-cream-50 ring-navy-800"
                          : "bg-white text-navy-800 ring-tan-200 hover:bg-coastal-50"
                      }`}
                    >
                      {formatDuration(v.durationMinutes)} —{" "}
                      {formatCents(v.basePriceCents, { compact: true })}
                    </Link>
                  );
                })}
              </div>
            </nav>
          ) : null}

          <dl className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              {
                icon: Clock,
                label: "Duration",
                value: trip.customDuration
                  ? `${formatDuration(trip.durationMinutes)}+ (custom)`
                  : formatDuration(trip.durationMinutes),
              },
              { icon: Users, label: "Guests", value: `Up to ${trip.maxGuests}` },
              {
                icon: Wallet,
                label: "Starting at",
                value: formatCents(trip.basePriceCents, { compact: true }),
              },
              {
                icon: ShieldCheck,
                label: "Deposit",
                value:
                  trip.depositMode === "FULL_ONLY" ? "Pay in full" : `${trip.depositPercent}%`,
              },
            ].map((item) => (
              <div key={item.label} className="rounded-lg border border-tan-200 bg-white p-4">
                <item.icon className="mb-1.5 h-5 w-5 text-coastal-600" aria-hidden />
                <dt className="text-xs uppercase tracking-wide text-navy-500">{item.label}</dt>
                <dd className="font-heading font-bold text-navy-900">{item.value}</dd>
              </div>
            ))}
          </dl>

          <section className="prose-navy mt-8 max-w-none">
            <h2 className="text-2xl font-bold">About this trip</h2>
            <p className="mt-3 leading-relaxed text-navy-700">{trip.description}</p>
            {trip.includedGuests < trip.maxGuests && trip.additionalGuestFeeCents > 0 ? (
              <p className="mt-3 text-sm text-navy-600">
                Base price covers up to {trip.includedGuests} guests; each additional guest is{" "}
                {formatCents(trip.additionalGuestFeeCents, { compact: true })} (max{" "}
                {trip.maxGuests} aboard).
              </p>
            ) : null}
          </section>

          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            <section className="rounded-xl border border-tan-200 bg-white p-6">
              <h2 className="text-xl font-bold">What&apos;s included</h2>
              <ul className="mt-4 space-y-2.5">
                {trip.included.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-navy-700">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-seafoam-600" aria-hidden />
                    {item}
                  </li>
                ))}
              </ul>
            </section>
            <section className="rounded-xl border border-tan-200 bg-white p-6">
              <h2 className="text-xl font-bold">What to bring</h2>
              <ul className="mt-4 space-y-2.5">
                {trip.whatToBring.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-navy-700">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-tan-500" aria-hidden />
                    {item}
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <section className="mt-8 space-y-4">
            <div className="rounded-xl border border-tan-200 bg-cream-100 p-6">
              <h2 className="flex items-center gap-2 text-xl font-bold">
                <Wallet className="h-5 w-5 text-tan-600" aria-hidden /> Deposit &amp; payment
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-navy-700">
                {depositLabel}. Any remaining balance can be paid online before your trip or at
                the dock. See our{" "}
                <Link href="/policies/refunds" className="underline underline-offset-4">
                  payment &amp; refund policy
                </Link>
                .
              </p>
            </div>
            <div className="rounded-xl border border-tan-200 bg-cream-100 p-6">
              <h2 className="flex items-center gap-2 text-xl font-bold">
                <ShieldCheck className="h-5 w-5 text-tan-600" aria-hidden /> Cancellation policy
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-navy-700">
                Full refund 7+ days out, 50% refund 3–6 days out, non-refundable within 72 hours
                (one free reschedule allowed). Full details in the{" "}
                <Link href="/policies/cancellation" className="underline underline-offset-4">
                  cancellation policy
                </Link>
                .
              </p>
            </div>
            <div className="rounded-xl border border-tan-200 bg-cream-100 p-6">
              <h2 className="flex items-center gap-2 text-xl font-bold">
                <Umbrella className="h-5 w-5 text-tan-600" aria-hidden /> Weather policy
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-navy-700">
                The captain has final say on weather. If we cancel, you choose a free reschedule
                or a full refund. Read the{" "}
                <Link href="/policies/weather" className="underline underline-offset-4">
                  weather policy
                </Link>
                .
              </p>
            </div>
          </section>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-xl border border-tan-200 bg-white p-6 shadow-card">
            <h2 className="text-xl font-bold">Check availability</h2>
            <p className="mt-1 text-sm text-navy-600">
              Live calendar — unavailable dates are crossed out.
            </p>
            <div className="mt-5">
              <TripAvailability
                packageSlug={trip.slug}
                priceLabel={formatCents(trip.basePriceCents, { compact: true })}
              />
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
