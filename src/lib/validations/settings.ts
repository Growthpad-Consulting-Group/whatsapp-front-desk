import { z } from "zod";

export const BusinessSettingsSchema = z.object({
  name: z.string().min(2, "Business name must be at least 2 characters").trim(),
  industry: z.string().min(1, "Select an industry").optional().nullable(),
  timezone: z.string().min(1, "Select a timezone"),
  currency: z.string().length(3, "Select a currency"),
  whatsapp_number: z
    .string()
    .regex(/^\+\d{7,15}$/, "Enter a valid phone number in E.164 format e.g. +254712345678")
    .trim(),
  cancellation_hours: z.coerce
    .number()
    .min(0, "Cancellation hours must be 0 or more")
    .max(168, "Cancellation hours cannot exceed 7 days (168 hours)"),
  deposit_default_percent: z.coerce
    .number()
    .min(0, "Deposit percentage must be 0 or more")
    .max(100, "Deposit percentage cannot exceed 100")
    .nullable()
    .optional(),
});

export type BusinessSettingsInput = z.infer<typeof BusinessSettingsSchema>;

export const ServiceSchema = z.object({
  name: z.string().min(2, "Service name must be at least 2 characters").trim(),
  description: z.string().optional().nullable(),
  duration_minutes: z.coerce
    .number()
    .min(1, "Duration must be at least 1 minute")
    .max(1440, "Duration cannot exceed 24 hours"),
  price: z.coerce
    .number()
    .min(0, "Price must be at least 0"),
  deposit_required: z.preprocess(
    (val) => val === "true" || val === true,
    z.boolean()
  ),
  deposit_amount: z.coerce
    .number()
    .min(0, "Deposit amount must be at least 0")
    .nullable()
    .optional(),
  buffer_before_minutes: z.coerce
    .number()
    .min(0, "Buffer before must be 0 or more")
    .max(120, "Buffer before cannot exceed 120 minutes")
    .default(0),
  buffer_after_minutes: z.coerce
    .number()
    .min(0, "Buffer after must be 0 or more")
    .max(120, "Buffer after cannot exceed 120 minutes")
    .default(0),
  staff_id: z.string().uuid("Invalid staff selection").nullable().optional().or(z.literal("")),
  active: z.preprocess(
    (val) => val === "true" || val === true || val === undefined,
    z.boolean()
  ).default(true),
}).refine((data) => {
  if (data.deposit_required && (data.deposit_amount === null || data.deposit_amount === undefined)) {
    return false;
  }
  return true;
}, {
  message: "Deposit amount is required when deposit is enabled",
  path: ["deposit_amount"],
});

export type ServiceInput = z.infer<typeof ServiceSchema>;

export const StaffSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").trim(),
  email: z.string().email("Enter a valid email address").trim().toLowerCase(),
  phone: z.string().optional().nullable().or(z.literal("")),
  role: z.enum(["owner", "staff"]),
  active: z.preprocess(
    (val) => val === "true" || val === true || val === undefined,
    z.boolean()
  ).default(true),
});

export type StaffInput = z.infer<typeof StaffSchema>;

export const OperatingHoursDaySchema = z.object({
  day_of_week: z.coerce.number().min(0).max(6),
  open_time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Invalid time format").nullable().optional().or(z.literal("")),
  close_time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Invalid time format").nullable().optional().or(z.literal("")),
  is_closed: z.preprocess(
    (val) => val === "true" || val === true,
    z.boolean()
  ).default(false),
}).refine((data) => {
  if (!data.is_closed && (!data.open_time || !data.close_time)) {
    return false;
  }
  return true;
}, {
  message: "Open and close times are required if the day is not closed",
  path: ["open_time"],
});

export const OperatingHoursSchema = z.array(OperatingHoursDaySchema);
export type OperatingHoursInput = z.infer<typeof OperatingHoursSchema>;
