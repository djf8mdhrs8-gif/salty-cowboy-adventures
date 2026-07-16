/** Static site constants shared by client and server code. */

export const SITE_NAME = "Salty Cowboy Adventures";
export const SITE_LEGAL_NAME = "Salty Cowboy Adventures Inc.";
export const SITE_TAGLINE = "Fishing, Coastal Tours, and Private Adventures";
export const SITE_MOTTO = "Explore More. Live Salty.";
export const SITE_EST = "2024";
export const BOAT_NAME = "2018 24ft Skeeter center-console";

export function siteUrl(): string {
  // Explicit setting wins; otherwise fall back to the production domain
  // Vercel injects, so links stay correct even if the env var is missing.
  const configured =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "http://localhost:3000");
  return configured.replace(/\/$/, "");
}

/** Placeholder contact details — the live values are editable in the admin
 *  Settings page (stored in the SiteSettings table). */
export const PLACEHOLDER_CONTACT = {
  phone: "(239) 571-1479",
  phoneHref: "tel:+12395711479",
  email: "bookings@saltycowboyadventures.com",
  marinaAddress: "Marco Island, FL (departure dock shared at booking)",
  serviceArea: "Marco Island, Naples, and the waters of Southwest Florida",
  instagram: "https://instagram.com/saltycowboyadventures",
  facebook: "https://facebook.com/saltycowboyadventures",
};

export const POLICY_VERSION = "2026-01-v1";

export const POLICY_KEYS = [
  "terms",
  "cancellation",
  "weather",
  "liability",
  "payment",
] as const;
export type PolicyKey = (typeof POLICY_KEYS)[number];

export const POLICY_LABELS: Record<PolicyKey, { label: string; href: string }> = {
  terms: { label: "Terms & Conditions", href: "/policies/terms" },
  cancellation: { label: "Cancellation Policy", href: "/policies/cancellation" },
  weather: { label: "Weather Policy", href: "/policies/weather" },
  liability: { label: "Liability Waiver", href: "/policies/liability-waiver" },
  payment: { label: "Payment & Refund Policy", href: "/policies/refunds" },
};
