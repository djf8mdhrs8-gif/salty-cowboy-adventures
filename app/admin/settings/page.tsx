import { getSettings } from "@/lib/server/settings";
import { SettingsForm } from "@/components/admin/SettingsForm";
import { CopyField } from "@/components/admin/CopyField";
import { siteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const s = await getSettings();
  const feedUrl = `${siteUrl()}/api/calendar-feed?key=${s.calendarFeedKey}`;

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold">Business settings</h1>

      <section className="mt-6 max-w-3xl rounded-xl bg-white p-6 shadow-card">
        <h2 className="font-heading text-lg font-bold">Calendar sync (Outlook / Apple / Google)</h2>
        <p className="mt-2 text-sm leading-relaxed text-navy-600">
          Subscribe to this private feed and every confirmed booking (plus blocked dates)
          appears in your calendar app automatically — customer name, guest count, phone,
          and balance due included. Keep the link secret; anyone with it can see bookings.
        </p>
        <div className="mt-4">
          <CopyField value={feedUrl} label="Private calendar feed URL" />
        </div>
        <details className="mt-4 text-sm text-navy-700">
          <summary className="cursor-pointer font-semibold">How to add it in Outlook</summary>
          <ol className="mt-2 list-decimal space-y-1.5 pl-5">
            <li>Copy the URL above.</li>
            <li>
              <strong>Outlook on the web / new Outlook:</strong> Calendar → Add calendar →
              Subscribe from web → paste the URL → name it &ldquo;Salty Cowboy Bookings&rdquo; → Import.
            </li>
            <li>
              <strong>Outlook mobile app:</strong> set it up on the web once — it syncs to the
              phone automatically.
            </li>
            <li>
              Apple Calendar: Settings → Accounts → Add Subscribed Calendar. Google Calendar:
              Other calendars → + → From URL.
            </li>
          </ol>
          <p className="mt-2 text-xs text-navy-500">
            Calendar apps refresh subscribed feeds on their own schedule (Outlook: roughly every
            few hours). The admin calendar here is always up to the second.
          </p>
        </details>
      </section>

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
