import type { Metadata } from "next";
import { LookupForm } from "@/components/manage/LookupForm";

export const metadata: Metadata = {
  title: "Manage your booking",
  description:
    "Look up your Salty Cowboy Adventures booking to pay a balance, reschedule, or cancel.",
  robots: { index: false },
};

export default function ManageLookupPage() {
  return (
    <div className="bg-cream-50 py-14">
      <div className="container-content max-w-lg">
        <h1 className="text-3xl font-bold">Manage your booking</h1>
        <p className="mt-3 leading-relaxed text-navy-600">
          Enter your confirmation number and the email you booked with. We&apos;ll send you a
          secure link to view, pay, reschedule, or cancel your reservation.
        </p>
        <div className="mt-8">
          <LookupForm />
        </div>
      </div>
    </div>
  );
}
