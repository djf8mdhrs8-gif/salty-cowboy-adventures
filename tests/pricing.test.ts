import { describe, it, expect } from "vitest";
import {
  computePricing,
  resolvePaymentPlan,
  PricingError,
  type PricingPackage,
  type PricingAddon,
} from "@/lib/pricing";

const inshore: PricingPackage = {
  basePriceCents: 60000, // $600
  includedGuests: 4,
  maxGuests: 6,
  additionalGuestFeeCents: 7500, // $75
  depositMode: "CUSTOMER_CHOICE",
  depositPercent: 25,
};

const settings = { taxRateBps: 700, bookingFeeBps: 300 }; // 7% tax, 3% fee

const cooler: PricingAddon = { id: "cooler", priceCents: 7500, pricing: "FLAT", maxQuantity: 2 };
const perGuestPhoto: PricingAddon = { id: "photo", priceCents: 2500, pricing: "PER_GUEST", maxQuantity: 1 };

describe("computePricing", () => {
  it("prices the base trip with no extras", () => {
    const p = computePricing({ pkg: inshore, adults: 2, children: 2, addons: [], settings, requestedPlan: "FULL" });
    expect(p.subtotalCents).toBe(60000);
    expect(p.feeCents).toBe(1800); // 3% of 600
    expect(p.taxCents).toBe(Math.round(61800 * 0.07)); // 4326
    expect(p.totalCents).toBe(60000 + 1800 + 4326);
    expect(p.dueTodayCents).toBe(p.totalCents);
    expect(p.remainingBalanceCents).toBe(0);
  });

  it("charges the additional-guest fee beyond included guests", () => {
    const p = computePricing({ pkg: inshore, adults: 5, children: 1, addons: [], settings, requestedPlan: "FULL" });
    expect(p.extraGuests).toBe(2);
    expect(p.extraGuestFeeCents).toBe(15000);
    expect(p.subtotalCents).toBe(75000);
  });

  it("rejects guest counts over the maximum", () => {
    expect(() =>
      computePricing({ pkg: inshore, adults: 6, children: 1, addons: [], settings, requestedPlan: "FULL" }),
    ).toThrow(PricingError);
  });

  it("requires at least one adult", () => {
    expect(() =>
      computePricing({ pkg: inshore, adults: 0, children: 2, addons: [], settings, requestedPlan: "FULL" }),
    ).toThrow(PricingError);
  });

  it("prices flat add-ons with quantity", () => {
    const p = computePricing({
      pkg: inshore,
      adults: 2,
      children: 0,
      addons: [{ addon: cooler, quantity: 2 }],
      settings,
      requestedPlan: "FULL",
    });
    expect(p.addonsCents).toBe(15000);
    expect(p.addonLines[0]).toMatchObject({ addonId: "cooler", quantity: 2, unitPriceCents: 7500 });
  });

  it("prices per-guest add-ons by total guest count", () => {
    const p = computePricing({
      pkg: inshore,
      adults: 3,
      children: 1,
      addons: [{ addon: perGuestPhoto, quantity: 1 }],
      settings,
      requestedPlan: "FULL",
    });
    expect(p.addonsCents).toBe(2500 * 4);
  });

  it("rejects add-on quantities above the max or below one", () => {
    expect(() =>
      computePricing({
        pkg: inshore, adults: 2, children: 0,
        addons: [{ addon: cooler, quantity: 3 }],
        settings, requestedPlan: "FULL",
      }),
    ).toThrow(PricingError);
    expect(() =>
      computePricing({
        pkg: inshore, adults: 2, children: 0,
        addons: [{ addon: cooler, quantity: 0 }],
        settings, requestedPlan: "FULL",
      }),
    ).toThrow(PricingError);
  });

  it("rejects duplicate add-on selections", () => {
    expect(() =>
      computePricing({
        pkg: inshore, adults: 2, children: 0,
        addons: [
          { addon: cooler, quantity: 1 },
          { addon: cooler, quantity: 1 },
        ],
        settings, requestedPlan: "FULL",
      }),
    ).toThrow(PricingError);
  });

  it("computes a 25% deposit and remaining balance", () => {
    const p = computePricing({ pkg: inshore, adults: 4, children: 0, addons: [], settings, requestedPlan: "DEPOSIT" });
    expect(p.depositCents).toBe(Math.round(p.totalCents * 0.25));
    expect(p.dueTodayCents).toBe(p.depositCents);
    expect(p.remainingBalanceCents).toBe(p.totalCents - p.depositCents);
    expect(p.dueTodayCents + p.remainingBalanceCents).toBe(p.totalCents);
  });

  it("handles zero tax and fee rates", () => {
    const p = computePricing({
      pkg: inshore, adults: 2, children: 0, addons: [],
      settings: { taxRateBps: 0, bookingFeeBps: 0 },
      requestedPlan: "FULL",
    });
    expect(p.totalCents).toBe(60000);
    expect(p.taxCents).toBe(0);
    expect(p.feeCents).toBe(0);
  });
});

describe("resolvePaymentPlan", () => {
  it("forces FULL for FULL_ONLY packages", () => {
    expect(resolvePaymentPlan("FULL_ONLY", "DEPOSIT")).toBe("FULL");
  });
  it("forces DEPOSIT for DEPOSIT_ONLY packages", () => {
    expect(resolvePaymentPlan("DEPOSIT_ONLY", "FULL")).toBe("DEPOSIT");
  });
  it("honors the customer's choice otherwise", () => {
    expect(resolvePaymentPlan("CUSTOMER_CHOICE", "DEPOSIT")).toBe("DEPOSIT");
    expect(resolvePaymentPlan("CUSTOMER_CHOICE", "FULL")).toBe("FULL");
  });
});
