import { getSettings } from "@/lib/server/settings";
import { SettingsForm } from "@/components/admin/SettingsForm";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const s = await getSettings();

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold">Business settings</h1>
      <div className="mt-6 max-w-3xl">
        <SettingsForm
          initial={{
            companyName: s.companyName,
            phone: s.phone,
            email: s.email,
            marinaAddress: s.marinaAddress,
            serviceArea: s.serviceArea,
            instagramUrl: s.instagramUrl,
            facebookUrl: s.facebookUrl,
            taxRateBps: s.taxRateBps,
            bookingFeeBps: s.bookingFeeBps,
            minNoticeHours: s.minNoticeHours,
            maxAdvanceDays: s.maxAdvanceDays,
            turnaroundMinutes: s.turnaroundMinutes,
            holdMinutes: s.holdMinutes,
            reminderDaysBefore: s.reminderDaysBefore,
            balanceReminderDays: s.balanceReminderDays,
          }}
        />
      </div>
    </div>
  );
}
