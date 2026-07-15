import { Download } from "lucide-react";

export const dynamic = "force-dynamic";

const REPORTS = [
  { slug: "bookings", name: "All bookings", desc: "Every booking with customer, status, and payment totals." },
  { slug: "revenue-by-month", name: "Revenue by month", desc: "Gross payments, refunds, and net revenue per month." },
  { slug: "bookings-by-trip", name: "Bookings by trip type", desc: "Booking counts and value grouped by package and status." },
  { slug: "cancellation-rate", name: "Cancellation rate", desc: "Overall cancellation/refund rate." },
  { slug: "deposit-balances", name: "Outstanding balances", desc: "Upcoming trips with unpaid balances." },
  { slug: "customers", name: "Customer list", desc: "All customers with booking counts and lifetime spend." },
  { slug: "tax-totals", name: "Tax totals", desc: "Tax and booking fees collected, by trip month." },
];

export default function AdminReportsPage() {
  return (
    <div>
      <h1 className="font-heading text-2xl font-bold">Reports</h1>
      <p className="mt-1 text-sm text-navy-600">All reports download as CSV.</p>
      <ul className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {REPORTS.map((r) => (
          <li key={r.slug} className="rounded-xl bg-white p-5 shadow-card">
            <h2 className="font-heading text-lg font-bold">{r.name}</h2>
            <p className="mt-1 text-sm text-navy-600">{r.desc}</p>
            <a
              href={`/api/admin/reports/${r.slug}`}
              className="btn-secondary mt-4 !min-h-10 !px-4 !py-2 text-sm"
              download
            >
              <Download className="h-4 w-4" aria-hidden /> Export CSV
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
