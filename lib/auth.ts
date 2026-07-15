import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";

/**
 * Self-hosted admin auth: bcrypt-verified credentials issue a short-lived
 * signed JWT in an httpOnly cookie. No third-party auth dependency; swap for
 * Clerk/Supabase later if desired by replacing this module and middleware.ts.
 */

export const ADMIN_COOKIE = "sca_admin_session";
const SESSION_HOURS = 12;

export interface AdminSession {
  adminUserId: string;
  userId: string;
  email: string;
  name: string;
  role: string;
}

function secretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error("AUTH_SECRET must be set (32+ random chars).");
  }
  return new TextEncoder().encode(secret);
}

export async function createAdminSessionToken(session: AdminSession): Promise<string> {
  return new SignJWT({ ...session })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(session.adminUserId)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_HOURS}h`)
    .sign(secretKey());
}

export async function verifyAdminSessionToken(token: string): Promise<AdminSession | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey());
    if (!payload.adminUserId || !payload.email) return null;
    return {
      adminUserId: String(payload.adminUserId),
      userId: String(payload.userId),
      email: String(payload.email),
      name: String(payload.name ?? ""),
      role: String(payload.role ?? "ADMIN"),
    };
  } catch {
    return null;
  }
}

/** Read + verify the session cookie. Returns null when not signed in. */
export async function getAdminSession(): Promise<AdminSession | null> {
  const store = await cookies();
  const token = store.get(ADMIN_COOKIE)?.value;
  if (!token) return null;
  return verifyAdminSessionToken(token);
}

/** For route handlers: throws a 401-shaped error when unauthenticated. */
export async function requireAdmin(): Promise<AdminSession> {
  const session = await getAdminSession();
  if (!session) {
    const err = new Error("Unauthorized") as Error & { status: number };
    err.status = 401;
    throw err;
  }
  return session;
}

export async function verifyAdminCredentials(
  email: string,
  password: string,
): Promise<AdminSession | null> {
  const { default: bcrypt } = await import("bcryptjs");
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
    include: { admin: true },
  });
  // Always run a compare so response timing doesn't reveal whether the
  // account exists.
  const hash =
    user?.admin?.passwordHash ??
    "$2a$12$C6UzMDM.H6dfI/f/IKcEeO7ZK1zGkFIY3rCV0uJ0nHFFF0GJO1S1u";
  const ok = await bcrypt.compare(password, hash);
  if (!ok || !user?.admin) return null;

  await prisma.adminUser.update({
    where: { id: user.admin.id },
    data: { lastLoginAt: new Date() },
  });

  return {
    adminUserId: user.admin.id,
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  };
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: SESSION_HOURS * 60 * 60,
};
