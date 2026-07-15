"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { analytics } from "@/lib/analytics";

export function ContactForm() {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const f = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: String(f.get("name") ?? ""),
          email: String(f.get("email") ?? ""),
          phone: String(f.get("phone") ?? ""),
          message: String(f.get("message") ?? ""),
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed to send. Please try again.");
      analytics.contactSubmit();
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <p role="status" className="rounded-xl bg-seafoam-50 p-6 font-medium text-seafoam-800">
        Message received — we&apos;ll get back to you within one business day. 🤠
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="rounded-xl border border-tan-200 bg-white p-6 shadow-card">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="c-name" className="field-label">Name</label>
          <input id="c-name" name="name" className="field-input" required autoComplete="name" />
        </div>
        <div>
          <label htmlFor="c-email" className="field-label">Email</label>
          <input id="c-email" name="email" type="email" className="field-input" required autoComplete="email" />
        </div>
      </div>
      <div className="mt-4">
        <label htmlFor="c-phone" className="field-label">
          Phone <span className="font-normal text-navy-500">(optional)</span>
        </label>
        <input id="c-phone" name="phone" type="tel" className="field-input" autoComplete="tel" />
      </div>
      <div className="mt-4">
        <label htmlFor="c-message" className="field-label">Message</label>
        <textarea id="c-message" name="message" rows={4} className="field-input" required />
      </div>
      {error ? (
        <p role="alert" className="mt-4 rounded-md bg-red-50 p-3 text-sm font-medium text-red-800">
          {error}
        </p>
      ) : null}
      <button type="submit" className="btn-primary mt-5 w-full" disabled={busy}>
        {busy ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> : null}
        Send message
      </button>
    </form>
  );
}
