"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import { formatTime, formatYmd } from "@/lib/dates";

interface RuleRow {
  id: string;
  packageId: string | null;
  packageName: string | null;
  daysOfWeek: number[];
  startTimes: string[];
  seasonStart: string | null;
  seasonEnd: string | null;
  label: string | null;
  active: boolean;
}

interface BlockRow {
  id: string;
  date: string;
  startTime: string | null;
  endTime: string | null;
  reason: string | null;
}

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** Manage weekly schedules (rules), seasonal windows, and blocked dates. */
export function AvailabilityManager({
  rules,
  blockedDates,
  packages,
}: {
  rules: RuleRow[];
  blockedDates: BlockRow[];
  packages: Array<{ id: string; name: string }>;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newDays, setNewDays] = useState<number[]>([1, 2, 3, 4, 5, 6, 0]);

  async function send(url: string, method: string, body?: Record<string, unknown>) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = (await res.json()) as { error?: string; issues?: Record<string, string[]> };
      if (!res.ok) {
        const firstIssue = data.issues ? Object.values(data.issues).flat()[0] : undefined;
        throw new Error(firstIssue ?? data.error ?? "Save failed.");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-8 xl:grid-cols-2">
      {error ? (
        <p role="alert" className="rounded-md bg-red-50 p-3 text-sm font-medium text-red-800 xl:col-span-2">
          {error}
        </p>
      ) : null}

      {/* ── Schedules ─────────────────────────────────────────────── */}
      <section>
        <h2 className="font-heading text-lg font-bold">Departure schedules</h2>
        <ul className="mt-3 space-y-2">
          {rules.map((r) => (
            <li key={r.id} className="rounded-xl bg-white p-4 shadow-card">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-bold">
                  {r.label ?? "Schedule"}{" "}
                  <span className="text-sm font-normal text-navy-500">
                    · {r.packageName ?? "All trips"}
                  </span>
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${
                      r.active ? "bg-seafoam-100 text-seafoam-800" : "bg-cream-200 text-navy-500"
                    }`}
                    disabled={busy}
                    onClick={() =>
                      send(`/api/admin/availability/rules/${r.id}`, "PATCH", { active: !r.active })
                    }
                  >
                    {r.active ? "Active" : "Inactive"}
                  </button>
                  <button
                    type="button"
                    className="rounded-full p-1.5 text-red-700 hover:bg-red-50"
                    aria-label={`Delete schedule ${r.label ?? ""}`}
                    disabled={busy}
                    onClick={() => send(`/api/admin/availability/rules/${r.id}`, "DELETE")}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden />
                  </button>
                </div>
              </div>
              <p className="mt-1 text-sm text-navy-600">
                {r.daysOfWeek.map((d) => DAY_LABELS[d]).join(", ")} ·{" "}
                {r.startTimes.map(formatTime).join(", ")}
                {r.seasonStart
                  ? ` · ${formatYmd(r.seasonStart, "MMM d")}–${r.seasonEnd ? formatYmd(r.seasonEnd, "MMM d, yyyy") : "…"}`
                  : " · year-round"}
              </p>
            </li>
          ))}
        </ul>

        <form
          className="mt-4 rounded-xl bg-white p-5 shadow-card"
          onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            const startTimes = String(f.get("startTimes") ?? "")
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean);
            void send("/api/admin/availability/rules", "POST", {
              packageId: String(f.get("packageId")) || null,
              daysOfWeek: newDays,
              startTimes,
              seasonStart: String(f.get("seasonStart")) || null,
              seasonEnd: String(f.get("seasonEnd")) || null,
              label: String(f.get("label")) || null,
              active: true,
            });
          }}
        >
          <h3 className="font-heading font-bold">New schedule</h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="r-label" className="field-label">Label</label>
              <input id="r-label" name="label" className="field-input" placeholder="Summer schedule" />
            </div>
            <div>
              <label htmlFor="r-package" className="field-label">Applies to</label>
              <select id="r-package" name="packageId" className="field-input">
                <option value="">All trips</option>
                {packages.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <fieldset className="sm:col-span-2">
              <legend className="field-label">Days of week</legend>
              <div className="flex flex-wrap gap-1.5">
                {DAY_LABELS.map((label, day) => (
                  <button
                    key={day}
                    type="button"
                    aria-pressed={newDays.includes(day)}
                    onClick={() =>
                      setNewDays((d) =>
                        d.includes(day) ? d.filter((x) => x !== day) : [...d, day],
                      )
                    }
                    className={`min-h-10 rounded-md px-3 text-sm font-semibold ring-1 ${
                      newDays.includes(day)
                        ? "bg-navy-800 text-white ring-navy-800"
                        : "bg-white text-navy-700 ring-tan-200"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </fieldset>
            <div className="sm:col-span-2">
              <label htmlFor="r-times" className="field-label">
                Start times (comma-separated, 24h — e.g. 07:00, 13:00)
              </label>
              <input id="r-times" name="startTimes" className="field-input" required placeholder="07:00, 13:00" />
            </div>
            <div>
              <label htmlFor="r-season-start" className="field-label">Season start (optional)</label>
              <input id="r-season-start" name="seasonStart" type="date" className="field-input" />
            </div>
            <div>
              <label htmlFor="r-season-end" className="field-label">Season end (optional)</label>
              <input id="r-season-end" name="seasonEnd" type="date" className="field-input" />
            </div>
          </div>
          <button type="submit" className="btn-primary mt-4 !min-h-10 !px-4 !py-2 text-sm" disabled={busy || newDays.length === 0}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
            Add schedule
          </button>
        </form>
      </section>

      {/* ── Blocked dates ─────────────────────────────────────────── */}
      <section>
        <h2 className="font-heading text-lg font-bold">Blocked dates &amp; times</h2>
        <ul className="mt-3 space-y-2">
          {blockedDates.map((b) => (
            <li
              key={b.id}
              className="flex items-center justify-between gap-3 rounded-xl bg-white p-4 shadow-card"
            >
              <p className="text-sm">
                <span className="font-bold">{formatYmd(b.date, "EEE, MMM d, yyyy")}</span>{" "}
                {b.startTime ? `· ${formatTime(b.startTime)}–${formatTime(b.endTime!)}` : "· all day"}
                {b.reason ? <span className="block text-navy-500">{b.reason}</span> : null}
              </p>
              <button
                type="button"
                className="rounded-full p-1.5 text-red-700 hover:bg-red-50"
                aria-label={`Unblock ${b.date}`}
                disabled={busy}
                onClick={() => send(`/api/admin/blocked-dates/${b.id}`, "DELETE")}
              >
                <Trash2 className="h-4 w-4" aria-hidden />
              </button>
            </li>
          ))}
          {blockedDates.length === 0 ? (
            <li className="text-sm text-navy-500">No upcoming blocked dates.</li>
          ) : null}
        </ul>

        <form
          className="mt-4 rounded-xl bg-white p-5 shadow-card"
          onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            const startTime = String(f.get("startTime")) || null;
            const endTime = String(f.get("endTime")) || null;
            void send("/api/admin/blocked-dates", "POST", {
              date: String(f.get("date")),
              startTime,
              endTime,
              reason: String(f.get("reason")) || null,
            });
            (e.target as HTMLFormElement).reset();
          }}
        >
          <h3 className="font-heading font-bold">Block a date</h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="b-date" className="field-label">Date</label>
              <input id="b-date" name="date" type="date" className="field-input" required />
            </div>
            <div>
              <label htmlFor="b-reason" className="field-label">Reason (optional)</label>
              <input id="b-reason" name="reason" className="field-input" placeholder="Maintenance day" />
            </div>
            <div>
              <label htmlFor="b-start" className="field-label">
                Start time <span className="font-normal text-navy-500">(blank = whole day)</span>
              </label>
              <input id="b-start" name="startTime" type="time" className="field-input" />
            </div>
            <div>
              <label htmlFor="b-end" className="field-label">End time</label>
              <input id="b-end" name="endTime" type="time" className="field-input" />
            </div>
          </div>
          <button type="submit" className="btn-primary mt-4 !min-h-10 !px-4 !py-2 text-sm" disabled={busy}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
            Block date
          </button>
        </form>
      </section>
    </div>
  );
}
