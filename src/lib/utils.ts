import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind classes safely, resolving conflicts.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a currency amount for display.
 */
export function formatCurrency(
  amount: number,
  currency: string = "GHS",
  locale: string = "en-GH"
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format a date for display in the user's timezone.
 */
export function formatDate(
  date: Date | string,
  timezone: string = "Africa/Accra"
): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

/**
 * Format a datetime for display.
 */
export function formatDateTime(
  date: Date | string,
  timezone: string = "Africa/Accra"
): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

/**
 * Normalise a phone number to E.164 format.
 * Strips spaces, dashes, and parentheses.
 */
export function normalisePhone(phone: string): string {
  return phone.replace(/[\s\-().]/g, "");
}
