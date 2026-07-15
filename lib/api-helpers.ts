import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { SlotUnavailableError } from "@/lib/server/bookings";
import { PricingError } from "@/lib/pricing";

/** Consistent, safe error responses — no stack traces or internals leak. */
export function handleApiError(err: unknown): NextResponse {
  if (err instanceof ZodError) {
    return NextResponse.json(
      { error: "Invalid request", issues: err.flatten().fieldErrors },
      { status: 400 },
    );
  }
  if (err instanceof SlotUnavailableError || err instanceof PricingError) {
    return NextResponse.json({ error: err.message }, { status: 409 });
  }
  const status = (err as { status?: number })?.status;
  if (status === 401) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  console.error("API error:", err);
  return NextResponse.json(
    { error: "Something went wrong. Please try again." },
    { status: 500 },
  );
}

export function tooManyRequests(retryAfterSeconds: number): NextResponse {
  return NextResponse.json(
    { error: "Too many requests. Please slow down and try again." },
    { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } },
  );
}
