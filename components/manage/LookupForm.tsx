"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

export function LookupForm() {
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setMessage(null);
    const form = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/manage/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          confirmationNumber: String(form.get("confirmationNumber") ?? ""),
          email: String(form.get("email") ?? ""),
        }),
      });
      const data = (await res.json()) as { message?: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Something went wrong.");
      setMessage(data.message ?? "Check your email for a secure link.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="rounded-xl border border-tan-200 bg-white p-6 shadow-card">
      <div className="space-y-5">
        <div>
          <label htmlFor="confirmationNumber" className="field-label">
            Confirmation number
          </label>
          <input
            id="confirmationNumber"
            name="confirmationNumber"
            className="field-input uppercase"
            placeholder="SCA-XXXXXXXX"
            required
            autoComplete="off"
          />
        </div>
        <div>
          <label htmlFor="email" className="field-label">
            Email used for booking
          </label>
          <input
            id="email"
            name="email"
            type="email"
            className="field-input"
            required
            autoComplete="email"
          />
        </div>
      </div>

      {message ? (
        <p role="status" className="mt-4 rounded-md bg-seafoam-50 p-3 text-sm font-medium text-seafoam-800">
          {message}
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="mt-4 rounded-md bg-red-50 p-3 text-sm font-medium text-red-800">
          {error}
        </p>
      ) : null}

      <button type="submit" className="btn-primary mt-6 w-full" disabled={submitting}>
        {submitting ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> : null}
        Email me a secure link
      </button>
    </form>
  );
}
