/* eslint-disable no-console */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding Salty Cowboy Adventures…");

  // ── Business settings (singleton) ──────────────────────────────────
  await prisma.siteSettings.upsert({
    where: { id: "default" },
    update: {},
    create: { id: "default" },
  });
  // One-time fixups: replace retired placeholder contact values on existing
  // databases without overwriting values the admin has since customized.
  await prisma.siteSettings.updateMany({
    where: { id: "default", phone: "(555) 123-4567" },
    data: { phone: "(239) 571-1479" },
  });
  await prisma.siteSettings.updateMany({
    where: { id: "default", email: "ahoy@saltycowboyadventures.example.com" },
    data: { email: "marcusterrero05@gmail.com" },
  });
  await prisma.siteSettings.updateMany({
    where: {
      id: "default",
      marinaAddress: "Dock 7, Placeholder Marina, 123 Harbor Way, Coastal Town, ST 00000",
    },
    data: { marinaAddress: "Marco Island, FL (departure dock shared at booking)" },
  });
  await prisma.siteSettings.updateMany({
    where: { id: "default", serviceArea: "Coastal Town and surrounding waters" },
    data: { serviceArea: "Marco Island, Naples, and the waters of Southwest Florida" },
  });

  // ── Trip packages ──────────────────────────────────────────────────
  const packages = [
    {
      slug: "inshore-fishing-charter",
      name: "Inshore Fishing Charter",
      tagline: "Four hours chasing redfish, snook, and trout in calm backcountry waters.",
      description:
        "Work the flats, mangroves, and oyster bars with a seasoned local captain. " +
        "Our inshore trips are perfect for anglers of every level — the captain nets the bait, " +
        "rigs the rods, and puts you on fish. Kids and first-timers are always welcome aboard.",
      durationMinutes: 240,
      customDuration: false,
      basePriceCents: 60000,
      includedGuests: 4,
      maxGuests: 6,
      additionalGuestFeeCents: 7500,
      depositMode: "CUSTOMER_CHOICE",
      depositPercent: 25,
      included: [
        "Fishing equipment for every guest",
        "Bait and tackle",
        "Fishing license coverage while aboard",
        "Fish cleaning where permitted",
        "Bottled water and ice",
      ],
      whatToBring: [
        "Sunscreen and sunglasses",
        "Hat and light layers",
        "Snacks and drinks (no glass)",
        "Non-marking footwear",
        "Camera for the trophy shots",
      ],
      showFishingExperience: true,
      familyFriendly: true,
      featured: true,
      sortOrder: 1,
      seoDescription:
        "4-hour inshore fishing charter — equipment, bait, and fish cleaning included. Book online with Salty Cowboy Adventures.",
    },
    {
      slug: "full-day-fishing-charter",
      name: "Full-Day Fishing Charter",
      tagline: "Eight hours on the water — the serious angler's day out.",
      description:
        "A full day to range farther, fish harder, and chase whatever's running. " +
        "Mix inshore and nearshore spots at the captain's call, with all gear provided and " +
        "a big cooler of ice for your catch. Bring lunch and settle in for a proper day at sea.",
      durationMinutes: 480,
      customDuration: false,
      basePriceCents: 110000,
      includedGuests: 4,
      maxGuests: 6,
      additionalGuestFeeCents: 10000,
      depositMode: "CUSTOMER_CHOICE",
      depositPercent: 25,
      included: [
        "Fishing equipment for every guest",
        "Bait and tackle",
        "Cooler and ice",
        "Fishing license coverage while aboard",
        "Fish cleaning where permitted",
      ],
      whatToBring: [
        "Lunch, snacks, and drinks (no glass)",
        "Sunscreen and sunglasses",
        "Hat and light rain layer",
        "Non-marking footwear",
        "Motion-sickness remedy if you're prone",
      ],
      showFishingExperience: true,
      familyFriendly: true,
      featured: true,
      sortOrder: 2,
      seoDescription:
        "8-hour full-day fishing charter with equipment, cooler, and ice included. Book online with Salty Cowboy Adventures.",
    },
    {
      slug: "sunset-cruise",
      name: "Sunset Cruise",
      tagline: "Two golden hours on the water as the sun drops into the Gulf.",
      description:
        "Kick back with your crew for a private sunset run along the coast. " +
        "Bring your own beverages where legally permitted, put your feet up, and let the captain " +
        "find the best water for that postcard sky. The most relaxing seat in town isn't in town at all.",
      durationMinutes: 120,
      customDuration: false,
      basePriceCents: 35000,
      includedGuests: 6,
      maxGuests: 6,
      additionalGuestFeeCents: 0,
      depositMode: "CUSTOMER_CHOICE",
      depositPercent: 30,
      included: [
        "Private cruise — just your group",
        "Prime sunset viewing route",
        "Bring-your-own beverages where legally permitted",
        "Cooler space and ice",
        "Bluetooth sound system",
      ],
      whatToBring: [
        "Your favorite beverages (no glass)",
        "Light jacket for the ride home",
        "Camera or phone for the sky show",
      ],
      showFishingExperience: false,
      familyFriendly: true,
      featured: true,
      sortOrder: 3,
      seoDescription:
        "Private 2-hour sunset cruise for up to 6 guests. Book online with Salty Cowboy Adventures.",
    },
    {
      slug: "dolphin-wildlife-tour",
      name: "Dolphin & Wildlife Tour",
      tagline: "Dolphins, manatees, ospreys, and wild coastline — a family favorite.",
      description:
        "Cruise the calm backwaters and passes where dolphins play in the wake and wading birds " +
        "line the mangroves. Your captain narrates the coastline's history and wildlife along the way. " +
        "Gentle water and plenty of photo stops make this the perfect trip for all ages.",
      durationMinutes: 150,
      customDuration: false,
      basePriceCents: 42500,
      includedGuests: 6,
      maxGuests: 6,
      additionalGuestFeeCents: 0,
      depositMode: "CUSTOMER_CHOICE",
      depositPercent: 30,
      included: [
        "Wildlife viewing with a narrated route",
        "Coastal sightseeing",
        "Family-friendly, all ages welcome",
        "Bottled water and ice",
        "Photo stops along the way",
      ],
      whatToBring: [
        "Sunscreen and hats",
        "Binoculars if you have them",
        "Snacks for the kids",
        "Camera with a full battery",
      ],
      showFishingExperience: false,
      familyFriendly: true,
      featured: false,
      sortOrder: 4,
      seoDescription:
        "2.5-hour dolphin and wildlife tour for up to 6 guests — family friendly. Book online with Salty Cowboy Adventures.",
    },
    {
      slug: "private-coastal-adventure",
      name: "Private Coastal Adventure",
      tagline: "Your boat, your itinerary — sandbars, islands, swimming, and sightseeing.",
      description:
        "Charter the boat and build your own day on the water. Hit the sandbar while the tide's right, " +
        "hop between islands, swim, shell, sightsee — the captain shapes the route around what your group " +
        "wants. Pricing starts at a two-hour minimum; add hours as add-ons to extend your day.",
      durationMinutes: 120,
      customDuration: true,
      basePriceCents: 50000,
      includedGuests: 6,
      maxGuests: 6,
      additionalGuestFeeCents: 0,
      depositMode: "CUSTOMER_CHOICE",
      depositPercent: 25,
      included: [
        "Custom itinerary set with your captain",
        "Sandbar stops",
        "Island hopping",
        "Swimming and sightseeing",
        "Cooler space and ice",
      ],
      whatToBring: [
        "Swimsuits and towels",
        "Water shoes for shelling",
        "Food and drinks (no glass)",
        "Sunscreen — reef-safe preferred",
      ],
      showFishingExperience: false,
      familyFriendly: true,
      featured: false,
      sortOrder: 5,
      seoDescription:
        "Private custom boat charter — sandbar stops, island hopping, swimming. Book online with Salty Cowboy Adventures.",
    },
  ] as const;

  for (const p of packages) {
    await prisma.tripPackage.upsert({
      where: { slug: p.slug },
      update: { ...p, included: [...p.included], whatToBring: [...p.whatToBring] },
      create: { ...p, included: [...p.included], whatToBring: [...p.whatToBring] },
    });
  }
  console.log(`  ✓ ${packages.length} trip packages`);

  // ── Add-ons ────────────────────────────────────────────────────────
  const addons = [
    {
      slug: "additional-hour",
      name: "Additional Hour",
      description: "Extend your trip by an hour on the water.",
      priceCents: 15000,
      pricing: "FLAT",
      maxQuantity: 4,
      global: true,
      sortOrder: 1,
    },
    {
      slug: "cooler-package",
      name: "Cooler Package",
      description: "Stocked cooler: ice, bottled water, sodas, and snacks for the group.",
      priceCents: 7500,
      pricing: "FLAT",
      maxQuantity: 2,
      global: true,
      sortOrder: 2,
    },
    {
      slug: "photography-package",
      name: "Photography Package",
      description: "Captain-shot photos of your trip, edited and delivered within 48 hours.",
      priceCents: 12500,
      pricing: "FLAT",
      maxQuantity: 1,
      global: true,
      sortOrder: 3,
    },
    {
      slug: "sandbar-stop",
      name: "Sandbar Stop",
      description: "Add a swim-and-relax stop at the local sandbar (tide permitting).",
      priceCents: 5000,
      pricing: "FLAT",
      maxQuantity: 1,
      global: true,
      sortOrder: 4,
    },
    {
      slug: "custom-pickup",
      name: "Custom Pickup Location",
      description: "We'll pick your group up from a dock of your choice within the service area.",
      priceCents: 10000,
      pricing: "FLAT",
      maxQuantity: 1,
      global: true,
      sortOrder: 5,
    },
    {
      slug: "premium-fishing-package",
      name: "Premium Fishing Package",
      description: "Upgraded rods and reels, premium live bait, and specialty rigs.",
      priceCents: 17500,
      pricing: "FLAT",
      maxQuantity: 1,
      global: false, // attached to fishing charters below
      sortOrder: 6,
    },
  ] as const;

  for (const a of addons) {
    await prisma.tripAddon.upsert({
      where: { slug: a.slug },
      update: { ...a },
      create: { ...a },
    });
  }

  // Attach the premium fishing package to the two fishing charters.
  const premium = await prisma.tripAddon.findUniqueOrThrow({
    where: { slug: "premium-fishing-package" },
  });
  await prisma.tripAddon.update({
    where: { id: premium.id },
    data: {
      packages: {
        set: [],
        connect: [
          { slug: "inshore-fishing-charter" },
          { slug: "full-day-fishing-charter" },
        ],
      },
    },
  });
  console.log(`  ✓ ${addons.length} add-ons`);

  // ── Availability rules ─────────────────────────────────────────────
  // Global default: every day, morning + afternoon departures.
  const existingGlobal = await prisma.availabilityRule.findFirst({
    where: { packageId: null, label: "Default schedule" },
  });
  if (!existingGlobal) {
    await prisma.availabilityRule.create({
      data: {
        packageId: null,
        daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
        startTimes: ["07:00", "13:00"],
        label: "Default schedule",
        active: true,
      },
    });
  }

  // Sunset cruise departs in the evening only.
  const sunset = await prisma.tripPackage.findUniqueOrThrow({
    where: { slug: "sunset-cruise" },
  });
  const existingSunset = await prisma.availabilityRule.findFirst({
    where: { packageId: sunset.id },
  });
  if (!existingSunset) {
    await prisma.availabilityRule.create({
      data: {
        packageId: sunset.id,
        daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
        startTimes: ["18:00"],
        label: "Sunset departures",
        active: true,
      },
    });
  }

  // Dolphin tour gets a mid-morning + mid-afternoon slot.
  const dolphin = await prisma.tripPackage.findUniqueOrThrow({
    where: { slug: "dolphin-wildlife-tour" },
  });
  const existingDolphin = await prisma.availabilityRule.findFirst({
    where: { packageId: dolphin.id },
  });
  if (!existingDolphin) {
    await prisma.availabilityRule.create({
      data: {
        packageId: dolphin.id,
        daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
        startTimes: ["09:30", "14:30"],
        label: "Dolphin tour departures",
        active: true,
      },
    });
  }
  console.log("  ✓ availability rules");

  console.log("Seed complete. Create an admin with: npm run create-admin");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
