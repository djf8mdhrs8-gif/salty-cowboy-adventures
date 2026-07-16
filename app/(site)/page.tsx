import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { Star, MapPin, Anchor, Ship, LifeBuoy, Fish } from "lucide-react";
import { prisma } from "@/lib/db";
import { SITE_NAME, PLACEHOLDER_CONTACT, siteUrl } from "@/lib/site";
import { FAQS, REVIEWS, WHY_CHOOSE_US } from "@/lib/content";
import { localBusinessSchema, faqSchema } from "@/lib/schema-org";
import { JsonLd } from "@/components/shared/JsonLd";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { ScenicImage } from "@/components/shared/ScenicImage";
import { TripCard } from "@/components/trips/TripCard";
import { PhoneLink } from "@/components/shared/PhoneLink";
import { LogoBadge } from "@/components/brand/Logo";

export const dynamic = "force-dynamic"; // reads featured trips from the DB

export const metadata: Metadata = {
  title: `${SITE_NAME} — Marco Island & Naples, FL Charters`,
  description:
    "Book fishing charters, sunset cruises, dolphin tours, and private boat trips in Marco Island and Naples, Florida. USCG-licensed Captain Marcus Terrero — family-friendly, everything included.",
  alternates: { canonical: siteUrl() },
};

const WHY_ICONS = [LifeBuoy, Ship, Fish, Star, Anchor, MapPin];

const CATCH_GALLERY = [
  { src: "/photos/catch-1.jpg", alt: "Guest holding a redfish caught in the Marco Island backwaters" },
  { src: "/photos/catch-2.jpg", alt: "Guest with a big barracuda on a blue-water day offshore" },
  { src: "/photos/catch-3.jpg", alt: "Guest smiling with a large red grouper aboard the boat" },
  { src: "/photos/catch-4.jpg", alt: "Guest standing on the bow holding a shark before release" },
  { src: "/photos/catch-5.jpg", alt: "Guest kneeling with a blacktip shark caught on the flats" },
  { src: "/photos/catch-6.jpg", alt: "Young angler proudly holding a redfish on a family trip" },
];

export default async function HomePage() {
  const featured = await prisma.tripPackage.findMany({
    where: { active: true },
    orderBy: [{ featured: "desc" }, { sortOrder: "asc" }],
    take: 3,
  });

  return (
    <>
      <JsonLd data={localBusinessSchema()} />
      <JsonLd data={faqSchema(FAQS.map((f) => ({ q: f.q, a: f.a })))} />

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="relative isolate overflow-hidden bg-navy-900">
        <ScenicImage
          label=""
          scene="sunset"
          className="absolute inset-0 opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-navy-950/90 via-navy-900/60 to-navy-900/30" />
        <div className="container-content relative py-24 text-center sm:py-32 lg:py-40">
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.35em] text-coastal-300">
            Explore More · Live Salty
          </p>
          <h1 className="mx-auto max-w-3xl text-4xl font-bold text-cream-50 sm:text-5xl lg:text-6xl">
            Fishing, Coastal Tours, and Private Adventures
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-cream-100/90">
            Saddle up for the saltwater. {SITE_NAME} runs premium charters on a
            meticulously kept center-console — licensed captain, quality gear, and
            the kind of day on the water you&apos;ll be telling stories about.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/trips" className="btn-accent w-full sm:w-auto">
              Book Your Adventure
            </Link>
            <Link
              href="/trips"
              className="btn w-full border-2 border-cream-50 text-cream-50 hover:bg-cream-50 hover:text-navy-900 sm:w-auto"
            >
              View Trips
            </Link>
          </div>
        </div>
      </section>

      {/* ── Intro ────────────────────────────────────────────────── */}
      <section className="bg-cream-50 py-16">
        <div className="container-content grid items-center gap-10 lg:grid-cols-2">
          <div>
            <SectionHeading
              center={false}
              eyebrow="Howdy from the helm"
              title="A charter outfit with coastal soul and cowboy manners"
              intro=""
            />
            <p className="text-lg leading-relaxed text-navy-600">
              We&apos;re a family-run charter company built on two things: honest
              hospitality and serious time on the water. Whether you&apos;re chasing
              redfish at first light, trading stories on a sunset cruise, or building
              a custom day of sandbars and island hopping, our captain treats every
              trip like it&apos;s the only one on the calendar.
            </p>
            <p className="mt-4 text-lg leading-relaxed text-navy-600">
              You&apos;ll ride aboard our meticulously kept 2018 24ft Skeeter
              center-console — Yamaha 250 on the back, T-top shade overhead, and room
              for the whole crew. Every charter is private: just your group, the
              captain, and open water.
            </p>
          </div>
          <div className="flex items-center justify-center">
            <LogoBadge className="w-full max-w-sm drop-shadow-lg lg:max-w-md" />
          </div>
        </div>
      </section>

      {/* ── Meet Your Captain ────────────────────────────────────── */}
      <section className="bg-navy-900 py-16" aria-labelledby="captain">
        <div className="container-content grid items-center gap-10 lg:grid-cols-[minmax(16rem,20rem)_1fr]">
          <ScenicImage
            label="Captain Marcus Terrero at the helm — photo coming soon"
            scene="sunset"
            className="h-64 rounded-xl shadow-card lg:h-80"
          />
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.3em] text-coastal-300">
              At the helm
            </p>
            <h2 id="captain" className="text-3xl font-bold text-cream-50 sm:text-4xl">
              Meet Your Captain
            </h2>
            <div className="mt-5 space-y-4 leading-relaxed text-cream-100/90">
              <p>
                <strong className="text-cream-50">Captain Marcus Terrero</strong> is a U.S.
                Coast Guard Licensed Charter Captain with more than three years of professional
                charter experience and a lifelong passion for the water. Having spent countless
                hours navigating the waters of Marco Island and Naples, Florida, Marcus has
                developed an in-depth knowledge of the area&apos;s fisheries, backwaters,
                islands, and coastal ecosystems.
              </p>
              <p>
                Whether you&apos;re looking to reel in your next big catch, explore secluded
                beaches, spot dolphins, or simply enjoy a relaxing day on the water, Captain
                Marcus is dedicated to providing a safe, professional, and unforgettable
                experience for every guest.
              </p>
              <p>
                At Salty Cowboy Adventures, every trip is customized to your group and focused
                on creating lasting memories. From first-time anglers to experienced fishermen
                and families looking to explore Southwest Florida&apos;s beautiful coastline,
                Captain Marcus is committed to making every adventure one to remember.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Featured trips ───────────────────────────────────────── */}
      <section className="bg-cream-100 py-16" aria-labelledby="featured-trips">
        <div className="container-content">
          <SectionHeading
            eyebrow="Featured charters"
            title="Pick your adventure"
            intro="Every trip is private to your group and includes the captain, fuel, and gear."
          />
          <div className="grid gap-6 md:grid-cols-3">
            {featured.map((trip) => (
              <TripCard key={trip.id} trip={trip} />
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link href="/trips" className="btn-secondary">
              See all trips &amp; pricing
            </Link>
          </div>
        </div>
      </section>

      {/* ── Why choose us ────────────────────────────────────────── */}
      <section className="bg-cream-50 py-16" aria-labelledby="why-us">
        <div className="container-content">
          <SectionHeading
            eyebrow="Why ride with us"
            title="Premium trips, no pretense"
          />
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {WHY_CHOOSE_US.map((item, i) => {
              const Icon = WHY_ICONS[i % WHY_ICONS.length];
              return (
                <li
                  key={item.title}
                  className="rounded-xl border border-tan-200 bg-white p-6 shadow-card"
                >
                  <Icon className="mb-3 h-7 w-7 text-coastal-600" aria-hidden />
                  <h3 className="text-lg font-bold">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-navy-600">{item.body}</p>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* ── Catch gallery ────────────────────────────────────────── */}
      <section className="bg-cream-100 py-16" aria-labelledby="gallery">
        <div className="container-content">
          <SectionHeading
            eyebrow="Fresh from the deck"
            title="Recent catches aboard the Salty Cowboy"
            intro="Real guests, real fish — sharks, barracuda, grouper, and redfish from the waters of Marco Island and Naples."
          />
          <ul className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
            {CATCH_GALLERY.map((photo) => (
              <li
                key={photo.src}
                className="relative aspect-[3/4] overflow-hidden rounded-xl shadow-card"
              >
                <Image
                  src={photo.src}
                  alt={photo.alt}
                  fill
                  sizes="(max-width: 640px) 50vw, 33vw"
                  className="object-cover transition-transform duration-300 hover:scale-105"
                />
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── Reviews ──────────────────────────────────────────────── */}
      <section className="bg-navy-900 py-16" aria-labelledby="reviews">
        <div className="container-content">
          <div className="mb-10 text-center">
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.3em] text-coastal-300">
              From the crew&apos;s guests
            </p>
            <h2 id="reviews" className="text-3xl font-bold text-cream-50 sm:text-4xl">
              Stories from the water
            </h2>
          </div>
          <ul className="grid gap-6 md:grid-cols-2">
            {REVIEWS.map((r) => (
              <li key={r.name} className="rounded-xl bg-navy-800 p-6">
                <div className="flex gap-1" aria-label={`${r.rating} out of 5 stars`}>
                  {Array.from({ length: r.rating }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-tan-300 text-tan-300" aria-hidden />
                  ))}
                </div>
                <blockquote className="mt-3 leading-relaxed text-cream-100">
                  &ldquo;{r.quote}&rdquo;
                </blockquote>
                <p className="mt-4 text-sm font-semibold text-coastal-300">
                  {r.name} · <span className="font-normal text-navy-200">{r.trip}</span>
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── Service area ─────────────────────────────────────────── */}
      <section className="bg-cream-50 py-16" aria-labelledby="service-area">
        <div className="container-content grid items-center gap-10 lg:grid-cols-2">
          <ScenicImage
            label="Map-style view of the coastal service area with barrier islands"
            scene="marsh"
            className="order-2 h-72 rounded-xl shadow-card lg:order-1 lg:h-80"
          />
          <div className="order-1 lg:order-2">
            <SectionHeading
              center={false}
              eyebrow="Where we ride"
              title="Our service area"
            />
            <p className="text-lg leading-relaxed text-navy-600">
              We depart from {PLACEHOLDER_CONTACT.marinaAddress} and run the waters of{" "}
              {PLACEHOLDER_CONTACT.serviceArea} — protected backcountry, barrier island
              passes, and nearshore water when conditions allow.
            </p>
            <p className="mt-4 flex items-center gap-2 font-semibold text-navy-800">
              <MapPin className="h-5 w-5 text-tan-600" aria-hidden />
              Custom pickup locations available as a booking add-on.
            </p>
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────── */}
      <section className="bg-cream-100 py-16" aria-labelledby="faq">
        <div className="container-content max-w-3xl">
          <SectionHeading eyebrow="Before you board" title="Frequently asked questions" />
          <div className="space-y-3">
            {FAQS.slice(0, 6).map((f) => (
              <details
                key={f.q}
                className="group rounded-lg border border-tan-200 bg-white p-5"
              >
                <summary className="cursor-pointer list-none font-heading text-base font-bold text-navy-900 marker:content-none">
                  {f.q}
                </summary>
                <p className="mt-3 leading-relaxed text-navy-600">{f.a}</p>
              </details>
            ))}
          </div>
          <p className="mt-6 text-center">
            <Link href="/faq" className="font-semibold text-coastal-700 underline underline-offset-4">
              Read all FAQs
            </Link>
          </p>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────────── */}
      <section className="relative isolate overflow-hidden bg-navy-900 py-20">
        <div className="rope-divider absolute inset-x-0 top-0" role="presentation" />
        <div className="container-content text-center">
          <h2 className="text-3xl font-bold text-cream-50 sm:text-4xl">
            The tide&apos;s right. Let&apos;s ride.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-cream-100/90">
            Real-time availability, secure checkout, instant confirmation.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/trips" className="btn-accent w-full sm:w-auto">
              Book Your Adventure
            </Link>
            <PhoneLink className="btn w-full border-2 border-cream-50 text-cream-50 hover:bg-cream-50 hover:text-navy-900 sm:w-auto">
              Call {PLACEHOLDER_CONTACT.phone}
            </PhoneLink>
          </div>
        </div>
      </section>
    </>
  );
}
