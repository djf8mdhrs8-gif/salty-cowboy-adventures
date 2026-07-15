/** Format integer cents as USD, e.g. 60000 -> "$600.00" (or "$600" if round). */
export function formatCents(cents: number, opts?: { compact?: boolean }): string {
  const dollars = cents / 100;
  const isWhole = cents % 100 === 0;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: opts?.compact && isWhole ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(dollars);
}

/** Apply basis points (1 bps = 0.01%) to an amount of cents, rounding half up. */
export function applyBps(cents: number, bps: number): number {
  return Math.round((cents * bps) / 10_000);
}
