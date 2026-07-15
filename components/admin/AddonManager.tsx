"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { formatCents } from "@/lib/money";

interface AddonRow {
  id: string;
  slug: string;
  name: string;
  description: string;
  priceCents: number;
  pricing: "FLAT" | "PER_GUEST";
  maxQuantity: number;
  global: boolean;
  active: boolean;
  sortOrder: number;
}

/** List, toggle, create, and edit add-ons. */
export function AddonManager({ addons }: { addons: AddonRow[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);

  async function send(url: string, method: string, body: Record<string, unknown>) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Save failed.");
      router.refresh();
      setShowNew(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      {error ? (
        <p role="alert" className="mb-3 rounded-md bg-red-50 p-3 text-sm font-medium text-red-800">
          {error}
        </p>
      ) : null}
      <ul className="space-y-2">
        {addons.map((a) => (
          <li
            key={a.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white p-4 shadow-card"
          >
            <div>
              <p className="font-bold">
                {a.name}{" "}
                <span className="text-sm font-normal text-navy-500">
                  · {formatCents(a.priceCents)}
                  {a.pricing === "PER_GUEST" ? "/guest" : ""} · max {a.maxQuantity}
                  {a.global ? " · all trips" : " · specific trips"}
                </span>
              </p>
              <p className="text-sm text-navy-600">{a.description}</p>
            </div>
            <button
              type="button"
              className={`rounded-full px-3 py-1.5 text-xs font-bold uppercase ${
                a.active ? "bg-seafoam-100 text-seafoam-800" : "bg-cream-200 text-navy-500"
              }`}
              disabled={busy}
              onClick={() => send(`/api/admin/addons/${a.id}`, "PATCH", { active: !a.active })}
            >
              {a.active ? "Active — click to disable" : "Disabled — click to enable"}
            </button>
          </li>
        ))}
      </ul>

      <button
        type="button"
        className="btn-secondary mt-4 !min-h-10 !px-4 !py-2 text-sm"
        onClick={() => setShowNew((v) => !v)}
        aria-expanded={showNew}
      >
        {showNew ? "Cancel" : "New add-on"}
      </button>

      {showNew ? (
        <form
          className="mt-4 grid gap-4 rounded-xl bg-white p-5 shadow-card sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            void send("/api/admin/addons", "POST", {
              slug: String(f.get("slug")),
              name: String(f.get("name")),
              description: String(f.get("description")),
              priceCents: Math.round(parseFloat(String(f.get("price"))) * 100),
              pricing: String(f.get("pricing")),
              maxQuantity: Number(f.get("maxQuantity")),
              global: f.get("global") === "on",
              active: true,
              sortOrder: addons.length + 1,
            });
          }}
        >
          <div>
            <label htmlFor="a-name" className="field-label">Name</label>
            <input id="a-name" name="name" className="field-input" required />
          </div>
          <div>
            <label htmlFor="a-slug" className="field-label">Slug</label>
            <input id="a-slug" name="slug" className="field-input" pattern="[a-z0-9-]+" required />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="a-desc" className="field-label">Description</label>
            <input id="a-desc" name="description" className="field-input" required />
          </div>
          <div>
            <label htmlFor="a-price" className="field-label">Price ($)</label>
            <input id="a-price" name="price" inputMode="decimal" className="field-input" required />
          </div>
          <div>
            <label htmlFor="a-pricing" className="field-label">Pricing</label>
            <select id="a-pricing" name="pricing" className="field-input">
              <option value="FLAT">Flat</option>
              <option value="PER_GUEST">Per guest</option>
            </select>
          </div>
          <div>
            <label htmlFor="a-max" className="field-label">Max quantity</label>
            <input id="a-max" name="maxQuantity" type="number" min={1} max={20} defaultValue={1} className="field-input" />
          </div>
          <div className="flex items-end pb-2">
            <label className="flex items-center gap-2 text-sm font-semibold">
              <input type="checkbox" name="global" defaultChecked className="h-5 w-5" />
              Available on all trips
            </label>
          </div>
          <div className="sm:col-span-2">
            <button type="submit" className="btn-primary !min-h-10 !px-4 !py-2 text-sm" disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
              Create add-on
            </button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
