import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  verifyAdminCredentials,
  createAdminSessionToken,
  sessionCookieOptions,
  ADMIN_COOKIE,
} from "@/lib/auth";
import { loginSchema } from "@/lib/validation/admin";
import { handleApiError, tooManyRequests } from "@/lib/api-helpers";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { logAdminAction } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const ip = clientIp(req);
    const rl = rateLimit(`admin-login:${ip}`, { limit: 5, windowSeconds: 300 });
    if (!rl.ok) return tooManyRequests(rl.retryAfterSeconds);

    const { email, password } = loginSchema.parse(await req.json());
    const session = await verifyAdminCredentials(email, password);
    if (!session) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    const token = await createAdminSessionToken(session);
    const store = await cookies();
    store.set(ADMIN_COOKIE, token, sessionCookieOptions);

    await logAdminAction({
      adminUserId: session.adminUserId,
      action: "auth.login",
      entityType: "AdminUser",
      entityId: session.adminUserId,
      ipAddress: ip,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
