"use client";

import { formatCents } from "@/lib/money";
import type { PricingBreakdown } from "@/lib/pricing";

/** Live price breakdown panel shown throughout the booking flow. */
export function PriceSummary({
  pricing,
  addonNames,
  tripName,
}: {
  pricing: PricingBreakdown;
  addonNames: Map<string, string>;
  tripName: string;
}) {
  const row = (label: string, cents: number, opts?: { bold?: boolean; id?: string }) => (
    <div
      className={`flex items-baseline justify-between gap-3 ${opts?.bold ? "font-bold text-navy-900" : "text-navy-700"}`}
    >
      <dt className="text-sm">{label}</dt>
      <dd className="whitespace-nowrap text-sm tabular-nums">{formatCents(cents)}</dd>
    </div>
  );

  return (
    <div className="rounded-xl border border-tan-200 bg-white p-5 shadow-card">
      <h2 className="font-heading text-lg font-bold">Price summary</h2>
      <dl className="mt-4 space-y-2" aria-live="polite">
        {row(tripName, pricing.basePriceCents)}
        {pricing.extraGuests > 0
          ? row(`Additional guests × ${pricing.extraGuests}`, pricing.extraGuestFeeCents)
          : null}
        {pricing.addonLines.map((line) =>
          row(
            `${addonNames.get(line.addonId) ?? "Add-on"}${line.quantity > 1 ? ` × ${line.quantity}` : ""}`,
            line.totalCents,
          ),
        )}
        <div className="border-t border-tan-100 pt-2">
          {row("Subtotal", pricing.subtotalCents)}
          {pricing.feeCents > 0 ? row("Booking fee", pricing.feeCents) : null}
          {pricing.taxCents > 0 ? row("Tax", pricing.taxCents) : null}
        </div>
        <div className="border-t border-tan-100 pt-2">
          {row("Trip total", pricing.totalCents, { bold: true })}
        </div>
        <div className="rounded-lg bg-cream-100 p-3">
          {row(
            pricing.paymentPlan === "DEPOSIT" ? "Deposit due today" : "Due today",
            pricing.dueTodayCents,
            { bold: true },
          )}
          {pricing.remainingBalanceCents > 0
            ? row("Remaining balance", pricing.remainingBalanceCents)
            : null}
        </div>
      </dl>
      <p className="mt-3 text-xs leading-relaxed text-navy-500">
        Payments are processed securely by Stripe. We never see or store your card details.
      </p>
    </div>
  );
}
