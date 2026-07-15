import { describe, it, expect, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({ cookies: vi.fn() }));
vi.mock("@/lib/db", () => ({ prisma: {} }));

import { generateConfirmationNumber, isValidConfirmationNumber } from "@/lib/confirmation";
import { generateManageToken, hashToken, tokenMatchesHash } from "@/lib/tokens";
import { createAdminSessionToken, verifyAdminSessionToken } from "@/lib/auth";
import { advisoryLockKeyForDate } from "@/lib/server/bookings";

describe("confirmation numbers", () => {
  it("match the expected unguessable format", () => {
    for (let i = 0; i < 50; i++) {
      const n = generateConfirmationNumber();
      expect(n).toMatch(/^SCA-[A-HJ-NP-Z2-9]{8}$/);
      expect(isValidConfirmationNumber(n)).toBe(true);
    }
  });

  it("do not repeat across a reasonable sample", () => {
    const seen = new Set(Array.from({ length: 1000 }, generateConfirmationNumber));
    expect(seen.size).toBe(1000);
  });

  it("rejects malformed inputs", () => {
    expect(isValidConfirmationNumber("SCA-123")).toBe(false);
    expect(isValidConfirmationNumber("ABC-DEFGHJKL")).toBe(false);
    expect(isValidConfirmationNumber("")).toBe(false);
  });
});

describe("manage tokens (secure booking lookup)", () => {
  it("stores only a hash that verifies against the raw token", () => {
    const { token, hash } = generateManageToken();
    expect(token).not.toEqual(hash);
    expect(hash).toHaveLength(64); // sha256 hex
    expect(tokenMatchesHash(token, hash)).toBe(true);
  });

  it("rejects a different token against the stored hash", () => {
    const { hash } = generateManageToken();
    const { token: other } = generateManageToken();
    expect(tokenMatchesHash(other, hash)).toBe(false);
  });

  it("is deterministic for the same token", () => {
    const { token } = generateManageToken();
    expect(hashToken(token)).toBe(hashToken(token));
  });
});

describe("admin session tokens (authorization protection)", () => {
  const session = {
    adminUserId: "admin_1",
    userId: "user_1",
    email: "owner@example.com",
    name: "Owner",
    role: "ADMIN",
  };

  it("round-trips a signed session", async () => {
    vi.stubEnv("AUTH_SECRET", "test-secret-that-is-long-enough-123456");
    const token = await createAdminSessionToken(session);
    const verified = await verifyAdminSessionToken(token);
    expect(verified).toMatchObject({ adminUserId: "admin_1", email: "owner@example.com" });
    vi.unstubAllEnvs();
  });

  it("rejects tampered tokens", async () => {
    vi.stubEnv("AUTH_SECRET", "test-secret-that-is-long-enough-123456");
    const token = await createAdminSessionToken(session);
    const tampered = token.slice(0, -3) + "abc";
    expect(await verifyAdminSessionToken(tampered)).toBeNull();
    vi.unstubAllEnvs();
  });

  it("rejects tokens signed with a different secret", async () => {
    vi.stubEnv("AUTH_SECRET", "secret-one-that-is-long-enough-111111");
    const token = await createAdminSessionToken(session);
    vi.stubEnv("AUTH_SECRET", "secret-two-that-is-long-enough-222222");
    expect(await verifyAdminSessionToken(token)).toBeNull();
    vi.unstubAllEnvs();
  });
});

describe("advisory lock keys (race-condition protection)", () => {
  it("is deterministic per date and distinct across dates", () => {
    expect(advisoryLockKeyForDate("2026-08-10")).toBe(advisoryLockKeyForDate("2026-08-10"));
    expect(advisoryLockKeyForDate("2026-08-10")).not.toBe(advisoryLockKeyForDate("2026-08-11"));
  });

  it("fits in a signed 64-bit integer for pg_advisory_xact_lock", () => {
    const key = advisoryLockKeyForDate("2026-08-10");
    expect(key >= -(2n ** 63n) && key < 2n ** 63n).toBe(true);
  });
});
