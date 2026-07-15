import "server-only";
import type { Booking, Customer, TripPackage, SiteSettings } from "@prisma/client";
import type { BookingEmailData } from "@/lib/email/templates";
import { siteUrl } from "@/lib/site";

type BookingWithRelations = Booking & { customer: Customer; package: TripPackage };

/** Assemble the data every booking email template needs. */
export function toBookingEmailData(
  booking: BookingWithRelations,
  settings: SiteSettings,
  manageToken?: string,
): BookingEmailData {
  return {
    confirmationNumber: booking.confirmationNumber,
    customerFirstName: booking.customer.firstName,
    tripName: booking.package.name,
    date: booking.date,
    startTime: booking.startTime,
    durationMinutes: booking.durationMinutes,
    guestCount: booking.adults + booking.children,
    amountPaidCents: booking.amountPaidCents,
    remainingBalanceCents: Math.max(
      0,
      booking.totalCents - booking.amountPaidCents - booking.refundedCents,
    ),
    totalCents: booking.totalCents,
    manageUrl: manageToken
      ? `${siteUrl()}/manage/${manageToken}`
      : `${siteUrl()}/manage`,
    marinaAddress: settings.marinaAddress,
    companyPhone: settings.phone,
    companyEmail: settings.email,
  };
}
