import type { Metadata } from "next";
import Link from "next/link";
import { FAQS } from "@/lib/content";
import { faqSchema } from "@/lib/schema-org";
import { JsonLd } from "@/components/shared/JsonLd";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { siteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Frequently Asked Questions",
  description:
    "Everything you need to know before your charter: licenses, weather, kids, what to bring, deposits, and cancellations.",
  alternates: { canonical: `${siteUrl()}/faq` },
};

export default function FaqPage() {
  return (
    <div className="bg-cream-50 py-14">
      <JsonLd data={faqSchema(FAQS.map((f) => ({ q: f.q, a: f.a })))} />
      <div className="container-content max-w-3xl">
        <SectionHeading
          eyebrow="Good to know"
          title="Frequently asked questions"
          intro="Can't find your answer? We're happy to help — see the contact page."
        />
        <div className="space-y-3">
          {FAQS.map((f) => (
            <details key={f.q} className="group rounded-lg border border-tan-200 bg-white p-5">
              <summary className="cursor-pointer list-none font-heading text-base font-bold text-navy-900 marker:content-none">
                {f.q}
              </summary>
              <p className="mt-3 leading-relaxed text-navy-600">{f.a}</p>
            </details>
          ))}
        </div>
        <div className="mt-10 text-center">
          <Link href="/trips" className="btn-primary">
            Ready? Book Your Adventure
          </Link>
        </div>
      </div>
    </div>
  );
}
