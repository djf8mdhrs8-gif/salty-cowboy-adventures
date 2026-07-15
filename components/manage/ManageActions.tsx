"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CreditCard, CalendarClock, XCircle, UserCog } from "lucide-react";
import { SlotPicker, type SlotSelection } from "@/components/booking/SlotPicker";
import { formatCents } from "@/lib/money";
import { formatYmd, formatTime } from "@/lib/dates";

type Panel = "none" | "reschedule" | "cancel" | "details";

interface Details {
  phone: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  specialRequests: string;
  accessibilityNeeds: string;
}

/** Customer self-service actions: pay balance, reschedule, cancel, update details. */
export function ManageActions({
  token,
  packageSlug,
  balanceCents,
  modifiable,
  details,
}: {
  token: string;
  packageSlug: string;
  balanceCents: number;
  modifiable: boolean;
  details: Details;
}) {
  const router = useRouter();
  const [panel, setPanel] = useState<Panel>("none");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [slot, setSlot] = useState<SlotSelection | null>(null);
  const [cancelReason, setCancelReason] = useState("");

  async function call(body: Record<string, unknown>): Promise<void> {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch(`/api/manage/${encodeURIComponent(token)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as { url?: string; message?: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Something went wrong.");
      if (data.url) {
        window.location.assign(data.url);
        return;
      }
      setNotice(data.message ?? "Done.");
      setPanel("none");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  if (!modifiable && balanceCents <= 0) {
    return notice ? <StatusNote notice={notice} error={null} /> : null;
  }

  return (
    <section aria-label="Booking actions">
      <h2 className="text-xl font-bold">Manage this booking</h2>
      <StatusNote notice={notice} error={error} />

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {balanceCents > 0 && modifiable ? (
          <button
            type="button"
            className="btn-accent"
            disabled={busy}
            onClick={() => call({ action: "pay-balance" })}
          >
            <CreditCard className="h-5 w-5" aria-hidden />
            Pay balance ({formatCents(balanceCents)})
          </button>
        ) : null}
        {modifiable ? (
          <>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setPanel(panel === "reschedule" ? "none" : "reschedule")}
              aria-expanded={panel === "reschedule"}
            >
              <CalendarClock className="h-5 w-5" aria-hidden /> Reschedule
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setPanel(panel === "details" ? "none" : "details")}
              aria-expanded={panel === "details"}
            >
              <UserCog className="h-5 w-5" aria-hidden /> Update details
            </button>
            <button
              type="button"
              className="btn border-2 border-red-700 text-red-700 hover:bg-red-700 hover:text-white"
              onClick={() => setPanel(panel === "cancel" ? "none" : "cancel")}
              aria-expanded={panel === "cancel"}
            >
              <XCircle className="h-5 w-5" aria-hidden /> Cancel booking
            </button>
          </>
        ) : null}
      </div>

      {panel === "reschedule" ? (
        <div className="mt-6 rounded-xl border border-tan-200 bg-white p-5">
          <h3 className="font-heading text-lg font-bold">Pick a new date &amp; time</h3>
          <div className="mt-4">
            <SlotPicker packageSlug={packageSlug} value={slot} onSelect={setSlot} />
          </div>
          <button
            type="button"
            className="btn-primary mt-5 w-full"
            disabled={!slot || busy}
            onClick={() => slot && call({ action: "reschedule", date: slot.date, startTime: slot.startTime })}
          >
            {busy ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> : null}
            {slot
              ? `Reschedule to ${formatYmd(slot.date, "MMM d")} at ${formatTime(slot.startTime)}`
              : "Select a new slot"}
          </button>
        </div>
      ) : null}

      {panel === "cancel" ? (
        <div className="mt-6 rounded-xl border border-red-200 bg-white p-5">
          <h3 className="font-heading text-lg font-bold">Cancel this booking</h3>
          <p className="mt-2 text-sm leading-relaxed text-navy-600">
            Refunds follow our cancellation policy: full refund 7+ days before departure, 50%
            refund 3–6 days before, non-refundable within 72 hours. This can&apos;t be undone.
          </p>
          <label htmlFor="cancel-reason" className="field-label mt-4">
            Reason <span className="font-normal text-navy-500">(optional)</span>
          </label>
          <textarea
            id="cancel-reason"
            rows={2}
            className="field-input"
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
          />
          <button
            type="button"
            className="btn mt-4 w-full bg-red-700 text-white hover:bg-red-800"
            disabled={busy}
            onClick={() => call({ action: "cancel", reason: cancelReason })}
          >
            {busy ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> : null}
            Yes, cancel my booking
          </button>
        </div>
      ) : null}

      {panel === "details" ? (
        <form
          className="mt-6 rounded-xl border border-tan-200 bg-white p-5"
          onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            void call({
              action: "update-details",
              phone: String(f.get("phone") ?? ""),
              emergencyContactName: String(f.get("emergencyContactName") ?? ""),
              emergencyContactPhone: String(f.get("emergencyContactPhone") ?? ""),
              specialRequests: String(f.get("specialRequests") ?? ""),
              accessibilityNeeds: String(f.get("accessibilityNeeds") ?? ""),
            });
          }}
        >
          <h3 className="font-heading text-lg font-bold">Update your details</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="m-phone" className="field-label">Phone</label>
              <input id="m-phone" name="phone" type="tel" className="field-input" defaultValue={details.phone} required />
            </div>
            <div>
              <label htmlFor="m-ecn" className="field-label">Emergency contact name</label>
              <input id="m-ecn" name="emergencyContactName" className="field-input" defaultValue={details.emergencyContactName} required />
            </div>
            <div>
              <label htmlFor="m-ecp" className="field-label">Emergency contact phone</label>
              <input id="m-ecp" name="emergencyContactPhone" type="tel" className="field-input" defaultValue={details.emergencyContactPhone} required />
            </div>
          </div>
          <div className="mt-4">
            <label htmlFor="m-sr" className="field-label">Special requests</label>
            <textarea id="m-sr" name="specialRequests" rows={2} className="field-input" defaultValue={details.specialRequests} />
          </div>
          <div className="mt-4">
            <label htmlFor="m-an" className="field-label">Accessibility needs</label>
            <textarea id="m-an" name="accessibilityNeeds" rows={2} className="field-input" defaultValue={details.accessibilityNeeds} />
          </div>
          <button type="submit" className="btn-primary mt-5 w-full" disabled={busy}>
            {busy ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> : null}
            Save changes
          </button>
        </form>
      ) : null}
    </section>
  );
}

function StatusNote({ notice, error }: { notice: string | null; error: string | null }) {
  return (
    <div aria-live="polite">
      {notice ? (
        <p className="mt-3 rounded-md bg-seafoam-50 p-3 text-sm font-medium text-seafoam-800">
          {notice}
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="mt-3 rounded-md bg-red-50 p-3 text-sm font-medium text-red-800">
          {error}
        </p>
      ) : null}
    </div>
  );
}
