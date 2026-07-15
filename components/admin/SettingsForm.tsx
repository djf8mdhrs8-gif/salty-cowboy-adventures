"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

interface SettingsValues {
  companyName: string;
  phone: string;
  email: string;
  marinaAddress: string;
  serviceArea: string;
  instagramUrl: string;
  facebookUrl: string;
  taxRateBps: number;
  bookingFeeBps: number;
  minNoticeHours: number;
  maxAdvanceDays: number;
  turnaroundMinutes: number;
  holdMinutes: number;
  reminderDaysBefore: number[];
  balanceReminderDays: number;
}

export function SettingsForm({ initial }: { initial: SettingsValues }) {
  const router = useRouter();
  const [values, setValues] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const set = <K extends keyof SettingsValues>(key: K, value: SettingsValues[K]) => {
    setValues((v) => ({ ...v, [key]: value }));
    setSaved(false);
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = (await res.json()) as { error?: string; issues?: Record<string, string[]> };
      if (!res.ok) {
        const firstIssue = data.issues ? Object.values(data.issues).flat()[0] : undefined;
        throw new Error(firstIssue ?? data.error ?? "Save failed.");
      }
      setSaved(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setBusy(false);
    }
  }

  const text = (key: keyof SettingsValues, label: string, type = "text") => (
    <div>
      <label htmlFor={`s-${String(key)}`} className="field-label">{label}</label>
      <input
        id={`s-${String(key)}`}
        type={type}
        className="field-input"
        value={String(values[key])}
        onChange={(e) => set(key, e.target.value as never)}
        required
      />
    </div>
  );

  const num = (key: keyof SettingsValues, label: string, hint?: string) => (
    <div>
      <label htmlFor={`s-${String(key)}`} className="field-label">
        {label} {hint ? <span className="font-normal text-navy-500">({hint})</span> : null}
      </label>
      <input
        id={`s-${String(key)}`}
        type="number"
        min={0}
        className="field-input"
        value={Number(values[key])}
        onChange={(e) => set(key, Number(e.target.value) as never)}
        required
      />
    </div>
  );

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      <section className="rounded-xl bg-white p-6 shadow-card">
        <h2 className="font-heading text-lg font-bold">Contact & identity</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {text("companyName", "Company name")}
          {text("phone", "Phone")}
          {text("email", "Email", "email")}
          {text("serviceArea", "Service area")}
          <div className="sm:col-span-2">{text("marinaAddress", "Marina address")}</div>
          {text("instagramUrl", "Instagram URL", "url")}
          {text("facebookUrl", "Facebook URL", "url")}
        </div>
      </section>

      <section className="rounded-xl bg-white p-6 shadow-card">
        <h2 className="font-heading text-lg font-bold">Pricing</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {num("taxRateBps", "Tax rate", "basis points — 700 = 7.00%")}
          {num("bookingFeeBps", "Booking fee", "basis points — 300 = 3.00%")}
        </div>
      </section>

      <section className="rounded-xl bg-white p-6 shadow-card">
        <h2 className="font-heading text-lg font-bold">Scheduling rules</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {num("minNoticeHours", "Minimum booking notice", "hours")}
          {num("maxAdvanceDays", "Maximum booking window", "days")}
          {num("turnaroundMinutes", "Turnaround between trips", "minutes")}
          {num("holdMinutes", "Unpaid booking hold", "minutes")}
        </div>
      </section>

      <section className="rounded-xl bg-white p-6 shadow-card">
        <h2 className="font-heading text-lg font-bold">Email reminders</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="s-reminders" className="field-label">
              Trip reminder days <span className="font-normal text-navy-500">(comma-separated, e.g. 7, 1)</span>
            </label>
            <input
              id="s-reminders"
              className="field-input"
              value={values.reminderDaysBefore.join(", ")}
              onChange={(e) =>
                set(
                  "reminderDaysBefore",
                  e.target.value
                    .split(",")
                    .map((s) => parseInt(s.trim(), 10))
                    .filter((n) => Number.isInteger(n) && n > 0),
                )
              }
            />
          </div>
          {num("balanceReminderDays", "Balance reminder", "days before trip")}
        </div>
      </section>

      <div aria-live="polite">
        {error ? (
          <p role="alert" className="mb-3 rounded-md bg-red-50 p-3 text-sm font-medium text-red-800">{error}</p>
        ) : null}
        {saved ? (
          <p className="mb-3 rounded-md bg-seafoam-50 p-3 text-sm font-medium text-seafoam-800">Settings saved.</p>
        ) : null}
        <button type="submit" className="btn-primary" disabled={busy}>
          {busy ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> : null}
          Save settings
        </button>
      </div>
    </form>
  );
}
