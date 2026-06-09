import { z } from "zod";

export const BusinessProfileSchema = z.object({
  name: z.string().min(2, "Business name must be at least 2 characters").trim(),
  industry: z.string().min(1, "Select an industry"),
  timezone: z.string().min(1, "Select a timezone"),
  currency: z.string().length(3, "Select a currency"),
  whatsapp_number: z
    .string()
    .regex(/^\+\d{7,15}$/, "Enter a valid phone number in E.164 format e.g. +254712345678")
    .trim(),
});

export type BusinessProfileInput = z.infer<typeof BusinessProfileSchema>;

export const INDUSTRIES = [
  "Beauty & Wellness",
  "Fitness & Training",
  "Education & Tutoring",
  "Photography",
  "Repair Services",
  "Consulting",
  "Healthcare",
  "Other",
] as const;

export const TIMEZONES = [
  { label: "Nairobi (EAT, UTC+3)", value: "Africa/Nairobi" },
  { label: "Lagos (WAT, UTC+1)", value: "Africa/Lagos" },
  { label: "Accra (GMT, UTC+0)", value: "Africa/Accra" },
  { label: "Johannesburg (SAST, UTC+2)", value: "Africa/Johannesburg" },
  { label: "London (GMT/BST)", value: "Europe/London" },
  { label: "Dubai (GST, UTC+4)", value: "Asia/Dubai" },
] as const;

export const CURRENCIES = [
  { label: "KES — Kenyan Shilling", value: "KES" },
  { label: "USD — US Dollar", value: "USD" },
  { label: "GHS — Ghanaian Cedi", value: "GHS" },
  { label: "NGN — Nigerian Naira", value: "NGN" },
  { label: "GBP — British Pound", value: "GBP" },
  { label: "EUR — Euro", value: "EUR" },
] as const;
