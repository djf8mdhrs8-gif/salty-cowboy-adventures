import type { Metadata } from "next";
import { Phone, Mail, MapPin } from "lucide-react";
import { PLACEHOLDER_CONTACT, siteUrl } from "@/lib/site";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { ContactForm } from "@/components/shared/ContactForm";
import { PhoneLink } from "@/components/shared/PhoneLink";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Questions about a charter or your booking? Call, email, or send us a message — we answer fast.",
  alternates: { canonical: `${siteUrl()}/contact` },
};

export default function ContactPage() {
  return (
    <div className="bg-cream-50 py-14">
      <div className="container-content max-w-4xl">
        <SectionHeading
          eyebrow="Say howdy"
          title="Contact us"
          intro="Fastest answers by phone. For booking changes, use the manage-booking page."
        />
        <div className="grid gap-10 md:grid-cols-[1fr_1.2fr]">
          <ul className="space-y-6">
            <li className="flex gap-3">
              <Phone className="mt-1 h-5 w-5 text-coastal-600" aria-hidden />
              <div>
                <h2 className="font-heading font-bold">Phone</h2>
                <PhoneLink className="text-navy-700 underline underline-offset-4" />
              </div>
            </li>
            <li className="flex gap-3">
              <Mail className="mt-1 h-5 w-5 text-coastal-600" aria-hidden />
              <div>
                <h2 className="font-heading font-bold">Email</h2>
                <a
                  href={`mailto:${PLACEHOLDER_CONTACT.email}`}
                  className="break-all text-navy-700 underline underline-offset-4"
                >
                  {PLACEHOLDER_CONTACT.email}
                </a>
              </div>
            </li>
            <li className="flex gap-3">
              <MapPin className="mt-1 h-5 w-5 text-coastal-600" aria-hidden />
              <div>
                <h2 className="font-heading font-bold">Marina</h2>
                <p className="text-navy-700">{PLACEHOLDER_CONTACT.marinaAddress}</p>
              </div>
            </li>
          </ul>
          <ContactForm />
        </div>
      </div>
    </div>
  );
}
