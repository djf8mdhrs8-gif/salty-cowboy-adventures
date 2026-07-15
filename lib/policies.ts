/**
 * Placeholder legal content. Every page renders a prominent notice that this
 * content must be reviewed by a qualified attorney before launch.
 */

export interface PolicySection {
  heading?: string;
  paragraphs: string[];
  bullets?: string[];
}

export interface PolicyDoc {
  slug: string;
  title: string;
  description: string;
  sections: PolicySection[];
}

export const POLICY_DOCS: PolicyDoc[] = [
  {
    slug: "cancellation",
    title: "Cancellation Policy",
    description: "How cancellations and refunds work for Salty Cowboy Adventures bookings.",
    sections: [
      {
        paragraphs: [
          "We understand plans change. Our cancellation terms balance flexibility for guests with the reality that a charter date turned back late usually cannot be re-sold.",
        ],
      },
      {
        heading: "Customer cancellations",
        paragraphs: ["Refunds are based on how far before your scheduled departure you cancel:"],
        bullets: [
          "7 or more days before departure: full refund of all amounts paid.",
          "3–6 days before departure: 50% refund of the total trip price.",
          "Within 72 hours of departure: non-refundable; one courtesy reschedule to another available date may be offered at our discretion.",
          "No-shows and late arrivals over 30 minutes are treated as same-day cancellations and are non-refundable.",
        ],
      },
      {
        heading: "Cancellations by us",
        paragraphs: [
          "If we cancel for any reason — including weather, mechanical issues, or captain availability — you choose a full refund or a free reschedule. See the Weather Policy for weather-specific details.",
        ],
      },
      {
        heading: "How refunds are issued",
        paragraphs: [
          "Refunds are returned to the original payment method via Stripe and typically appear within 5–10 business days, depending on your bank.",
        ],
      },
    ],
  },
  {
    slug: "weather",
    title: "Weather Policy",
    description: "How weather decisions are made and what happens when a trip is affected.",
    sections: [
      {
        paragraphs: [
          "Safety comes before everything. The captain — and only the captain — makes the final call on whether conditions are safe to run.",
        ],
      },
      {
        heading: "If we cancel for weather",
        paragraphs: ["When the captain cancels a trip for weather, you choose either:"],
        bullets: [
          "A full refund of all amounts paid, or",
          "A free reschedule to any available future date.",
        ],
      },
      {
        heading: "Weather holds",
        paragraphs: [
          "When a forecast is uncertain, we may place your booking on a temporary weather hold and confirm, reschedule, or cancel as the window firms up — usually the evening before departure. We'll keep you informed by email and phone.",
        ],
      },
      {
        heading: "What doesn't count",
        paragraphs: [
          "Ordinary heat, clouds, light chop, or brief passing showers are part of being on the water and are not grounds for a weather refund. If we run and you choose not to board, standard cancellation terms apply.",
        ],
      },
    ],
  },
  {
    slug: "refunds",
    title: "Payment & Refund Policy",
    description: "Deposits, balances, payment processing, and refunds.",
    sections: [
      {
        heading: "Payments",
        paragraphs: [
          "Payments are processed securely by Stripe. We never see or store your card details. Depending on the trip, you may pay a deposit at booking with the balance due before departure, or pay in full up front. Deposit amounts and the remaining balance are always shown before you pay.",
        ],
      },
      {
        heading: "Remaining balances",
        paragraphs: [
          "Any remaining balance can be paid online through your booking page or at the dock before departure. Bookings with unpaid balances at departure time may be treated as cancelled under the Cancellation Policy.",
        ],
      },
      {
        heading: "Refunds",
        paragraphs: [
          "Refunds follow the Cancellation Policy and Weather Policy. Approved refunds are issued to the original payment method and typically settle within 5–10 business days. Booking fees and taxes are refunded proportionally with the refunded amount.",
        ],
      },
    ],
  },
  {
    slug: "liability-waiver",
    title: "Liability Waiver & Assumption of Risk",
    description: "Waiver of liability accepted by all guests before boarding.",
    sections: [
      {
        paragraphs: [
          "All guests (or a parent/legal guardian for minors) must accept this waiver during booking. Acceptance is recorded with a timestamp and policy version.",
        ],
      },
      {
        heading: "Assumption of risk",
        paragraphs: [
          "Boating, fishing, swimming, and related water activities carry inherent risks, including but not limited to: vessel motion, slippery surfaces, weather changes, marine life, fishing equipment, sun exposure, and entering or exiting the water. By booking, each guest voluntarily assumes these risks.",
        ],
      },
      {
        heading: "Release",
        paragraphs: [
          "To the fullest extent permitted by law, guests release Salty Cowboy Adventures Inc., its owners, captains, and crew from liability for personal injury, property damage, or loss arising from ordinary negligence connected with participation in a trip. Nothing in this waiver limits liability that cannot be limited by law, including gross negligence or willful misconduct.",
        ],
      },
      {
        heading: "Guest responsibilities",
        paragraphs: ["Guests agree to:"],
        bullets: [
          "Follow all captain and crew instructions at all times.",
          "Wear provided safety equipment when directed.",
          "Disclose relevant medical conditions and swimming ability limits.",
          "Not board under the influence of drugs or excessive alcohol.",
          "Supervise minors in their party at all times.",
        ],
      },
    ],
  },
  {
    slug: "terms",
    title: "Terms & Conditions",
    description: "Terms governing bookings and use of the Salty Cowboy Adventures website.",
    sections: [
      {
        heading: "Bookings",
        paragraphs: [
          "A booking is confirmed only after payment is verified and you receive a confirmation number. Trips are private charters for your group up to the stated maximum guest count. The captain may end a trip early for safety or serious misconduct without refund.",
        ],
      },
      {
        heading: "Alcohol, smoking, and conduct",
        paragraphs: [
          "Beverages including alcohol are permitted where legally allowed for guests 21+, in moderation, no glass. Illegal substances are prohibited. Smoking is not permitted aboard.",
        ],
      },
      {
        heading: "Personal property",
        paragraphs: [
          "You are responsible for personal items brought aboard. We are not liable for items lost, damaged, or dropped overboard — dry storage is available for phones and cameras.",
        ],
      },
      {
        heading: "Website",
        paragraphs: [
          "Content on this site is provided as-is and may be updated at any time. Prices and availability shown are confirmed only at checkout. These terms are governed by the laws of the state in which the company operates.",
        ],
      },
    ],
  },
  {
    slug: "privacy",
    title: "Privacy Policy",
    description: "What data we collect, why, and how it's protected.",
    sections: [
      {
        heading: "What we collect",
        paragraphs: ["To operate bookings, we collect:"],
        bullets: [
          "Contact details: name, email, phone number.",
          "Trip details: guest counts, emergency contact, special requests, accessibility needs.",
          "Payment records: amounts, timestamps, and Stripe identifiers — never card numbers, which go directly to Stripe.",
          "Waiver acceptances: policy version, timestamp, IP address, and browser identifier.",
        ],
      },
      {
        heading: "How we use it",
        paragraphs: [
          "Your data is used to run your trip: confirmations, receipts, reminders, weather notifications, and customer support. We do not sell personal data. Transactional email is delivered via Resend; payments via Stripe — each processes data under their own privacy policies.",
        ],
      },
      {
        heading: "Analytics",
        paragraphs: [
          "If enabled, this site uses Google Analytics and the Meta Pixel for aggregate usage and advertising measurement. These tools are disabled unless configured by the business.",
        ],
      },
      {
        heading: "Your choices",
        paragraphs: [
          "Contact us to access, correct, or delete your personal information, subject to records we must retain (such as payment and waiver records).",
        ],
      },
    ],
  },
  {
    slug: "accessibility",
    title: "Accessibility Statement",
    description: "Our commitment to accessible trips and an accessible website.",
    sections: [
      {
        heading: "On the water",
        paragraphs: [
          "We want everyone on the water. Tell us about mobility, sensory, or other access needs in the booking form or by phone and we'll plan boarding assistance, seating, and pacing around your group. Some conditions (docks, tides) can limit options on a given day; we'll always discuss alternatives honestly.",
        ],
      },
      {
        heading: "On this website",
        paragraphs: [
          "This site is built to follow WCAG 2.1 AA practices: semantic HTML, keyboard navigability, visible focus states, labeled forms with announced errors, sufficient color contrast, and screen-reader-friendly status messages.",
        ],
      },
      {
        heading: "Feedback",
        paragraphs: [
          "If you hit an accessibility barrier — on the boat or on this site — please contact us. We treat accessibility reports as priority fixes.",
        ],
      },
    ],
  },
];

export function getPolicyDoc(slug: string): PolicyDoc | undefined {
  return POLICY_DOCS.find((p) => p.slug === slug);
}
