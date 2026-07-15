"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { analytics } from "@/lib/analytics";

/**
 * Shown while the Stripe webhook hasn't confirmed the payment yet. Polls the
 * status endpoint and refreshes the page once the booking is confirmed.
 */
export function ConfirmationPoller({
  sessionId,
  tripSlug,
  dueTodayCents,
}: {
  sessionId: string;
  tripSlug: string;
  dueTodayCents: number;
}) {
  const router = useRouter();
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    if (attempts >= 30) return; // ~1 minute, then show the fallback note
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/booking-status?session_id=${encodeURIComponent(sessionId)}`);
        const data = (await res.json()) as { paymentStatus?: string };
        if (data.paymentStatus === "PAID") {
          analytics.bookingConversion(tripSlug, dueTodayCents);
          router.refresh();
          return;
        }
      } catch {
        // network hiccup — keep polling
      }
      setAttempts((a) => a + 1);
    }, 2000);
    return () => clearTimeout(t);
  }, [attempts, sessionId, tripSlug, dueTodayCents, router]);

  return (
    <div role="status" aria-live="polite" className="rounded-xl bg-cream-100 p-6 text-center">
      {attempts < 30 ? (
        <>
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-coastal-600" aria-hidden />
          <p className="mt-3 font-semibold text-navy-800">Finalizing your payment…</p>
          <p className="mt-1 text-sm text-navy-600">
            This usually takes a few seconds. Don&apos;t close this page.
          </p>
        </>
      ) : (
        <p className="text-sm leading-relaxed text-navy-700">
          Your payment is still being verified. You&apos;ll receive a confirmation email as soon as
          it completes — no need to book again. If you don&apos;t hear from us within an hour,
          please contact us.
        </p>
      )}
    </div>
  );
}
