"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { SlotPicker, type SlotSelection } from "@/components/booking/SlotPicker";
import { formatYmd, formatTime } from "@/lib/dates";

/** Availability calendar on the trip detail page; carries the chosen slot
 *  into the booking flow. Includes the sticky mobile "Book now" bar. */
export function TripAvailability({
  packageSlug,
  priceLabel,
}: {
  packageSlug: string;
  priceLabel: string;
}) {
  const router = useRouter();
  const [selection, setSelection] = useState<SlotSelection | null>(null);

  const bookHref = selection
    ? `/book/${packageSlug}?date=${selection.date}&time=${selection.startTime}`
    : `/book/${packageSlug}`;

  return (
    <>
      <SlotPicker packageSlug={packageSlug} value={selection} onSelect={setSelection} />

      <div className="mt-6 rounded-lg bg-cream-100 p-4">
        <p aria-live="polite" className="text-sm font-semibold text-navy-800">
          {selection
            ? `Selected: ${formatYmd(selection.date, "EEE, MMM d")} at ${formatTime(selection.startTime)}`
            : "Pick a date and time, or continue and choose during checkout."}
        </p>
        <button
          type="button"
          onClick={() => router.push(bookHref)}
          className="btn-accent mt-3 w-full"
        >
          Book Now
        </button>
      </div>

      {/* Sticky mobile booking bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-tan-200 bg-white/95 p-3 backdrop-blur md:hidden no-print">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm">
            <span className="block text-xs uppercase tracking-wide text-navy-500">From</span>
            <span className="font-heading text-lg font-bold">{priceLabel}</span>
          </p>
          <button
            type="button"
            onClick={() => router.push(bookHref)}
            className="btn-accent flex-1"
          >
            Book Now
          </button>
        </div>
      </div>
      {/* Spacer so the sticky bar never covers content on mobile */}
      <div className="h-20 md:hidden" aria-hidden />
    </>
  );
}
