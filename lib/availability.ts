/**
 * Pure availability engine. All inputs are plain data so this module is
 * unit-testable and shared by the public availability API, checkout
 * revalidation, and the admin calendar.
 *
 * The business runs a single boat, so any active booking blocks the slot for
 * every package.
 */

export interface RuleData {
  packageId: string | null;
  daysOfWeek: number[];
  startTimes: string[]; // "HH:mm"
  seasonStart: string | null; // "yyyy-MM-dd" inclusive
  seasonEnd: string | null;
  active: boolean;
}

export interface BlockedDateData {
  date: string;
  startTime: string | null;
  endTime: string | null;
}

export interface BookingSlotData {
  date: string;
  startTime: string;
  durationMinutes: number;
  status: string;
  holdExpiresAt: Date | null;
}

export interface ScheduleSettings {
  minNoticeHours: number;
  maxAdvanceDays: number;
  turnaroundMinutes: number;
}

export interface Slot {
  startTime: string;
  endTime: string;
  available: boolean;
  reason?: "booked" | "blocked" | "notice" | "window" | "past";
}

/** Statuses that keep a slot on the calendar. */
const BLOCKING_STATUSES = new Set([
  "PENDING",
  "AWAITING_PAYMENT",
  "CONFIRMED",
  "RESCHEDULED",
  "COMPLETED",
  "WEATHER_HOLD",
]);

export function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function dateToYmd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

/** Local Date at midnight for a "yyyy-MM-dd" string. */
export function ymdToDate(ymd: string): Date {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** Does an existing booking still block the calendar? */
export function bookingBlocks(b: BookingSlotData, now: Date): boolean {
  if (!BLOCKING_STATUSES.has(b.status)) return false;
  if (
    (b.status === "PENDING" || b.status === "AWAITING_PAYMENT") &&
    b.holdExpiresAt !== null &&
    b.holdExpiresAt.getTime() <= now.getTime()
  ) {
    return false; // hold expired — slot is released
  }
  return true;
}

function rangesOverlap(aStart: number, aEnd: number, bStart: number, bEnd: number): boolean {
  return aStart < bEnd && bStart < aEnd;
}

/** Pick the rules that apply to a package on a date (package-specific rules
 *  override global rules when any exist for that package). */
export function applicableRules(
  rules: RuleData[],
  packageId: string,
  date: string,
): RuleData[] {
  const inSeason = (r: RuleData) =>
    r.active &&
    (r.seasonStart === null || r.seasonStart <= date) &&
    (r.seasonEnd === null || date <= r.seasonEnd);
  const specific = rules.filter((r) => r.packageId === packageId && inSeason(r));
  if (specific.length > 0) return specific;
  return rules.filter((r) => r.packageId === null && inSeason(r));
}

export interface SlotQuery {
  date: string;
  packageId: string;
  durationMinutes: number;
  rules: RuleData[];
  blockedDates: BlockedDateData[];
  bookings: BookingSlotData[]; // bookings on `date` (all packages)
  settings: ScheduleSettings;
  now: Date;
}

/**
 * Compute every candidate slot for a date with availability flags.
 * A slot is unavailable when: date is fully/partially blocked, an active
 * booking (plus turnaround buffer) overlaps, it's inside the minimum-notice
 * window, or beyond the maximum advance window.
 */
export function getSlotsForDate(q: SlotQuery): Slot[] {
  const { date, settings, now } = q;
  const dayOfWeek = ymdToDate(date).getDay();

  const rules = applicableRules(q.rules, q.packageId, date);
  const startTimes = new Set<string>();
  for (const rule of rules) {
    if (!rule.daysOfWeek.includes(dayOfWeek)) continue;
    for (const t of rule.startTimes) startTimes.add(t);
  }

  const dayBlocks = q.blockedDates.filter((b) => b.date === date);
  const wholeDayBlocked = dayBlocks.some((b) => b.startTime === null && b.endTime === null);

  const activeBookings = q.bookings.filter(
    (b) => b.date === date && bookingBlocks(b, now),
  );

  const todayYmd = dateToYmd(now);
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const minNoticeMinutes = settings.minNoticeHours * 60;

  // How far out bookings are allowed.
  const maxDate = new Date(now);
  maxDate.setDate(maxDate.getDate() + settings.maxAdvanceDays);
  const maxYmd = dateToYmd(maxDate);

  const slots: Slot[] = [];
  for (const startTime of [...startTimes].sort()) {
    const start = timeToMinutes(startTime);
    const end = start + q.durationMinutes;
    const slot: Slot = {
      startTime,
      endTime: minutesToTime(end),
      available: true,
    };

    if (date < todayYmd || (date === todayYmd && start <= nowMinutes)) {
      slot.available = false;
      slot.reason = "past";
    } else if (date > maxYmd) {
      slot.available = false;
      slot.reason = "window";
    } else {
      // Minimum notice: minutes from `now` until slot start.
      const daysAhead =
        (ymdToDate(date).getTime() - ymdToDate(todayYmd).getTime()) / 86_400_000;
      const minutesUntilStart = daysAhead * 24 * 60 + (start - nowMinutes);
      if (minutesUntilStart < minNoticeMinutes) {
        slot.available = false;
        slot.reason = "notice";
      }
    }

    if (slot.available && wholeDayBlocked) {
      slot.available = false;
      slot.reason = "blocked";
    }

    if (slot.available) {
      for (const block of dayBlocks) {
        if (block.startTime === null || block.endTime === null) continue;
        if (rangesOverlap(start, end, timeToMinutes(block.startTime), timeToMinutes(block.endTime))) {
          slot.available = false;
          slot.reason = "blocked";
          break;
        }
      }
    }

    if (slot.available) {
      const buffer = settings.turnaroundMinutes;
      for (const b of activeBookings) {
        const bStart = timeToMinutes(b.startTime);
        const bEnd = bStart + b.durationMinutes;
        // Expand the existing booking by the turnaround buffer on both sides.
        if (rangesOverlap(start, end, bStart - buffer, bEnd + buffer)) {
          slot.available = false;
          slot.reason = "booked";
          break;
        }
      }
    }

    slots.push(slot);
  }
  return slots;
}

/** True when the exact slot can be booked (used for server-side revalidation). */
export function isSlotAvailable(q: SlotQuery, startTime: string): boolean {
  const slot = getSlotsForDate(q).find((s) => s.startTime === startTime);
  return slot?.available === true;
}
