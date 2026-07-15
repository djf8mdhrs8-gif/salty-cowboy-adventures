import { describe, it, expect } from "vitest";
import {
  getSlotsForDate,
  isSlotAvailable,
  bookingBlocks,
  applicableRules,
  type SlotQuery,
  type RuleData,
} from "@/lib/availability";

const PKG = "pkg_inshore";
const OTHER_PKG = "pkg_sunset";

const globalRule: RuleData = {
  packageId: null,
  daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
  startTimes: ["07:00", "13:00"],
  seasonStart: null,
  seasonEnd: null,
  active: true,
};

const settings = { minNoticeHours: 24, maxAdvanceDays: 180, turnaroundMinutes: 60 };

// "now" fixed at noon local time, well before the test date.
const NOW = new Date(2026, 6, 14, 12, 0); // 2026-07-14
const DATE = "2026-08-10";

function baseQuery(overrides: Partial<SlotQuery> = {}): SlotQuery {
  return {
    date: DATE,
    packageId: PKG,
    durationMinutes: 240,
    rules: [globalRule],
    blockedDates: [],
    bookings: [],
    settings,
    now: NOW,
    ...overrides,
  };
}

describe("getSlotsForDate", () => {
  it("generates slots from the applicable rule", () => {
    const slots = getSlotsForDate(baseQuery());
    expect(slots.map((s) => s.startTime)).toEqual(["07:00", "13:00"]);
    expect(slots.every((s) => s.available)).toBe(true);
    expect(slots[0].endTime).toBe("11:00");
  });

  it("blocks slots that overlap an active booking on any package", () => {
    const slots = getSlotsForDate(
      baseQuery({
        bookings: [
          {
            date: DATE,
            startTime: "07:00",
            durationMinutes: 240,
            status: "CONFIRMED",
            holdExpiresAt: null,
          },
        ],
      }),
    );
    expect(slots.find((s) => s.startTime === "07:00")).toMatchObject({
      available: false,
      reason: "booked",
    });
    // 07:00+240m ends 11:00; with 60m turnaround the 13:00 slot is clear.
    expect(slots.find((s) => s.startTime === "13:00")?.available).toBe(true);
  });

  it("applies the turnaround buffer to adjacent slots", () => {
    // Existing trip 09:00–13:00. With a 60-minute buffer, a 13:00 start conflicts.
    const slots = getSlotsForDate(
      baseQuery({
        bookings: [
          {
            date: DATE,
            startTime: "09:00",
            durationMinutes: 240,
            status: "CONFIRMED",
            holdExpiresAt: null,
          },
        ],
      }),
    );
    expect(slots.find((s) => s.startTime === "13:00")).toMatchObject({
      available: false,
      reason: "booked",
    });
  });

  it("releases slots held by expired unpaid bookings", () => {
    const expired = new Date(NOW.getTime() - 60_000);
    const slots = getSlotsForDate(
      baseQuery({
        bookings: [
          {
            date: DATE,
            startTime: "07:00",
            durationMinutes: 240,
            status: "AWAITING_PAYMENT",
            holdExpiresAt: expired,
          },
        ],
      }),
    );
    expect(slots.find((s) => s.startTime === "07:00")?.available).toBe(true);
  });

  it("keeps slots held by unexpired unpaid bookings", () => {
    const future = new Date(NOW.getTime() + 10 * 60_000);
    const slots = getSlotsForDate(
      baseQuery({
        bookings: [
          {
            date: DATE,
            startTime: "07:00",
            durationMinutes: 240,
            status: "AWAITING_PAYMENT",
            holdExpiresAt: future,
          },
        ],
      }),
    );
    expect(slots.find((s) => s.startTime === "07:00")?.available).toBe(false);
  });

  it("ignores cancelled bookings", () => {
    const slots = getSlotsForDate(
      baseQuery({
        bookings: [
          {
            date: DATE,
            startTime: "07:00",
            durationMinutes: 240,
            status: "CANCELLED",
            holdExpiresAt: null,
          },
        ],
      }),
    );
    expect(slots.every((s) => s.available)).toBe(true);
  });

  it("blocks the whole day for a full-day block", () => {
    const slots = getSlotsForDate(
      baseQuery({ blockedDates: [{ date: DATE, startTime: null, endTime: null }] }),
    );
    expect(slots.every((s) => !s.available && s.reason === "blocked")).toBe(true);
  });

  it("blocks only overlapping slots for a time-range block", () => {
    const slots = getSlotsForDate(
      baseQuery({ blockedDates: [{ date: DATE, startTime: "06:00", endTime: "08:00" }] }),
    );
    expect(slots.find((s) => s.startTime === "07:00")?.available).toBe(false);
    expect(slots.find((s) => s.startTime === "13:00")?.available).toBe(true);
  });

  it("enforces minimum booking notice", () => {
    // Trip tomorrow 07:00, now = today 12:00 → only 19h notice < 24h required.
    const slots = getSlotsForDate(baseQuery({ date: "2026-07-15" }));
    expect(slots.find((s) => s.startTime === "07:00")).toMatchObject({
      available: false,
      reason: "notice",
    });
    // 13:00 tomorrow is 25h out → allowed.
    expect(slots.find((s) => s.startTime === "13:00")?.available).toBe(true);
  });

  it("enforces the maximum advance-booking window", () => {
    const slots = getSlotsForDate(baseQuery({ date: "2027-06-01" }));
    expect(slots.every((s) => !s.available && s.reason === "window")).toBe(true);
  });

  it("marks past dates unavailable", () => {
    const slots = getSlotsForDate(baseQuery({ date: "2026-07-13" }));
    expect(slots.every((s) => !s.available && s.reason === "past")).toBe(true);
  });

  it("respects seasonal rules", () => {
    const summerOnly: RuleData = {
      ...globalRule,
      seasonStart: "2026-06-01",
      seasonEnd: "2026-08-31",
    };
    expect(getSlotsForDate(baseQuery({ rules: [summerOnly], date: "2026-08-10" }))).toHaveLength(2);
    expect(getSlotsForDate(baseQuery({ rules: [summerOnly], date: "2026-09-10" }))).toHaveLength(0);
  });

  it("prefers package-specific rules over global rules", () => {
    const sunsetRule: RuleData = {
      ...globalRule,
      packageId: OTHER_PKG,
      startTimes: ["18:00"],
    };
    const sunsetSlots = getSlotsForDate(
      baseQuery({ rules: [globalRule, sunsetRule], packageId: OTHER_PKG, durationMinutes: 120 }),
    );
    expect(sunsetSlots.map((s) => s.startTime)).toEqual(["18:00"]);
    // Other packages still use the global rule.
    const inshoreSlots = getSlotsForDate(baseQuery({ rules: [globalRule, sunsetRule] }));
    expect(inshoreSlots.map((s) => s.startTime)).toEqual(["07:00", "13:00"]);
  });

  it("skips days not in the rule's daysOfWeek", () => {
    const weekdaysOnly: RuleData = { ...globalRule, daysOfWeek: [1, 2, 3, 4, 5] };
    // 2026-08-09 is a Sunday.
    expect(getSlotsForDate(baseQuery({ rules: [weekdaysOnly], date: "2026-08-09" }))).toHaveLength(0);
  });
});

describe("isSlotAvailable (checkout revalidation)", () => {
  it("prevents double-booking the exact same slot", () => {
    const q = baseQuery({
      bookings: [
        {
          date: DATE,
          startTime: "07:00",
          durationMinutes: 240,
          status: "CONFIRMED",
          holdExpiresAt: null,
        },
      ],
    });
    expect(isSlotAvailable(q, "07:00")).toBe(false);
    expect(isSlotAvailable(q, "13:00")).toBe(true);
  });

  it("rejects times that were never offered by a rule", () => {
    expect(isSlotAvailable(baseQuery(), "09:13")).toBe(false);
  });
});

describe("bookingBlocks", () => {
  it("treats weather holds and completed trips as blocking", () => {
    expect(
      bookingBlocks(
        { date: DATE, startTime: "07:00", durationMinutes: 240, status: "WEATHER_HOLD", holdExpiresAt: null },
        NOW,
      ),
    ).toBe(true);
  });
  it("does not block for refunded bookings", () => {
    expect(
      bookingBlocks(
        { date: DATE, startTime: "07:00", durationMinutes: 240, status: "REFUNDED", holdExpiresAt: null },
        NOW,
      ),
    ).toBe(false);
  });
});

describe("applicableRules", () => {
  it("filters inactive rules", () => {
    expect(applicableRules([{ ...globalRule, active: false }], PKG, DATE)).toHaveLength(0);
  });
});
