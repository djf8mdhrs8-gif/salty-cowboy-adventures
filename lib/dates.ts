import { format, parse } from "date-fns";

/** "2026-07-04" -> "Saturday, July 4, 2026" */
export function formatYmd(ymd: string, pattern = "EEEE, MMMM d, yyyy"): string {
  return format(parse(ymd, "yyyy-MM-dd", new Date()), pattern);
}

/** "13:30" -> "1:30 PM" */
export function formatTime(hhmm: string): string {
  return format(parse(hhmm, "HH:mm", new Date()), "h:mm a");
}

export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} hour${h === 1 ? "" : "s"}`;
  return `${h}h ${m}m`;
}
