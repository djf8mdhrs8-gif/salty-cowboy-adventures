import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { POLICY_DOCS, getPolicyDoc } from "@/lib/policies";
import { POLICY_VERSION, siteUrl } from "@/lib/site";

interface Props {
  params: Promise<{ policy: string }>;
}

export function generateStaticParams() {
  return POLICY_DOCS.map((p) => ({ policy: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { policy } = await params;
  const doc = getPolicyDoc(policy);
  if (!doc) return {};
  return {
    title: doc.title,
    description: doc.description,
    alternates: { canonical: `${siteUrl()}/policies/${doc.slug}` },
  };
}

export default async function PolicyPage({ params }: Props) {
  const { policy } = await params;
  const doc = getPolicyDoc(policy);
  if (!doc) notFound();

  return (
    <div className="bg-cream-50 py-14">
      <article className="container-content max-w-3xl">
        <h1 className="text-3xl font-bold sm:text-4xl">{doc.title}</h1>
        <p className="mt-2 text-sm text-navy-500">Policy version {POLICY_VERSION}</p>

        <div
          role="note"
          className="mt-6 flex gap-3 rounded-lg border border-tan-300 bg-tan-50 p-4 text-sm leading-relaxed text-tan-900"
        >
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
          <p>
            <strong>Placeholder content.</strong> This document is sample language for
            development purposes only and must be reviewed and approved by a qualified attorney
            before this website launches.
          </p>
        </div>

        <div className="mt-8 space-y-8">
          {doc.sections.map((section, i) => (
            <section key={i}>
              {section.heading ? (
                <h2 className="text-xl font-bold">{section.heading}</h2>
              ) : null}
              {section.paragraphs.map((p, j) => (
                <p key={j} className="mt-3 leading-relaxed text-navy-700">
                  {p}
                </p>
              ))}
              {section.bullets ? (
                <ul className="mt-3 list-disc space-y-2 pl-6 text-navy-700">
                  {section.bullets.map((b) => (
                    <li key={b} className="leading-relaxed">
                      {b}
                    </li>
                  ))}
                </ul>
              ) : null}
            </section>
          ))}
        </div>
      </article>
    </div>
  );
}
