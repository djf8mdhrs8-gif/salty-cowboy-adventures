import { z } from "zod";

export const ymdSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format");

export const hhmmSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Invalid time format");

export const phoneSchema = z
  .string()
  .min(7, "Enter a valid phone number")
  .max(25)
  .regex(/^[+()\-.\s\d]+$/, "Enter a valid phone number");

export const guestDetailsSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(80),
  lastName: z.string().trim().min(1, "Last name is required").max(80),
  email: z.string().trim().email("Enter a valid email").max(200),
  phone: phoneSchema,
  adults: z.number().int().min(1, "At least one adult is required").max(20),
  children: z.number().int().min(0).max(20),
  emergencyContactName: z.string().trim().min(1, "Emergency contact is required").max(120),
  emergencyContactPhone: phoneSchema,
  specialRequests: z.string().trim().max(1000).optional().or(z.literal("")),
  accessibilityNeeds: z.string().trim().max(1000).optional().or(z.literal("")),
  fishingExperience: z
    .enum(["NONE", "BEGINNER", "INTERMEDIATE", "EXPERIENCED"])
    .optional(),
});

export const checkoutRequestSchema = z.object({
  packageId: z.string().min(1),
  date: ymdSchema,
  startTime: hhmmSchema,
  guest: guestDetailsSchema,
  addons: z
    .array(
      z.object({
        addonId: z.string().min(1),
        quantity: z.number().int().min(1).max(20),
      }),
    )
    .max(20),
  paymentPlan: z.enum(["DEPOSIT", "FULL"]),
  policiesAccepted: z.literal(true, {
    errorMap: () => ({ message: "You must accept the policies to book." }),
  }),
});

export type CheckoutRequest = z.infer<typeof checkoutRequestSchema>;

export const lookupRequestSchema = z.object({
  confirmationNumber: z.string().trim().min(4).max(20),
  email: z.string().trim().email().max(200),
});

export const contactRequestSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().max(25).optional().or(z.literal("")),
  message: z.string().trim().min(1).max(3000),
});
