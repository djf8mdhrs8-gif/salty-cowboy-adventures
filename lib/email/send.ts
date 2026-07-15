import "server-only";
import { Resend } from "resend";
import { prisma } from "@/lib/db";
import type { EmailType } from "@prisma/client";
import type { EmailContent } from "@/lib/email/templates";

/**
 * Send a transactional email via Resend and record it in EmailLog.
 * When RESEND_API_KEY is unset (local dev), the email is logged as SKIPPED
 * and printed to the server console instead — the app keeps working.
 */
export async function sendEmail(params: {
  to: string;
  type: EmailType;
  content: EmailContent;
  bookingId?: string;
}): Promise<void> {
  const { to, type, content, bookingId } = params;
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM ?? "Salty Cowboy Adventures <bookings@example.com>";

  if (!apiKey) {
    console.info(`[email skipped — no RESEND_API_KEY] ${type} -> ${to}: ${content.subject}`);
    await prisma.emailLog.create({
      data: { to, type, subject: content.subject, status: "SKIPPED", bookingId },
    });
    return;
  }

  try {
    const resend = new Resend(apiKey);
    const { data, error } = await resend.emails.send({
      from,
      to,
      subject: content.subject,
      html: content.html,
    });
    if (error) throw new Error(error.message);
    await prisma.emailLog.create({
      data: {
        to,
        type,
        subject: content.subject,
        status: "SENT",
        providerId: data?.id,
        bookingId,
      },
    });
  } catch (err) {
    // Email failures must never break a booking/payment flow.
    console.error(`Failed to send ${type} email to ${to}:`, err);
    await prisma.emailLog
      .create({
        data: {
          to,
          type,
          subject: content.subject,
          status: "FAILED",
          error: err instanceof Error ? err.message : "unknown",
          bookingId,
        },
      })
      .catch(() => {});
  }
}
