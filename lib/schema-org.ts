import { SITE_NAME, SITE_LEGAL_NAME, PLACEHOLDER_CONTACT, siteUrl } from "@/lib/site";

/** LocalBusiness structured data (placeholder address — update at launch). */
export function localBusinessSchema(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "TouristInformationCenter",
    "@id": `${siteUrl()}#business`,
    name: SITE_NAME,
    legalName: SITE_LEGAL_NAME,
    url: siteUrl(),
    telephone: PLACEHOLDER_CONTACT.phone,
    email: PLACEHOLDER_CONTACT.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: "123 Harbor Way",
      addressLocality: "Coastal Town",
      addressRegion: "ST",
      postalCode: "00000",
      addressCountry: "US",
    },
    areaServed: PLACEHOLDER_CONTACT.serviceArea,
    sameAs: [PLACEHOLDER_CONTACT.instagram, PLACEHOLDER_CONTACT.facebook],
    priceRange: "$$$",
  };
}

/** Tour/activity structured data for a trip package. */
export function tripProductSchema(pkg: {
  slug: string;
  name: string;
  seoDescription: string | null;
  tagline: string;
  basePriceCents: number;
}): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `${pkg.name} — ${SITE_NAME}`,
    description: pkg.seoDescription ?? pkg.tagline,
    url: `${siteUrl()}/trips/${pkg.slug}`,
    brand: { "@type": "Brand", name: SITE_NAME },
    offers: {
      "@type": "Offer",
      price: (pkg.basePriceCents / 100).toFixed(2),
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
      url: `${siteUrl()}/trips/${pkg.slug}`,
    },
  };
}

export function faqSchema(faqs: Array<{ q: string; a: string }>): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}
