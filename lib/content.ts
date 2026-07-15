/** Marketing copy that isn't stored in the database (FAQ, reviews). */

export const FAQS = [
  {
    q: "Do I need a fishing license?",
    a: "No — everyone fishing under our charter is covered by the boat's license while aboard. Just show up ready to fish.",
  },
  {
    q: "What happens if the weather turns bad?",
    a: "The captain makes the final safety call. If we cancel for weather you choose a free reschedule or a full refund — no penalty, ever. See our weather policy for details.",
  },
  {
    q: "Are kids welcome aboard?",
    a: "Absolutely. We're a family-friendly operation and carry U.S. Coast Guard–approved life jackets in kids' sizes. Children of all ages are welcome on our tours; we recommend ages 4+ for fishing trips.",
  },
  {
    q: "Can I bring food and drinks?",
    a: "Yes — bring whatever you like, including alcohol where legally permitted for guests 21+. We just ask: no glass bottles and no red wine (it stains the deck).",
  },
  {
    q: "How far in advance should I book?",
    a: "Prime dates (weekends, holidays, and season) fill 2–4 weeks out. Online booking closes 24 hours before departure; for last-minute trips, give us a call.",
  },
  {
    q: "Is a deposit required?",
    a: "Most trips let you choose: reserve with a deposit and settle the balance later, or pay in full up front. The exact deposit is shown before you pay.",
  },
  {
    q: "What if I need to cancel?",
    a: "Cancel 7+ days before departure for a full refund, 3–6 days for a 50% refund; inside 72 hours bookings are non-refundable but may be rescheduled once. Full details in our cancellation policy.",
  },
  {
    q: "Do you get seasick on these trips?",
    a: "Most of our trips run calm, protected inshore waters — seasickness is rare. If you're prone to motion sickness, take your usual remedy about an hour before departure.",
  },
] as const;

export const REVIEWS = [
  {
    name: "Melissa R.",
    trip: "Inshore Fishing Charter",
    quote:
      "Captain put my two boys on redfish within the first hour and cleaned our catch at the dock. Best family morning we've had in years.",
    rating: 5,
  },
  {
    name: "Dan & Kathy T.",
    trip: "Sunset Cruise",
    quote:
      "We booked the sunset cruise for our anniversary. Smooth water, cold drinks, and a sky that looked painted. Worth every penny.",
    rating: 5,
  },
  {
    name: "Jorge M.",
    trip: "Full-Day Fishing Charter",
    quote:
      "Serious operation — quality gear, found fish all day, and the boat is immaculate. Booked my next trip before we hit the dock.",
    rating: 5,
  },
  {
    name: "The Hendersons",
    trip: "Dolphin & Wildlife Tour",
    quote:
      "Dolphins surfed our wake for ten straight minutes and the kids are still talking about it. The captain knew every bird and island by name.",
    rating: 5,
  },
] as const;

export const WHY_CHOOSE_US = [
  {
    title: "USCG-Licensed Captain",
    body: "A licensed, insured captain with years of local water knowledge — safety first, fish second, always.",
  },
  {
    title: "Premium, Spotless Boat",
    body: "A meticulously kept 2018 24ft Skeeter center-console with a Yamaha 250 — T-top shade, dry storage, and room for the whole crew.",
  },
  {
    title: "Everything Included",
    body: "Quality rods, tackle, bait, ice, and fish cleaning where permitted. Show up, step aboard, adventure.",
  },
  {
    title: "Family-Friendly Crew",
    body: "First-timers, kids, and grandparents welcome. We tailor every trip to the crew aboard.",
  },
  {
    title: "Book Online in Minutes",
    body: "Real-time availability, secure payment, and instant confirmation — no phone tag required.",
  },
  {
    title: "Fair Weather Guarantee",
    body: "If the captain calls off a trip for weather, you reschedule free or get a full refund. Simple.",
  },
] as const;
