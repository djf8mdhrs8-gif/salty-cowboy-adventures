"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, Ban } from "lucide-react";
import { formatTime, formatYmd } from "@/lib/dates";
import { dateToYmd, ymdToDate } from "@/lib/availability";

interface CalBooking {
  id: string;
  date: string;
  startTime: string;
  durationMinutes: number;
  status: string;
  tripName: string;
  customerName: string;
  guestCount: number;
  confirmationNumber: string;
}

interface CalBlock {
  date: string;
  startTime: string | null;
  endTime: string | null;
  reason: string | null;
}

type View = "month" | "week" | "day";

const STATUS_COLORS: Record<string, string> = {
  CONFIRMED: "bg-seafoam-200 text-seafoam-900",
  RESCHEDULED: "bg-coastal-200 text-coastal-900",
  WEATHER_HOLD: "bg-tan-200 text-tan-900",
  COMPLETED: "bg-navy-100 text-navy-800",
  AWAITING_PAYMENT: "bg-cream-200 text-navy-700",
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** Month / week / day booking calendar. Clicking a booking opens its detail page. */
export function AdminCalendar({
  month,
  bookings,
  blockedDates,
}: {
  month: string;
  bookings: CalBooking[];
  blockedDates: CalBlock[];
}) {
  const router = useRouter();
  const search = useSearchParams();
  const [view, setView] = useState<View>("month");
  const [anchor, setAnchor] = useState(() => dateToYmd(new Date()));

  const byDate = useMemo(() => {
    const map = new Map<string, CalBooking[]>();
    for (const b of bookings) {
      const list = map.get(b.date) ?? [];
      list.push(b);
      map.set(b.date, list);
    }
    return map;
  }, [bookings]);

  const blocksByDate = useMemo(() => {
    const map = new Map<string, CalBlock[]>();
    for (const b of blockedDates) {
      const list = map.get(b.date) ?? [];
      list.push(b);
      map.set(b.date, list);
    }
    return map;
  }, [blockedDates]);

  const [y, m] = month.split("-").map(Number);
  const monthLabel = new Date(y, m - 1, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  function shiftMonth(delta: number) {
    const d = new Date(y, m - 1 + delta, 1);
    const params = new URLSearchParams(search.toString());
    params.set("month", `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    router.push(`/admin/calendar?${params.toString()}`);
  }

  function shiftAnchor(days: number) {
    const d = ymdToDate(anchor);
    d.setDate(d.getDate() + days);
    const next = dateToYmd(d);
    setAnchor(next);
    if (!next.startsWith(month)) {
      const params = new URLSearchParams(search.toString());
      params.set("month", next.slice(0, 7));
      router.push(`/admin/calendar?${params.toString()}`);
    }
  }

  const daysInMonth = new Date(y, m, 0).getDate();
  const firstWeekday = new Date(y, m - 1, 1).getDay();
  const pad = (n: number) => String(n).padStart(2, "0");

  const weekDates = useMemo(() => {
    const start = ymdToDate(anchor);
    start.setDate(start.getDate() - start.getDay());
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      return dateToYmd(d);
    });
  }, [anchor]);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-md border border-tan-200 bg-white"
            onClick={() => (view === "month" ? shiftMonth(-1) : shiftAnchor(view === "week" ? -7 : -1))}
            aria-label="Previous"
          >
            <ChevronLeft className="h-5 w-5" aria-hidden />
          </button>
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-md border border-tan-200 bg-white"
            onClick={() => (view === "month" ? shiftMonth(1) : shiftAnchor(view === "week" ? 7 : 1))}
            aria-label="Next"
          >
            <ChevronRight className="h-5 w-5" aria-hidden />
          </button>
          <h2 className="ml-2 font-heading text-lg font-bold">
            {view === "month" ? monthLabel : view === "week" ? `Week of ${formatYmd(weekDates[0], "MMM d")}` : formatYmd(anchor)}
          </h2>
        </div>
        <div role="group" aria-label="Calendar view" className="flex rounded-md border border-tan-200 bg-white p-0.5">
          {(["month", "week", "day"] as const).map((v) => (
            <button
              key={v}
              type="button"
              aria-pressed={view === v}
              onClick={() => setView(v)}
              className={`rounded px-3.5 py-1.5 text-sm font-semibold capitalize ${
                view === v ? "bg-navy-800 text-white" : "text-navy-700"
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {view === "month" ? (
        <div className="mt-4 grid grid-cols-7 gap-1">
          {WEEKDAYS.map((d) => (
            <div key={d} className="py-1 text-center text-xs font-bold uppercase text-navy-500">
              {d}
            </div>
          ))}
          {Array.from({ length: firstWeekday }).map((_, i) => (
            <div key={`pad-${i}`} />
          ))}
          {Array.from({ length: daysInMonth }, (_, i) => {
            const date = `${month}-${pad(i + 1)}`;
            const dayBookings = byDate.get(date) ?? [];
            const dayBlocks = blocksByDate.get(date) ?? [];
            return (
              <button
                key={date}
                type="button"
                onClick={() => {
                  setAnchor(date);
                  setView("day");
                }}
                className="min-h-24 rounded-md border border-cream-200 bg-white p-1.5 text-left align-top hover:border-coastal-400"
                aria-label={`${formatYmd(date)}: ${dayBookings.length} booking${dayBookings.length === 1 ? "" : "s"}${dayBlocks.length ? ", has blocks" : ""}`}
              >
                <span className="flex items-center justify-between text-xs font-bold text-navy-700">
                  {i + 1}
                  {dayBlocks.length > 0 ? <Ban className="h-3.5 w-3.5 text-red-600" aria-hidden /> : null}
                </span>
                <span className="mt-1 block space-y-0.5">
                  {dayBookings.slice(0, 3).map((b) => (
                    <span
                      key={b.id}
                      className={`block truncate rounded px-1 py-0.5 text-[0.65rem] font-semibold ${STATUS_COLORS[b.status] ?? "bg-cream-200"}`}
                    >
                      {formatTime(b.startTime)} {b.tripName}
                    </span>
                  ))}
                  {dayBookings.length > 3 ? (
                    <span className="block text-[0.65rem] text-navy-500">
                      +{dayBookings.length - 3} more
                    </span>
                  ) : null}
                </span>
              </button>
            );
          })}
        </div>
      ) : null}

      {view === "week" ? (
        <div className="mt-4 grid gap-2 lg:grid-cols-7">
          {weekDates.map((date) => (
            <DayColumn
              key={date}
              date={date}
              bookings={byDate.get(date) ?? []}
              blocks={blocksByDate.get(date) ?? []}
            />
          ))}
        </div>
      ) : null}

      {view === "day" ? (
        <div className="mt-4 max-w-xl">
          <DayColumn
            date={anchor}
            bookings={byDate.get(anchor) ?? []}
            blocks={blocksByDate.get(anchor) ?? []}
            detailed
          />
        </div>
      ) : null}
    </div>
  );
}

function DayColumn({
  date,
  bookings,
  blocks,
  detailed = false,
}: {
  date: string;
  bookings: CalBooking[];
  blocks: CalBlock[];
  detailed?: boolean;
}) {
  return (
    <section className="rounded-lg border border-cream-200 bg-white p-2.5">
      <h3 className="text-xs font-bold uppercase tracking-wide text-navy-600">
        {formatYmd(date, detailed ? "EEEE, MMMM d" : "EEE d")}
      </h3>
      {blocks.map((b, i) => (
        <p key={i} className="mt-2 flex items-center gap-1 rounded bg-red-50 px-2 py-1 text-xs font-semibold text-red-800">
          <Ban className="h-3.5 w-3.5" aria-hidden />
          {b.startTime ? `${formatTime(b.startTime)}–${formatTime(b.endTime!)}` : "All day"}
          {b.reason ? ` · ${b.reason}` : ""}
        </p>
      ))}
      <ul className="mt-2 space-y-1.5">
        {bookings.map((b) => (
          <li key={b.id}>
            <Link
              href={`/admin/bookings/${b.id}`}
              className={`block rounded-md px-2 py-1.5 text-xs font-semibold hover:ring-2 hover:ring-coastal-400 ${STATUS_COLORS[b.status] ?? "bg-cream-200"}`}
            >
              {formatTime(b.startTime)} · {b.tripName}
              <span className="block font-normal">
                {b.customerName} · {b.guestCount} guests
                {detailed ? ` · ${b.confirmationNumber} · ${b.status.replace(/_/g, " ")}` : ""}
              </span>
            </Link>
          </li>
        ))}
        {bookings.length === 0 ? (
          <li className="py-2 text-center text-xs text-navy-400">No trips</li>
        ) : null}
      </ul>
    </section>
  );
}
