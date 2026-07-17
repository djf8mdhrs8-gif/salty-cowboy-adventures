import { SITE_NAME } from "@/lib/site";

/**
 * Generate an iCalendar (.ics) file and a Google Calendar link for a booking.
 * Times are emitted as floating local times (no TZID) — appropriate because
 * guests attend in the boat's local timezone.
 */

interface CalendarEventInput {
  confirmationNumber: string;
  tripName: string;
  date: string; // yyyy-MM-dd
  startTime: string; // HH:mm
  durationMinutes: number;
  location: string;
  description: string;
}

function toIcsStamp(date: string, time: string): string {
  return `${date.replace(/-/g, "")}T${time.replace(":", "")}00`;
}

function addMinutes(date: string, time: string, minutes: number): { date: string; time: string } {
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  const dt = new Date(y, m - 1, d, hh, mm + minutes);
  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    date: `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`,
    time: `${pad(dt.getHours())}:${pad(dt.getMinutes())}`,
  };
}

function escapeIcs(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

export function generateIcs(event: CalendarEventInput): string {
  const end = addMinutes(event.date, event.startTime, event.durationMinutes);
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const dtstamp = `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}T${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}Z`;

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:-//${SITE_NAME}//Booking//EN`,
    "BEGIN:VEVENT",
    `UID:${event.confirmationNumber}@saltycowboyadventures`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART:${toIcsStamp(event.date, event.startTime)}`,
    `DTEND:${toIcsStamp(end.date, end.time)}`,
    `SUMMARY:${escapeIcs(`${event.tripName} — ${SITE_NAME}`)}`,
    `LOCATION:${escapeIcs(event.location)}`,
    `DESCRIPTION:${escapeIcs(event.description)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

export interface FeedEvent {
  uid: string;
  summary: string;
  description: string;
  location: string;
  /** Timed event */
  date?: string; // yyyy-MM-dd
  startTime?: string; // HH:mm
  durationMinutes?: number;
  /** All-day event (used for blocked dates) */
  allDayDate?: string; // yyyy-MM-dd
  lastModified?: Date;
}

/**
 * Multi-event iCalendar feed for calendar subscriptions (Outlook, Apple,
 * Google). Floating local times, hourly refresh hint.
 */
export function generateIcsFeed(calendarName: string, events: FeedEvent[]): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const dtstamp = `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}T${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}Z`;

  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:-//${SITE_NAME}//Bookings Feed//EN`,
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeIcs(calendarName)}`,
    "X-PUBLISHED-TTL:PT1H",
    "REFRESH-INTERVAL;VALUE=DURATION:PT1H",
  ];

  for (const ev of events) {
    lines.push("BEGIN:VEVENT", `UID:${ev.uid}`, `DTSTAMP:${dtstamp}`);
    if (ev.allDayDate) {
      const [y, m, d] = ev.allDayDate.split("-").map(Number);
      const next = new Date(y, m - 1, d + 1);
      lines.push(
        `DTSTART;VALUE=DATE:${ev.allDayDate.replace(/-/g, "")}`,
        `DTEND;VALUE=DATE:${next.getFullYear()}${pad(next.getMonth() + 1)}${pad(next.getDate())}`,
      );
    } else if (ev.date && ev.startTime && ev.durationMinutes !== undefined) {
      const end = addMinutes(ev.date, ev.startTime, ev.durationMinutes);
      lines.push(
        `DTSTART:${toIcsStamp(ev.date, ev.startTime)}`,
        `DTEND:${toIcsStamp(end.date, end.time)}`,
      );
    }
    lines.push(
      `SUMMARY:${escapeIcs(ev.summary)}`,
      `LOCATION:${escapeIcs(ev.location)}`,
      `DESCRIPTION:${escapeIcs(ev.description)}`,
      "END:VEVENT",
    );
  }

  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

export function googleCalendarUrl(event: CalendarEventInput): string {
  const end = addMinutes(event.date, event.startTime, event.durationMinutes);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `${event.tripName} — ${SITE_NAME}`,
    dates: `${toIcsStamp(event.date, event.startTime)}/${toIcsStamp(end.date, end.time)}`,
    location: event.location,
    details: event.description,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
