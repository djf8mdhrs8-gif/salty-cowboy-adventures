"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export interface PackageFormValues {
  id?: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  durationMinutes: number;
  customDuration: boolean;
  basePriceCents: number;
  includedGuests: number;
  maxGuests: number;
  additionalGuestFeeCents: number;
  depositMode: "FULL_ONLY" | "DEPOSIT_ONLY" | "CUSTOMER_CHOICE";
  depositPercent: number;
  included: string[];
  whatToBring: string[];
  showFishingExperience: boolean;
  familyFriendly: boolean;
  featured: boolean;
  active: boolean;
  sortOrder: number;
}

const EMPTY: PackageFormValues = {
  slug: "",
  name: "",
  tagline: "",
  description: "",
  durationMinutes: 240,
  customDuration: false,
  basePriceCents: 0,
  includedGuests: 4,
  maxGuests: 6,
  additionalGuestFeeCents: 0,
  depositMode: "CUSTOMER_CHOICE",
  depositPercent: 25,
  included: [],
  whatToBring: [],
  showFishingExperience: false,
  familyFriendly: true,
  featured: false,
  active: true,
  sortOrder: 0,
};

/** Create/edit form for a trip package. */
export function PackageForm({ initial }: { initial?: PackageFormValues }) {
  const router = useRouter();
  const isNew = !initial?.id;
  const [values, setValues] = useState<PackageFormValues>(initial ?? EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const set = <K extends keyof PackageFormValues>(key: K, value: PackageFormValues[K]) => {
    setValues((v) => ({ ...v, [key]: value }));
    setSaved(false);
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const { id: _id, ...payload } = values;
      const res = await fetch(isNew ? "/api/admin/packages" : `/api/admin/packages/${initial!.id}`, {
        method: isNew ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as { error?: string; id?: string; issues?: Record<string, string[]> };
      if (!res.ok) {
        const firstIssue = data.issues ? Object.values(data.issues).flat()[0] : undefined;
        throw new Error(firstIssue ?? data.error ?? "Save failed.");
      }
      setSaved(true);
      if (isNew && data.id) {
        router.replace(`/admin/trips/${data.id}`);
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setBusy(false);
    }
  }

  const dollars = (cents: number) => (cents / 100).toString();
  const parseDollars = (v: string) => Math.max(0, Math.round(parseFloat(v || "0") * 100));

  return (
    <form onSubmit={onSubmit} className="grid gap-5 rounded-xl bg-white p-6 shadow-card lg:grid-cols-2">
      <div>
        <label htmlFor="p-name" className="field-label">Trip name</label>
        <input id="p-name" className="field-input" value={values.name} onChange={(e) => set("name", e.target.value)} required />
      </div>
      <div>
        <label htmlFor="p-slug" className="field-label">URL slug</label>
        <input id="p-slug" className="field-input" value={values.slug} onChange={(e) => set("slug", e.target.value)} pattern="[a-z0-9-]+" required />
      </div>
      <div className="lg:col-span-2">
        <label htmlFor="p-tagline" className="field-label">Tagline</label>
        <input id="p-tagline" className="field-input" value={values.tagline} onChange={(e) => set("tagline", e.target.value)} required />
      </div>
      <div className="lg:col-span-2">
        <label htmlFor="p-desc" className="field-label">Description</label>
        <textarea id="p-desc" rows={4} className="field-input" value={values.description} onChange={(e) => set("description", e.target.value)} required />
      </div>

      <div>
        <label htmlFor="p-duration" className="field-label">Duration (minutes)</label>
        <input id="p-duration" type="number" min={30} step={15} className="field-input" value={values.durationMinutes} onChange={(e) => set("durationMinutes", Number(e.target.value))} required />
      </div>
      <div className="flex items-end gap-6 pb-2">
        <label className="flex items-center gap-2 text-sm font-semibold">
          <input type="checkbox" className="h-5 w-5" checked={values.customDuration} onChange={(e) => set("customDuration", e.target.checked)} />
          Custom duration trip
        </label>
        <label className="flex items-center gap-2 text-sm font-semibold">
          <input type="checkbox" className="h-5 w-5" checked={values.showFishingExperience} onChange={(e) => set("showFishingExperience", e.target.checked)} />
          Ask fishing experience
        </label>
      </div>

      <div>
        <label htmlFor="p-price" className="field-label">Base price ($)</label>
        <input id="p-price" inputMode="decimal" className="field-input" defaultValue={dollars(values.basePriceCents)} onChange={(e) => set("basePriceCents", parseDollars(e.target.value))} required />
      </div>
      <div>
        <label htmlFor="p-guestfee" className="field-label">Additional guest fee ($)</label>
        <input id="p-guestfee" inputMode="decimal" className="field-input" defaultValue={dollars(values.additionalGuestFeeCents)} onChange={(e) => set("additionalGuestFeeCents", parseDollars(e.target.value))} />
      </div>
      <div>
        <label htmlFor="p-included-guests" className="field-label">Guests included in base price</label>
        <input id="p-included-guests" type="number" min={1} max={50} className="field-input" value={values.includedGuests} onChange={(e) => set("includedGuests", Number(e.target.value))} required />
      </div>
      <div>
        <label htmlFor="p-max-guests" className="field-label">Maximum guests</label>
        <input id="p-max-guests" type="number" min={1} max={50} className="field-input" value={values.maxGuests} onChange={(e) => set("maxGuests", Number(e.target.value))} required />
      </div>

      <div>
        <label htmlFor="p-deposit-mode" className="field-label">Deposit rule</label>
        <select id="p-deposit-mode" className="field-input" value={values.depositMode} onChange={(e) => set("depositMode", e.target.value as PackageFormValues["depositMode"])}>
          <option value="CUSTOMER_CHOICE">Customer choice (deposit or full)</option>
          <option value="DEPOSIT_ONLY">Deposit only</option>
          <option value="FULL_ONLY">Full payment only</option>
        </select>
      </div>
      <div>
        <label htmlFor="p-deposit-pct" className="field-label">Deposit percent</label>
        <input id="p-deposit-pct" type="number" min={1} max={100} className="field-input" value={values.depositPercent} onChange={(e) => set("depositPercent", Number(e.target.value))} />
      </div>

      <div className="lg:col-span-2">
        <label htmlFor="p-included" className="field-label">What&apos;s included (one per line)</label>
        <textarea id="p-included" rows={4} className="field-input" value={values.included.join("\n")} onChange={(e) => set("included", e.target.value.split("\n").map((s) => s.trim()).filter(Boolean))} />
      </div>
      <div className="lg:col-span-2">
        <label htmlFor="p-bring" className="field-label">What to bring (one per line)</label>
        <textarea id="p-bring" rows={4} className="field-input" value={values.whatToBring.join("\n")} onChange={(e) => set("whatToBring", e.target.value.split("\n").map((s) => s.trim()).filter(Boolean))} />
      </div>

      <div className="flex flex-wrap items-center gap-6">
        <label className="flex items-center gap-2 text-sm font-semibold">
          <input type="checkbox" className="h-5 w-5" checked={values.familyFriendly} onChange={(e) => set("familyFriendly", e.target.checked)} />
          Family friendly
        </label>
        <label className="flex items-center gap-2 text-sm font-semibold">
          <input type="checkbox" className="h-5 w-5" checked={values.featured} onChange={(e) => set("featured", e.target.checked)} />
          Featured on homepage
        </label>
        <label className="flex items-center gap-2 text-sm font-semibold">
          <input type="checkbox" className="h-5 w-5" checked={values.active} onChange={(e) => set("active", e.target.checked)} />
          Active (bookable)
        </label>
      </div>
      <div>
        <label htmlFor="p-sort" className="field-label">Sort order</label>
        <input id="p-sort" type="number" min={0} className="field-input !w-28" value={values.sortOrder} onChange={(e) => set("sortOrder", Number(e.target.value))} />
      </div>

      <div className="lg:col-span-2" aria-live="polite">
        {error ? (
          <p role="alert" className="mb-3 rounded-md bg-red-50 p-3 text-sm font-medium text-red-800">{error}</p>
        ) : null}
        {saved ? (
          <p className="mb-3 rounded-md bg-seafoam-50 p-3 text-sm font-medium text-seafoam-800">Saved.</p>
        ) : null}
        <button type="submit" className="btn-primary" disabled={busy}>
          {busy ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> : null}
          {isNew ? "Create package" : "Save changes"}
        </button>
      </div>
    </form>
  );
}
