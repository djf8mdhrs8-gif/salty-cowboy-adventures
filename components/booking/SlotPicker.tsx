"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { formatTime, formatYmd } from "@/lib/dates";

interface SlotDto {
  startTime: string;
  endTime: string;
  available: boolean;
}

interface DayDto {
  date: string;
  hasAvailability: boolean;
  slots: SlotDto[];
}

export interface SlotSelection {
  date: string;
  startTime: string;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/**
 * Accessible month calendar + time-slot picker backed by /api/availability.
 * Unavailable days/slots are rendered disabled; keyboard and screen-reader
 * friendly (buttons with explicit labels, live status region).
 */
export function SlotPicker({
  packageSlug,
  value,
  onSelect,
}: {
  packageSlug: string;
  value: SlotSelection | null;
  onSelect: (selection: SlotSelection) => void;
}) {
  const [viewMonth, setViewMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [days, setDays] = useState<DayDto[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(value?.date ?? null);

  const load = useCallback(async (month: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/availability?package=${encodeURIComponent(packageSlug)}&month=${month}`,
      );
      if (!res.ok) throw new Error("Failed to load availability");
      const data = (await res.json()) as { days: DayDto[] };
      setDays(data.days);
    } catch {
      setError("Couldn't load availability. Please try again.");
      setDays(null);
    } finally {
      setLoading(false);
    }
  }, [packageSlug]);

  useEffect(() => {
    void load(monthKey(viewMonth));
  }, [viewMonth, load]);

  const firstWeekday = viewMonth.getDay();
  const monthLabel = viewMonth.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const selectedDay = useMemo(
    () => days?.find((d) => d.date === selectedDate) ?? null,
    [days, selectedDate],
  );

  const now = new Date();
  const isCurrentMonth =
    viewMonth.getFullYear() === now.getFullYear() && viewMonth.getMonth() === now.getMonth();

  return (
    <div>
      <div className="flex items-center justify-between">
        <h3 className="font-heading text-lg font-bold" id="calendar-label">
          {monthLabel}
        </h3>
        <div className="flex gap-1">
          <button
            type="button"
            className="flex h-11 w-11 items-center justify-center rounded-md border border-tan-200 text-navy-700 hover:bg-cream-100 disabled:opacity-40"
            onClick={() =>
              setViewMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))
            }
            disabled={isCurrentMonth || loading}
            aria-label="Previous month"
          >
            <ChevronLeft className="h-5 w-5" aria-hidden />
          </button>
          <button
            type="button"
            className="flex h-11 w-11 items-center justify-center rounded-md border border-tan-200 text-navy-700 hover:bg-cream-100 disabled:opacity-40"
            onClick={() =>
              setViewMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))
            }
            disabled={loading}
            aria-label="Next month"
          >
            <ChevronRight className="h-5 w-5" aria-hidden />
          </button>
        </div>
      </div>

      <div role="status" aria-live="polite" className="sr-only">
        {loading ? "Loading availability…" : `Showing availability for ${monthLabel}`}
      </div>

      {error ? (
        <p className="mt-4 rounded-md bg-red-50 p-3 text-sm font-medium text-red-800">
          {error}{" "}
          <button
            type="button"
            className="underline"
            onClick={() => load(monthKey(viewMonth))}
          >
            Retry
          </button>
        </p>
      ) : null}

      <div className="mt-4 grid grid-cols-7 gap-1 text-center" aria-labelledby="calendar-label">
        {WEEKDAYS.map((d) => (
          <div key={d} className="py-1 text-xs font-bold uppercase text-navy-500" aria-hidden>
            {d}
          </div>
        ))}
        {Array.from({ length: firstWeekday }).map((_, i) => (
          <div key={`pad-${i}`} aria-hidden />
        ))}
        {loading && !days
          ? Array.from({ length: 35 - firstWeekday }).map((_, i) => (
              <div key={`skeleton-${i}`} className="h-11 animate-pulse rounded-md bg-cream-200" />
            ))
          : days?.map((day) => {
              const dayNum = Number(day.date.slice(-2));
              const isSelected = day.date === selectedDate;
              return (
                <button
                  key={day.date}
                  type="button"
                  disabled={!day.hasAvailability}
                  onClick={() => setSelectedDate(day.date)}
                  aria-pressed={isSelected}
                  aria-label={`${formatYmd(day.date)}${day.hasAvailability ? "" : " — unavailable"}`}
                  className={`h-11 rounded-md text-sm font-semibold transition-colors ${
                    isSelected
                      ? "bg-navy-800 text-cream-50"
                      : day.hasAvailability
                        ? "bg-white text-navy-800 shadow-sm ring-1 ring-tan-200 hover:bg-coastal-50"
                        : "cursor-not-allowed text-navy-300 line-through"
                  }`}
                >
                  {dayNum}
                </button>
              );
            })}
      </div>

      {selectedDay ? (
        <fieldset className="mt-6">
          <legend className="mb-3 font-heading text-base font-bold">
            Departure times for {formatYmd(selectedDay.date, "EEE, MMM d")}
          </legend>
          {selectedDay.slots.length === 0 ? (
            <p className="text-sm text-navy-600">No departures scheduled this day.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {selectedDay.slots.map((slot) => {
                const isSelected =
                  value?.date === selectedDay.date && value?.startTime === slot.startTime;
                return (
                  <button
                    key={slot.startTime}
                    type="button"
                    disabled={!slot.available}
                    onClick={() =>
                      onSelect({ date: selectedDay.date, startTime: slot.startTime })
                    }
                    aria-pressed={isSelected}
                    className={`min-h-11 rounded-md px-4 py-2 text-sm font-semibold ring-1 transition-colors ${
                      isSelected
                        ? "bg-navy-800 text-cream-50 ring-navy-800"
                        : slot.available
                          ? "bg-white text-navy-800 ring-tan-200 hover:bg-coastal-50"
                          : "cursor-not-allowed bg-cream-100 text-navy-300 ring-tan-100 line-through"
                    }`}
                  >
                    {formatTime(slot.startTime)}
                    {!slot.available ? <span className="sr-only"> — unavailable</span> : null}
                  </button>
                );
              })}
            </div>
          )}
        </fieldset>
      ) : (
        <p className="mt-6 flex items-center gap-2 text-sm text-navy-600">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
          {loading ? "Loading availability…" : "Select an available date to see departure times."}
        </p>
      )}
    </div>
  );
}
