"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

/** Read-only value with a copy button (used for the calendar feed URL). */
export function CopyField({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable — the input below is selectable as a fallback.
    }
  }

  return (
    <div>
      <label className="field-label">{label}</label>
      <div className="flex gap-2">
        <input
          readOnly
          value={value}
          onFocus={(e) => e.currentTarget.select()}
          className="field-input flex-1 !bg-cream-50 font-mono text-xs"
          aria-label={label}
        />
        <button
          type="button"
          onClick={copy}
          className="btn-secondary !min-h-11 shrink-0 !px-4 !py-2 text-sm"
        >
          {copied ? (
            <>
              <Check className="h-4 w-4" aria-hidden /> Copied
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" aria-hidden /> Copy
            </>
          )}
        </button>
      </div>
    </div>
  );
}
