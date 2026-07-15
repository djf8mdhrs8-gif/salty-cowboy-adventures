import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatCents } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const customers = await prisma.customer.findMany({
    where: q
      ? {
          OR: [
            { email: { contains: q, mode: "insensitive" } },
            { firstName: { contains: q, mode: "insensitive" } },
            { lastName: { contains: q, mode: "insensitive" } },
            { phone: { contains: q } },
          ],
        }
      : undefined,
    include: {
      bookings: { select: { amountPaidCents: true, refundedCents: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold">Customers</h1>

      <form className="mt-5 flex max-w-md items-end gap-3" method="get">
        <div className="flex-1">
          <label htmlFor="q" className="field-label">Search</label>
          <input id="q" name="q" defaultValue={q} className="field-input" placeholder="Name, email, or phone" />
        </div>
        <button type="submit" className="btn-primary !min-h-[2.9rem]">Search</button>
      </form>

      <div className="mt-6 overflow-x-auto rounded-xl bg-white shadow-card">
        <table className="w-full min-w-[42rem] text-left text-sm">
          <thead>
            <tr className="border-b border-cream-200 text-xs uppercase tracking-wide text-navy-500">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3 text-right">Bookings</th>
              <th className="px-4 py-3 text-right">Total spent</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => (
              <tr key={c.id} className="border-b border-cream-100 hover:bg-cream-50">
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/customers/${c.id}`}
                    className="font-semibold text-coastal-700 underline underline-offset-2"
                  >
                    {c.firstName} {c.lastName}
                  </Link>
                </td>
                <td className="px-4 py-3">{c.email}</td>
                <td className="px-4 py-3">{c.phone}</td>
                <td className="px-4 py-3 text-right tabular-nums">{c.bookings.length}</td>
                <td className="px-4 py-3 text-right tabular-nums">
                  {formatCents(
                    c.bookings.reduce((s, b) => s + b.amountPaidCents - b.refundedCents, 0),
                  )}
                </td>
              </tr>
            ))}
            {customers.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-navy-500">
                  No customers found.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
