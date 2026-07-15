import Link from "next/link";
import { Anchor, Phone, Mail, MapPin } from "lucide-react";
import { LogoLockup } from "@/components/brand/Logo";
import { PLACEHOLDER_CONTACT, SITE_LEGAL_NAME } from "@/lib/site";
import { PhoneLink } from "@/components/shared/PhoneLink";

/* Brand icons (removed from lucide v1) — minimal inline equivalents. */
function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

const POLICY_LINKS = [
  { href: "/policies/cancellation", label: "Cancellation Policy" },
  { href: "/policies/weather", label: "Weather Policy" },
  { href: "/policies/refunds", label: "Refund Policy" },
  { href: "/policies/liability-waiver", label: "Liability Waiver" },
  { href: "/policies/terms", label: "Terms & Conditions" },
  { href: "/policies/privacy", label: "Privacy Policy" },
  { href: "/policies/accessibility", label: "Accessibility" },
];

export function Footer() {
  return (
    <footer className="bg-navy-900 text-cream-100">
      <div className="rope-divider" role="presentation" />
      <div className="container-content grid gap-10 py-12 md:grid-cols-4">
        <div className="md:col-span-2">
          <LogoLockup dark />
          <p className="mt-3 font-heading text-sm font-bold uppercase tracking-[0.2em] text-tan-300">
            Explore More. Live Salty.
          </p>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-navy-100/80">
            Premium fishing charters, coastal tours, and private adventures with a
            little western grit aboard our 2018 24ft Skeeter. Family-owned,
            coast-proud, and always chasing the next horizon.
          </p>
          <div className="mt-5 flex gap-4">
            <a
              href={PLACEHOLDER_CONTACT.instagram}
              className="rounded-md p-2 text-cream-100 hover:text-coastal-300"
              aria-label="Instagram"
              rel="noopener noreferrer"
              target="_blank"
            >
              <InstagramIcon />
            </a>
            <a
              href={PLACEHOLDER_CONTACT.facebook}
              className="rounded-md p-2 text-cream-100 hover:text-coastal-300"
              aria-label="Facebook"
              rel="noopener noreferrer"
              target="_blank"
            >
              <FacebookIcon />
            </a>
          </div>
        </div>

        <div>
          <h2 className="mb-3 font-heading text-sm font-bold uppercase tracking-widest text-coastal-300">
            Contact
          </h2>
          <ul className="space-y-3 text-sm">
            <li className="flex items-start gap-2">
              <Phone className="mt-0.5 h-4 w-4 shrink-0 text-coastal-300" aria-hidden />
              <PhoneLink className="hover:text-coastal-300" />
            </li>
            <li className="flex items-start gap-2">
              <Mail className="mt-0.5 h-4 w-4 shrink-0 text-coastal-300" aria-hidden />
              <a href={`mailto:${PLACEHOLDER_CONTACT.email}`} className="break-all hover:text-coastal-300">
                {PLACEHOLDER_CONTACT.email}
              </a>
            </li>
            <li className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-coastal-300" aria-hidden />
              <span>{PLACEHOLDER_CONTACT.marinaAddress}</span>
            </li>
          </ul>
        </div>

        <div>
          <h2 className="mb-3 font-heading text-sm font-bold uppercase tracking-widest text-coastal-300">
            Policies
          </h2>
          <ul className="space-y-2 text-sm">
            {POLICY_LINKS.map((p) => (
              <li key={p.href}>
                <Link href={p.href} className="hover:text-coastal-300">
                  {p.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-navy-700">
        <div className="container-content flex flex-col items-center justify-between gap-2 py-5 text-xs text-navy-100/60 sm:flex-row">
          <p className="flex items-center gap-1.5">
            <Anchor className="h-3.5 w-3.5" aria-hidden />
            © {new Date().getFullYear()} {SITE_LEGAL_NAME} All rights reserved. Est. 2024.
          </p>
          <p>Licensed &amp; insured · USCG-licensed captain</p>
        </div>
      </div>
    </footer>
  );
}
