"use client";

/**
 * Client-side conversion event helpers. Safe no-ops when analytics are not
 * configured (no env vars → no scripts loaded → window globals undefined).
 */

type Gtag = (...args: unknown[]) => void;
type Fbq = (...args: unknown[]) => void;

declare global {
  interface Window {
    gtag?: Gtag;
    fbq?: Fbq;
  }
}

export function trackEvent(
  name: string,
  params?: Record<string, string | number>,
): void {
  if (typeof window === "undefined") return;
  window.gtag?.("event", name, params ?? {});
  window.fbq?.("trackCustom", name, params ?? {});
}

export const analytics = {
  beginCheckout: (tripSlug: string, valueCents: number) =>
    trackEvent("begin_checkout", { trip: tripSlug, value: valueCents / 100, currency: "USD" }),
  bookingConversion: (tripSlug: string, valueCents: number) =>
    trackEvent("purchase", { trip: tripSlug, value: valueCents / 100, currency: "USD" }),
  phoneClick: () => trackEvent("phone_click"),
  contactSubmit: () => trackEvent("contact_form_submit"),
};
