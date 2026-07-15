import { applyBps } from "@/lib/money";

/** Minimal shapes so the pricing engine is pure and unit-testable. */
export interface PricingPackage {
  basePriceCents: number;
  includedGuests: number;
  maxGuests: number;
  additionalGuestFeeCents: number;
  depositMode: "FULL_ONLY" | "DEPOSIT_ONLY" | "CUSTOMER_CHOICE";
  depositPercent: number;
}

export interface PricingAddon {
  id: string;
  priceCents: number;
  pricing: "FLAT" | "PER_GUEST";
  maxQuantity: number;
}

export interface AddonSelection {
  addon: PricingAddon;
  quantity: number;
}

export interface PricingSettings {
  taxRateBps: number;
  bookingFeeBps: number;
}

export type PaymentPlan = "DEPOSIT" | "FULL";

export interface AddonLine {
  addonId: string;
  quantity: number;
  unitPriceCents: number;
  totalCents: number;
}

export interface PricingBreakdown {
  basePriceCents: number;
  extraGuests: number;
  extraGuestFeeCents: number;
  addonLines: AddonLine[];
  addonsCents: number;
  subtotalCents: number;
  feeCents: number;
  taxCents: number;
  totalCents: number;
  depositCents: number;
  dueTodayCents: number;
  remainingBalanceCents: number;
  paymentPlan: PaymentPlan;
}

export class PricingError extends Error {}

/**
 * Resolve the effective payment plan for a package given the customer's
 * request. FULL_ONLY / DEPOSIT_ONLY override the customer's choice.
 */
export function resolvePaymentPlan(
  depositMode: PricingPackage["depositMode"],
  requested: PaymentPlan,
): PaymentPlan {
  if (depositMode === "FULL_ONLY") return "FULL";
  if (depositMode === "DEPOSIT_ONLY") return "DEPOSIT";
  return requested;
}

/**
 * Compute the full price breakdown for a booking, entirely server-side.
 * Guests beyond `includedGuests` are charged the per-guest fee automatically.
 */
export function computePricing(params: {
  pkg: PricingPackage;
  adults: number;
  children: number;
  addons: AddonSelection[];
  settings: PricingSettings;
  requestedPlan: PaymentPlan;
}): PricingBreakdown {
  const { pkg, adults, children, addons, settings } = params;
  const guests = adults + children;

  if (adults < 1) throw new PricingError("At least one adult is required.");
  if (children < 0 || adults < 0) throw new PricingError("Invalid guest count.");
  if (guests > pkg.maxGuests) {
    throw new PricingError(
      `This trip allows a maximum of ${pkg.maxGuests} guests.`,
    );
  }

  const extraGuests = Math.max(0, guests - pkg.includedGuests);
  const extraGuestFeeCents = extraGuests * pkg.additionalGuestFeeCents;

  const seen = new Set<string>();
  const addonLines: AddonLine[] = addons.map(({ addon, quantity }) => {
    if (seen.has(addon.id)) throw new PricingError("Duplicate add-on.");
    seen.add(addon.id);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > addon.maxQuantity) {
      throw new PricingError("Invalid add-on quantity.");
    }
    const unitPriceCents =
      addon.pricing === "PER_GUEST" ? addon.priceCents * guests : addon.priceCents;
    return {
      addonId: addon.id,
      quantity,
      unitPriceCents,
      totalCents: unitPriceCents * quantity,
    };
  });

  const addonsCents = addonLines.reduce((sum, l) => sum + l.totalCents, 0);
  const subtotalCents = pkg.basePriceCents + extraGuestFeeCents + addonsCents;
  const feeCents = applyBps(subtotalCents, settings.bookingFeeBps);
  const taxCents = applyBps(subtotalCents + feeCents, settings.taxRateBps);
  const totalCents = subtotalCents + feeCents + taxCents;

  const paymentPlan = resolvePaymentPlan(pkg.depositMode, params.requestedPlan);
  const depositCents = Math.round((totalCents * pkg.depositPercent) / 100);
  const dueTodayCents = paymentPlan === "DEPOSIT" ? depositCents : totalCents;

  return {
    basePriceCents: pkg.basePriceCents,
    extraGuests,
    extraGuestFeeCents,
    addonLines,
    addonsCents,
    subtotalCents,
    feeCents,
    taxCents,
    totalCents,
    depositCents,
    dueTodayCents,
    remainingBalanceCents: totalCents - dueTodayCents,
    paymentPlan,
  };
}
