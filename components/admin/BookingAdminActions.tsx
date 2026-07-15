"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { SlotPicker, type SlotSelection } from "@/components/booking/SlotPicker";
import { formatCents } from "@/lib/money";

interface PaymentOption {
  id: string;
  label: string;
  amountCents: number;
  refundedCents: number;
  stripe: boolean;
}

const STATUSES = [
  "CONFIRMED",
  "RESCHEDULED",
  "WEATHER_HOLD",
  "COMPLETED",
  "CANCELLED",
  "REFUNDED",
  "NO_SHOW",
] as const;

/** Admin action sidebar for a single booking. */
export function BookingAdminActions({
  bookingId,
  status,
  packageSlug,
  internalNotes,
  balanceCents,
  payments,
}: {
  bookingId: string;
  status: string;
  packageSlug: string;
  internalNotes: string;
  balanceCents: number;
  payments: PaymentOption[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState(internalNotes);
  const [newStatus, setNewStatus] = useState(status);
  const [statusReason, setStatusReason] = useState("");
  const [slot, setSlot] = useState<SlotSelection | null>(null);
  const [showReschedule, setShowReschedule] = useState(false);
  const [manualAmount, setManualAmount] = useState("");
  const [manualMethod, setManualMethod] = useState<"CASH" | "CHECK" | "OTHER">("CASH");
  const [refundPaymentId, setRefundPaymentId] = useState(payments.find((p) => p.stripe)?.id ?? "");
  const [refundAmount, setRefundAmount] = useState("");
  const [refundReason, setRefundReason] = useState("");

  async function patch(tag: string, body: Record<string, unknown>) {
    setBusy(tag);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch(`/api/admin/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Action failed.");
      setNotice("Done.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed.");
    } finally {
      setBusy(null);
    }
  }

  async function issueRefund() {
    setBusy("refund");
    setError(null);
    setNotice(null);
    try {
      const cents = Math.round(parseFloat(refundAmount) * 100);
      if (!Number.isFinite(cents) || cents <= 0) throw new Error("Enter a valid refund amount.");
      const res = await fetch("/api/admin/refunds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId,
          paymentId: refundPaymentId,
          amountCents: cents,
          reason: refundReason || undefined,
        }),
      });
      const data = (await res.json()) as { error?: string; message?: string };
      if (!res.ok) throw new Error(data.error ?? "Refund failed.");
      setNotice(data.message ?? "Refund submitted.");
      setRefundAmount("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Refund failed.");
    } finally {
      setBusy(null);
    }
  }

  const spinner = (tag: string) =>
    busy === tag ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null;

  return (
    <div className="space-y-5 self-start">
      <div aria-live="polite">
        {notice ? (
          <p className="rounded-md bg-seafoam-50 p-3 text-sm font-medium text-seafoam-800">{notice}</p>
        ) : null}
        {error ? (
          <p role="alert" className="rounded-md bg-red-50 p-3 text-sm font-medium text-red-800">
            {error}
          </p>
        ) : null}
      </div>

      {/* Status */}
      <section className="rounded-xl bg-white p-5 shadow-card">
        <h2 className="font-heading text-lg font-bold">Change status</h2>
        <label htmlFor="new-status" className="field-label mt-3">Status</label>
        <select
          id="new-status"
          className="field-input"
          value={newStatus}
          onChange={(e) => setNewStatus(e.target.value)}
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
          ))}
        </select>
        <label htmlFor="status-reason" className="field-label mt-3">
          Reason <span className="font-normal text-navy-500">(sent to customer on cancel; include &ldquo;weather&rdquo; for a weather cancellation)</span>
        </label>
        <input
          id="status-reason"
          className="field-input"
          value={statusReason}
          onChange={(e) => setStatusReason(e.target.value)}
        />
        <button
          type="button"
          className="btn-primary mt-4 w-full !min-h-10 !py-2 text-sm"
          disabled={busy !== null || newStatus === status}
          onClick={() => patch("status", { action: "status", status: newStatus, reason: statusReason || undefined })}
        >
          {spinner("status")} Update status
        </button>
      </section>

      {/* Reschedule */}
      <section className="rounded-xl bg-white p-5 shadow-card">
        <h2 className="font-heading text-lg font-bold">Reschedule</h2>
        <button
          type="button"
          className="btn-secondary mt-3 w-full !min-h-10 !py-2 text-sm"
          onClick={() => setShowReschedule((v) => !v)}
          aria-expanded={showReschedule}
        >
          {showReschedule ? "Hide calendar" : "Pick a new slot"}
        </button>
        {showReschedule ? (
          <div className="mt-4">
            <SlotPicker packageSlug={packageSlug} value={slot} onSelect={setSlot} />
            <button
              type="button"
              className="btn-primary mt-4 w-full !min-h-10 !py-2 text-sm"
              disabled={!slot || busy !== null}
              onClick={() =>
                slot && patch("reschedule", { action: "reschedule", date: slot.date, startTime: slot.startTime })
              }
            >
              {spinner("reschedule")} Reschedule booking
            </button>
          </div>
        ) : null}
      </section>

      {/* Manual payment */}
      <section className="rounded-xl bg-white p-5 shadow-card">
        <h2 className="font-heading text-lg font-bold">Record manual payment</h2>
        <p className="mt-1 text-xs text-navy-500">Balance due: {formatCents(balanceCents)}</p>
        <div className="mt-3 flex gap-2">
          <div className="flex-1">
            <label htmlFor="manual-amount" className="sr-only">Amount (dollars)</label>
            <input
              id="manual-amount"
              className="field-input"
              inputMode="decimal"
              placeholder="Amount ($)"
              value={manualAmount}
              onChange={(e) => setManualAmount(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="manual-method" className="sr-only">Method</label>
            <select
              id="manual-method"
              className="field-input"
              value={manualMethod}
              onChange={(e) => setManualMethod(e.target.value as typeof manualMethod)}
            >
              <option value="CASH">Cash</option>
              <option value="CHECK">Check</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
        </div>
        <button
          type="button"
          className="btn-primary mt-3 w-full !min-h-10 !py-2 text-sm"
          disabled={busy !== null}
          onClick={() => {
            const cents = Math.round(parseFloat(manualAmount) * 100);
            if (!Number.isFinite(cents) || cents <= 0) {
              setError("Enter a valid payment amount.");
              return;
            }
            void patch("manual", { action: "manual-payment", amountCents: cents, method: manualMethod });
            setManualAmount("");
          }}
        >
          {spinner("manual")} Record payment
        </button>
      </section>

      {/* Emails */}
      <section className="rounded-xl bg-white p-5 shadow-card">
        <h2 className="font-heading text-lg font-bold">Send email</h2>
        <div className="mt-3 space-y-2">
          <button
            type="button"
            className="btn-secondary w-full !min-h-10 !py-2 text-sm"
            disabled={busy !== null || balanceCents <= 0}
            onClick={() => patch("balrem", { action: "send-balance-reminder" })}
          >
            {spinner("balrem")} Balance reminder
          </button>
          <button
            type="button"
            className="btn-secondary w-full !min-h-10 !py-2 text-sm"
            disabled={busy !== null}
            onClick={() => patch("weather", { action: "send-weather-delay" })}
          >
            {spinner("weather")} Weather delay notice
          </button>
        </div>
      </section>

      {/* Refunds */}
      <section className="rounded-xl bg-white p-5 shadow-card">
        <h2 className="font-heading text-lg font-bold">Issue refund</h2>
        {payments.filter((p) => p.stripe).length === 0 ? (
          <p className="mt-2 text-sm text-navy-500">No refundable card payments.</p>
        ) : (
          <>
            <label htmlFor="refund-payment" className="field-label mt-3">Payment</label>
            <select
              id="refund-payment"
              className="field-input"
              value={refundPaymentId}
              onChange={(e) => setRefundPaymentId(e.target.value)}
            >
              {payments
                .filter((p) => p.stripe)
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                    {p.refundedCents > 0 ? ` (refunded ${formatCents(p.refundedCents)})` : ""}
                  </option>
                ))}
            </select>
            <label htmlFor="refund-amount" className="field-label mt-3">Amount ($)</label>
            <input
              id="refund-amount"
              className="field-input"
              inputMode="decimal"
              value={refundAmount}
              onChange={(e) => setRefundAmount(e.target.value)}
            />
            <label htmlFor="refund-reason" className="field-label mt-3">Reason (optional)</label>
            <input
              id="refund-reason"
              className="field-input"
              value={refundReason}
              onChange={(e) => setRefundReason(e.target.value)}
            />
            <button
              type="button"
              className="btn mt-4 w-full !min-h-10 bg-red-700 !py-2 text-sm text-white hover:bg-red-800"
              disabled={busy !== null}
              onClick={issueRefund}
            >
              {spinner("refund")} Issue refund
            </button>
          </>
        )}
      </section>

      {/* Internal notes */}
      <section className="rounded-xl bg-white p-5 shadow-card">
        <h2 className="font-heading text-lg font-bold">Internal notes</h2>
        <label htmlFor="internal-notes" className="sr-only">Internal notes</label>
        <textarea
          id="internal-notes"
          rows={4}
          className="field-input mt-3"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
        <button
          type="button"
          className="btn-primary mt-3 w-full !min-h-10 !py-2 text-sm"
          disabled={busy !== null}
          onClick={() => patch("notes", { action: "notes", internalNotes: notes })}
        >
          {spinner("notes")} Save notes
        </button>
      </section>
    </div>
  );
}
