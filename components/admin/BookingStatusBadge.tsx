const TONES: Record<string, string> = {
  PENDING: "bg-tan-100 text-tan-800",
  AWAITING_PAYMENT: "bg-tan-100 text-tan-800",
  CONFIRMED: "bg-seafoam-100 text-seafoam-800",
  RESCHEDULED: "bg-coastal-100 text-coastal-800",
  COMPLETED: "bg-navy-100 text-navy-800",
  CANCELLED: "bg-red-100 text-red-800",
  REFUNDED: "bg-red-100 text-red-800",
  WEATHER_HOLD: "bg-coastal-100 text-coastal-800",
  NO_SHOW: "bg-red-100 text-red-800",
};

export function BookingStatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-1 text-[0.7rem] font-bold uppercase tracking-wide ${TONES[status] ?? "bg-cream-200 text-navy-700"}`}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}
