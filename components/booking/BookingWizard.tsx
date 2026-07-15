"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, ChevronLeft } from "lucide-react";
import { SlotPicker, type SlotSelection } from "@/components/booking/SlotPicker";
import { PriceSummary } from "@/components/booking/PriceSummary";
import { guestDetailsSchema } from "@/lib/validation/booking";
import { computePricing, type PricingBreakdown } from "@/lib/pricing";
import { formatCents } from "@/lib/money";
import { formatYmd, formatTime } from "@/lib/dates";
import { POLICY_KEYS, POLICY_LABELS, type PolicyKey } from "@/lib/site";
import { analytics } from "@/lib/analytics";

/** Serializable props passed from the server component. */
export interface WizardPackage {
  id: string;
  slug: string;
  name: string;
  durationMinutes: number;
  basePriceCents: number;
  includedGuests: number;
  maxGuests: number;
  additionalGuestFeeCents: number;
  depositMode: "FULL_ONLY" | "DEPOSIT_ONLY" | "CUSTOMER_CHOICE";
  depositPercent: number;
  showFishingExperience: boolean;
}

export interface WizardAddon {
  id: string;
  name: string;
  description: string;
  priceCents: number;
  pricing: "FLAT" | "PER_GUEST";
  maxQuantity: number;
}

export interface WizardSettings {
  taxRateBps: number;
  bookingFeeBps: number;
}

type GuestForm = z.infer<typeof guestDetailsSchema>;

const STEPS = ["Date & time", "Your details", "Add-ons", "Review & pay"] as const;

export function BookingWizard({
  pkg,
  addons,
  settings,
  initialSelection,
}: {
  pkg: WizardPackage;
  addons: WizardAddon[];
  settings: WizardSettings;
  initialSelection: SlotSelection | null;
}) {
  const [step, setStep] = useState(0);
  const [slot, setSlot] = useState<SlotSelection | null>(initialSelection);
  const [guest, setGuest] = useState<GuestForm | null>(null);
  const [addonQty, setAddonQty] = useState<Record<string, number>>({});
  const [paymentPlan, setPaymentPlan] = useState<"DEPOSIT" | "FULL">(
    pkg.depositMode === "FULL_ONLY" ? "FULL" : "DEPOSIT",
  );
  const [accepted, setAccepted] = useState<Record<PolicyKey, boolean>>({
    terms: false,
    cancellation: false,
    weather: false,
    liability: false,
    payment: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const adults = guest?.adults ?? 2;
  const children = guest?.children ?? 0;

  const pricing: PricingBreakdown | null = useMemo(() => {
    try {
      return computePricing({
        pkg,
        adults,
        children,
        addons: addons
          .filter((a) => (addonQty[a.id] ?? 0) > 0)
          .map((a) => ({ addon: a, quantity: addonQty[a.id] })),
        settings,
        requestedPlan: paymentPlan,
      });
    } catch {
      return null;
    }
  }, [pkg, adults, children, addons, addonQty, settings, paymentPlan]);

  const addonNames = useMemo(() => new Map(addons.map((a) => [a.id, a.name])), [addons]);
  const allAccepted = POLICY_KEYS.every((k) => accepted[k]);

  async function submit() {
    if (!slot || !guest || !pricing || !allAccepted || submitting) return;
    setSubmitting(true);
    setSubmitError(null);
    analytics.beginCheckout(pkg.slug, pricing.dueTodayCents);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packageId: pkg.id,
          date: slot.date,
          startTime: slot.startTime,
          guest,
          addons: addons
            .filter((a) => (addonQty[a.id] ?? 0) > 0)
            .map((a) => ({ addonId: a.id, quantity: addonQty[a.id] })),
          paymentPlan,
          policiesAccepted: true,
        }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        throw new Error(data.error ?? "Checkout failed. Please try again.");
      }
      window.location.assign(data.url);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Checkout failed. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_minmax(20rem,24rem)]">
      <div>
        {/* Step indicator */}
        <ol className="mb-8 flex flex-wrap gap-2" aria-label="Booking steps">
          {STEPS.map((label, i) => (
            <li
              key={label}
              aria-current={i === step ? "step" : undefined}
              className={`flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-bold uppercase tracking-wide ${
                i === step
                  ? "bg-navy-800 text-cream-50"
                  : i < step
                    ? "bg-seafoam-100 text-seafoam-800"
                    : "bg-cream-200 text-navy-500"
              }`}
            >
              <span aria-hidden>{i + 1}</span> {label}
            </li>
          ))}
        </ol>

        {step > 0 ? (
          <button
            type="button"
            onClick={() => setStep((s) => s - 1)}
            className="mb-5 inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-coastal-700"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden /> Back
          </button>
        ) : null}

        {step === 0 ? (
          <section aria-label="Select date and time">
            <SlotPicker packageSlug={pkg.slug} value={slot} onSelect={setSlot} />
            <button
              type="button"
              className="btn-primary mt-6 w-full sm:w-auto"
              disabled={!slot}
              onClick={() => setStep(1)}
            >
              {slot
                ? `Continue — ${formatYmd(slot.date, "MMM d")} at ${formatTime(slot.startTime)}`
                : "Select a date and time to continue"}
            </button>
          </section>
        ) : null}

        {step === 1 ? (
          <GuestDetailsStep
            pkg={pkg}
            defaults={guest}
            onSubmit={(values) => {
              setGuest(values);
              setStep(2);
            }}
          />
        ) : null}

        {step === 2 ? (
          <section aria-label="Add-ons">
            <h2 className="text-2xl font-bold">Optional upgrades</h2>
            <p className="mt-1 text-sm text-navy-600">
              Make it your own — prices update in the summary as you pick.
            </p>
            <ul className="mt-6 space-y-3">
              {addons.map((addon) => {
                const qty = addonQty[addon.id] ?? 0;
                return (
                  <li
                    key={addon.id}
                    className="flex items-center justify-between gap-4 rounded-xl border border-tan-200 bg-white p-4"
                  >
                    <div>
                      <p className="font-bold text-navy-900">{addon.name}</p>
                      <p className="text-sm text-navy-600">{addon.description}</p>
                      <p className="mt-1 text-sm font-semibold text-tan-700">
                        {formatCents(addon.priceCents, { compact: true })}
                        {addon.pricing === "PER_GUEST" ? " per guest" : ""}
                      </p>
                    </div>
                    {addon.maxQuantity > 1 ? (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          className="h-11 w-11 rounded-md border border-tan-200 font-bold text-navy-800 disabled:opacity-40"
                          onClick={() =>
                            setAddonQty((q) => ({ ...q, [addon.id]: Math.max(0, qty - 1) }))
                          }
                          disabled={qty === 0}
                          aria-label={`Remove one ${addon.name}`}
                        >
                          −
                        </button>
                        <span className="w-6 text-center font-bold tabular-nums" aria-live="polite">
                          {qty}
                        </span>
                        <button
                          type="button"
                          className="h-11 w-11 rounded-md border border-tan-200 font-bold text-navy-800 disabled:opacity-40"
                          onClick={() =>
                            setAddonQty((q) => ({
                              ...q,
                              [addon.id]: Math.min(addon.maxQuantity, qty + 1),
                            }))
                          }
                          disabled={qty >= addon.maxQuantity}
                          aria-label={`Add one ${addon.name}`}
                        >
                          +
                        </button>
                      </div>
                    ) : (
                      <label className="flex min-h-11 cursor-pointer items-center gap-2">
                        <input
                          type="checkbox"
                          className="h-5 w-5 rounded border-tan-300 text-navy-800"
                          checked={qty > 0}
                          onChange={(e) =>
                            setAddonQty((q) => ({ ...q, [addon.id]: e.target.checked ? 1 : 0 }))
                          }
                        />
                        <span className="text-sm font-semibold">Add</span>
                      </label>
                    )}
                  </li>
                );
              })}
              {addons.length === 0 ? (
                <li className="text-sm text-navy-600">No add-ons available for this trip.</li>
              ) : null}
            </ul>

            {pkg.depositMode === "CUSTOMER_CHOICE" && pricing ? (
              <fieldset className="mt-8 rounded-xl border border-tan-200 bg-white p-5">
                <legend className="px-1 font-heading font-bold">How would you like to pay?</legend>
                <div className="mt-2 space-y-3">
                  <label className="flex min-h-11 cursor-pointer items-start gap-3">
                    <input
                      type="radio"
                      name="paymentPlan"
                      className="mt-1 h-5 w-5"
                      checked={paymentPlan === "DEPOSIT"}
                      onChange={() => setPaymentPlan("DEPOSIT")}
                    />
                    <span>
                      <span className="font-semibold">
                        Reserve with a {pkg.depositPercent}% deposit ({formatCents(pricing.depositCents)})
                      </span>
                      <span className="block text-sm text-navy-600">
                        Pay the rest online before your trip or at the dock.
                      </span>
                    </span>
                  </label>
                  <label className="flex min-h-11 cursor-pointer items-start gap-3">
                    <input
                      type="radio"
                      name="paymentPlan"
                      className="mt-1 h-5 w-5"
                      checked={paymentPlan === "FULL"}
                      onChange={() => setPaymentPlan("FULL")}
                    />
                    <span>
                      <span className="font-semibold">
                        Pay in full today ({formatCents(pricing.totalCents)})
                      </span>
                      <span className="block text-sm text-navy-600">All settled — just show up.</span>
                    </span>
                  </label>
                </div>
              </fieldset>
            ) : null}

            <button type="button" className="btn-primary mt-8 w-full sm:w-auto" onClick={() => setStep(3)}>
              Continue to review
            </button>
          </section>
        ) : null}

        {step === 3 && slot && guest && pricing ? (
          <section aria-label="Review and pay">
            <h2 className="text-2xl font-bold">Review your booking</h2>
            <dl className="mt-5 space-y-2 rounded-xl border border-tan-200 bg-white p-5 text-sm">
              {[
                ["Trip", pkg.name],
                ["Date", formatYmd(slot.date)],
                ["Departure", formatTime(slot.startTime)],
                ["Guests", `${guest.adults} adult${guest.adults === 1 ? "" : "s"}${guest.children ? `, ${guest.children} child${guest.children === 1 ? "" : "ren"}` : ""}`],
                ["Lead guest", `${guest.firstName} ${guest.lastName}`],
                ["Email", guest.email],
                ["Phone", guest.phone],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4">
                  <dt className="text-navy-500">{k}</dt>
                  <dd className="text-right font-semibold text-navy-900">{v}</dd>
                </div>
              ))}
            </dl>

            <fieldset className="mt-6 rounded-xl border border-tan-200 bg-white p-5">
              <legend className="px-1 font-heading font-bold">Policies &amp; waivers</legend>
              <p className="mb-3 text-sm text-navy-600">
                Please read and accept each policy. Your acceptance is recorded with a timestamp.
              </p>
              <div className="space-y-3">
                {POLICY_KEYS.map((key) => (
                  <label key={key} className="flex min-h-11 cursor-pointer items-start gap-3">
                    <input
                      type="checkbox"
                      className="mt-0.5 h-5 w-5 rounded border-tan-300"
                      checked={accepted[key]}
                      onChange={(e) => setAccepted((a) => ({ ...a, [key]: e.target.checked }))}
                    />
                    <span className="text-sm">
                      I have read and agree to the{" "}
                      <Link
                        href={POLICY_LABELS[key].href}
                        target="_blank"
                        className="font-semibold text-coastal-700 underline underline-offset-2"
                      >
                        {POLICY_LABELS[key].label}
                      </Link>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            {submitError ? (
              <p role="alert" className="mt-4 rounded-md bg-red-50 p-3 text-sm font-medium text-red-800">
                {submitError}
              </p>
            ) : null}

            <button
              type="button"
              className="btn-accent mt-6 w-full"
              disabled={!allAccepted || submitting}
              onClick={submit}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> Redirecting to secure
                  checkout…
                </>
              ) : (
                `Pay ${formatCents(pricing.dueTodayCents)} securely`
              )}
            </button>
            <p className="mt-3 text-center text-xs text-navy-500">
              You&apos;ll be redirected to Stripe. Apple Pay and Google Pay supported where available.
            </p>
          </section>
        ) : null}
      </div>

      <aside className="lg:sticky lg:top-24 lg:self-start">
        {pricing ? (
          <PriceSummary pricing={pricing} addonNames={addonNames} tripName={pkg.name} />
        ) : null}
        {slot ? (
          <p className="mt-3 rounded-lg bg-cream-100 p-3 text-sm font-semibold text-navy-800">
            {formatYmd(slot.date, "EEE, MMM d")} · {formatTime(slot.startTime)}
          </p>
        ) : null}
      </aside>
    </div>
  );
}

/** Step 3 (guest details) with react-hook-form + zod validation. */
function GuestDetailsStep({
  pkg,
  defaults,
  onSubmit,
}: {
  pkg: WizardPackage;
  defaults: GuestForm | null;
  onSubmit: (values: GuestForm) => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<GuestForm>({
    resolver: zodResolver(guestDetailsSchema),
    defaultValues: defaults ?? { adults: 2, children: 0 },
  });

  const field = (
    name: keyof GuestForm,
    label: string,
    props: React.InputHTMLAttributes<HTMLInputElement> = {},
  ) => (
    <div>
      <label htmlFor={String(name)} className="field-label">
        {label}
      </label>
      <input
        id={String(name)}
        className="field-input"
        aria-invalid={errors[name] ? true : undefined}
        aria-describedby={errors[name] ? `${String(name)}-error` : undefined}
        {...props}
        {...register(name, {
          setValueAs:
            props.type === "number" ? (v) => (v === "" ? undefined : Number(v)) : undefined,
        })}
      />
      {errors[name] ? (
        <p id={`${String(name)}-error`} role="alert" className="field-error">
          {String(errors[name]?.message)}
        </p>
      ) : null}
    </div>
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate aria-label="Guest details">
      <h2 className="text-2xl font-bold">Who&apos;s coming aboard?</h2>
      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        {field("firstName", "First name", { autoComplete: "given-name" })}
        {field("lastName", "Last name", { autoComplete: "family-name" })}
        {field("email", "Email", { type: "email", autoComplete: "email", inputMode: "email" })}
        {field("phone", "Phone number", { type: "tel", autoComplete: "tel", inputMode: "tel" })}
        {field("adults", `Adults (max ${pkg.maxGuests})`, { type: "number", min: 1, max: pkg.maxGuests })}
        {field("children", "Children", { type: "number", min: 0, max: pkg.maxGuests - 1 })}
        {field("emergencyContactName", "Emergency contact name")}
        {field("emergencyContactPhone", "Emergency contact phone", { type: "tel", inputMode: "tel" })}
      </div>

      {pkg.showFishingExperience ? (
        <div className="mt-5">
          <label htmlFor="fishingExperience" className="field-label">
            Fishing experience level
          </label>
          <select id="fishingExperience" className="field-input" {...register("fishingExperience")}>
            <option value="NONE">First time</option>
            <option value="BEGINNER">Beginner</option>
            <option value="INTERMEDIATE">Intermediate</option>
            <option value="EXPERIENCED">Experienced</option>
          </select>
        </div>
      ) : null}

      <div className="mt-5">
        <label htmlFor="specialRequests" className="field-label">
          Special requests <span className="font-normal text-navy-500">(optional)</span>
        </label>
        <textarea
          id="specialRequests"
          rows={3}
          className="field-input"
          {...register("specialRequests")}
        />
      </div>
      <div className="mt-5">
        <label htmlFor="accessibilityNeeds" className="field-label">
          Accessibility needs <span className="font-normal text-navy-500">(optional)</span>
        </label>
        <textarea
          id="accessibilityNeeds"
          rows={2}
          className="field-input"
          {...register("accessibilityNeeds")}
        />
      </div>

      <button type="submit" className="btn-primary mt-8 w-full sm:w-auto">
        Continue to add-ons
      </button>
    </form>
  );
}
