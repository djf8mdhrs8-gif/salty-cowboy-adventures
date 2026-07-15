import { z } from "zod";
import { ymdSchema, hhmmSchema } from "@/lib/validation/booking";

export const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1).max(200),
});

const packageBaseSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers, hyphens only"),
  name: z.string().trim().min(1).max(120),
  tagline: z.string().trim().min(1).max(200),
  description: z.string().trim().min(1).max(5000),
  durationMinutes: z.number().int().min(30).max(24 * 60),
  customDuration: z.boolean(),
  basePriceCents: z.number().int().min(0),
  includedGuests: z.number().int().min(1).max(50),
  maxGuests: z.number().int().min(1).max(50),
  additionalGuestFeeCents: z.number().int().min(0),
  depositMode: z.enum(["FULL_ONLY", "DEPOSIT_ONLY", "CUSTOMER_CHOICE"]),
  depositPercent: z.number().int().min(1).max(100),
  included: z.array(z.string().trim().min(1).max(200)).max(30),
  whatToBring: z.array(z.string().trim().min(1).max(200)).max(30),
  showFishingExperience: z.boolean(),
  familyFriendly: z.boolean(),
  featured: z.boolean(),
  active: z.boolean(),
  sortOrder: z.number().int().min(0).max(1000),
});

export const packageSchema = packageBaseSchema.refine(
  (p) => p.includedGuests <= p.maxGuests,
  { message: "Included guests cannot exceed max guests", path: ["includedGuests"] },
);

export const packageUpdateSchema = packageBaseSchema.partial().refine(
  (p) =>
    p.includedGuests === undefined ||
    p.maxGuests === undefined ||
    p.includedGuests <= p.maxGuests,
  { message: "Included guests cannot exceed max guests", path: ["includedGuests"] },
);

export const addonSchema = z.object({
  slug: z.string().trim().min(2).max(80).regex(/^[a-z0-9-]+$/),
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().min(1).max(500),
  priceCents: z.number().int().min(0),
  pricing: z.enum(["FLAT", "PER_GUEST"]),
  maxQuantity: z.number().int().min(1).max(20),
  global: z.boolean(),
  active: z.boolean(),
  sortOrder: z.number().int().min(0).max(1000),
});

const availabilityRuleBaseSchema = z.object({
  packageId: z.string().nullable(),
  daysOfWeek: z.array(z.number().int().min(0).max(6)).min(1),
  startTimes: z.array(hhmmSchema).min(1).max(12),
  seasonStart: ymdSchema.nullable(),
  seasonEnd: ymdSchema.nullable(),
  label: z.string().trim().max(120).nullable(),
  active: z.boolean(),
});

const seasonOrdered = (r: { seasonStart?: string | null; seasonEnd?: string | null }) =>
  !r.seasonStart || !r.seasonEnd || r.seasonStart <= r.seasonEnd;

export const availabilityRuleSchema = availabilityRuleBaseSchema.refine(seasonOrdered, {
  message: "Season start must be before season end",
  path: ["seasonEnd"],
});

export const availabilityRuleUpdateSchema = availabilityRuleBaseSchema
  .partial()
  .refine(seasonOrdered, {
    message: "Season start must be before season end",
    path: ["seasonEnd"],
  });

export const blockedDateSchema = z
  .object({
    date: ymdSchema,
    startTime: hhmmSchema.nullable(),
    endTime: hhmmSchema.nullable(),
    reason: z.string().trim().max(300).nullable(),
  })
  .refine((b) => (b.startTime === null) === (b.endTime === null), {
    message: "Provide both start and end time, or neither (whole day)",
    path: ["endTime"],
  })
  .refine((b) => !b.startTime || !b.endTime || b.startTime < b.endTime, {
    message: "Start time must be before end time",
    path: ["endTime"],
  });

export const bookingActionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("status"),
    status: z.enum([
      "PENDING",
      "AWAITING_PAYMENT",
      "CONFIRMED",
      "RESCHEDULED",
      "COMPLETED",
      "CANCELLED",
      "REFUNDED",
      "WEATHER_HOLD",
      "NO_SHOW",
    ]),
    reason: z.string().trim().max(500).optional(),
    sendEmail: z.boolean().optional(),
  }),
  z.object({
    action: z.literal("notes"),
    internalNotes: z.string().trim().max(5000),
  }),
  z.object({
    action: z.literal("reschedule"),
    date: ymdSchema,
    startTime: hhmmSchema,
    sendEmail: z.boolean().optional(),
  }),
  z.object({
    action: z.literal("manual-payment"),
    amountCents: z.number().int().min(1),
    method: z.enum(["CASH", "CHECK", "OTHER"]),
    note: z.string().trim().max(500).optional(),
  }),
  z.object({ action: z.literal("send-balance-reminder") }),
  z.object({ action: z.literal("send-weather-delay") }),
]);

export const refundRequestSchema = z.object({
  bookingId: z.string().min(1),
  paymentId: z.string().min(1),
  amountCents: z.number().int().min(1),
  reason: z.string().trim().max(500).optional(),
});

export const settingsSchema = z.object({
  companyName: z.string().trim().min(1).max(200),
  phone: z.string().trim().min(1).max(40),
  email: z.string().trim().email().max(200),
  marinaAddress: z.string().trim().min(1).max(400),
  serviceArea: z.string().trim().min(1).max(400),
  instagramUrl: z.string().trim().url().max(300),
  facebookUrl: z.string().trim().url().max(300),
  taxRateBps: z.number().int().min(0).max(3000),
  bookingFeeBps: z.number().int().min(0).max(3000),
  minNoticeHours: z.number().int().min(0).max(24 * 30),
  maxAdvanceDays: z.number().int().min(1).max(730),
  turnaroundMinutes: z.number().int().min(0).max(24 * 60),
  holdMinutes: z.number().int().min(5).max(24 * 60),
  reminderDaysBefore: z.array(z.number().int().min(1).max(60)).max(6),
  balanceReminderDays: z.number().int().min(1).max(60),
});
