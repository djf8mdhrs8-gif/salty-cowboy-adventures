import { NextResponse } from "next/server";
import { contactRequestSchema } from "@/lib/validation/booking";
import { handleApiError, tooManyRequests } from "@/lib/api-helpers";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { sendEmail } from "@/lib/email/send";
import { getSettings } from "@/lib/server/settings";

export const dynamic = "force-dynamic";

/** POST /api/contact — forwards the contact form to the business inbox. */
export async function POST(req: Request) {
  try {
    const rl = rateLimit(`contact:${clientIp(req)}`, { limit: 5, windowSeconds: 600 });
    if (!rl.ok) return tooManyRequests(rl.retryAfterSeconds);

    const body = contactRequestSchema.parse(await req.json());
    const settings = await getSettings();

    const esc = (s: string) =>
      s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

    await sendEmail({
      to: settings.email,
      type: "CONTACT_FORM",
      content: {
        subject: `Website inquiry from ${body.name}`,
        html: `<p><strong>Name:</strong> ${esc(body.name)}</p>
               <p><strong>Email:</strong> ${esc(body.email)}</p>
               <p><strong>Phone:</strong> ${esc(body.phone || "—")}</p>
               <p><strong>Message:</strong></p>
               <p>${esc(body.message).replace(/\n/g, "<br/>")}</p>`,
      },
    });

    return NextResponse.json({ message: "Sent" });
  } catch (err) {
    return handleApiError(err);
  }
}
