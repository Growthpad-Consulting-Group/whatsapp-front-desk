/**
 * Core domain types for WhatsApp Front Desk.
 * These mirror the data model in the product brief.
 */

// ─── Enums ────────────────────────────────────────────────────────────────────

export type AppointmentStatus =
  | "pending"
  | "confirmed"
  | "cancelled"
  | "completed"
  | "no_show";

export type PaymentStatus =
  | "unpaid"
  | "deposit_pending"
  | "deposit_paid"
  | "paid"
  | "partially_paid"
  | "refunded";

export type InvoiceStatus =
  | "draft"
  | "sent"
  | "due"
  | "overdue"
  | "partially_paid"
  | "paid"
  | "cancelled"
  | "disputed";

export type MessageDirection = "inbound" | "outbound";

export type MessageChannel = "whatsapp";

export type ReminderTrigger =
  | "booking_confirmed"
  | "24h_before"
  | "2h_before"
  | "invoice_due"
  | "invoice_overdue_1_3"
  | "invoice_overdue_4_7"
  | "deposit_pending";

export type UserRole = "owner" | "staff" | "admin";

// ─── Entities ─────────────────────────────────────────────────────────────────

export interface Business {
  id: string;
  name: string;
  industry: string | null;
  timezone: string;
  currency: string;
  whatsapp_number: string;
  whatsapp_phone_number_id: string | null;
  whatsapp_access_token: string | null;
  paystack_secret_key: string | null;
  logo_url: string | null;
  billing_plan: string;
  cancellation_hours: number;
  deposit_default_percent: number | null;
  created_at: string;
  updated_at: string;
}

export interface StaffMember {
  id: string;
  business_id: string;
  user_id: string | null;
  name: string;
  role: UserRole;
  email: string;
  phone: string | null;
  calendar_connected: boolean;
  active: boolean;
  created_at: string;
}

export interface Customer {
  id: string;
  business_id: string;
  name: string;
  phone: string; // E.164 format
  email: string | null;
  notes: string | null;
  consent_given: boolean;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface Service {
  id: string;
  business_id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  price: number;
  deposit_required: boolean;
  deposit_amount: number | null;
  buffer_before_minutes: number;
  buffer_after_minutes: number;
  staff_id: string | null;
  active: boolean;
  created_at: string;
}

export interface Appointment {
  id: string;
  business_id: string;
  customer_id: string;
  service_id: string;
  staff_id: string | null;
  start_at: string; // ISO 8601
  end_at: string;
  status: AppointmentStatus;
  payment_status: PaymentStatus;
  source: "whatsapp" | "manual" | "link";
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Invoice {
  id: string;
  business_id: string;
  customer_id: string;
  appointment_id: string | null;
  invoice_number: string;
  amount: number;
  amount_paid: number;
  currency: string;
  due_date: string;
  status: InvoiceStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaymentRequest {
  id: string;
  invoice_id: string | null;
  appointment_id: string | null;
  provider: string;
  link: string;
  amount: number;
  currency: string;
  status: "pending" | "paid" | "expired" | "failed";
  webhook_reference: string | null;
  created_at: string;
}

export interface ReminderRule {
  id: string;
  business_id: string;
  trigger: ReminderTrigger;
  timing_minutes: number | null; // minutes before/after event; null = immediate
  channel: MessageChannel;
  template_id: string;
  active: boolean;
}

export interface MessageTemplate {
  id: string;
  business_id: string;
  type: string;
  language: string;
  body: string;
  approval_status: "pending" | "approved" | "rejected" | "local";
}

export interface MessageLog {
  id: string;
  business_id: string;
  customer_id: string | null;
  channel: MessageChannel;
  direction: MessageDirection;
  content_summary: string;
  status: "sent" | "delivered" | "read" | "failed";
  provider_message_id: string | null;
  timestamp: string;
}

// ─── API response helpers ──────────────────────────────────────────────────────

export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

export interface MessagingProvider {
  sendText(to: string, body: string): Promise<{ messageId: string }>;
  sendTemplate(to: string, templateName: string, languageCode: string, components?: any[]): Promise<{ messageId: string }>;
}

export interface AvailableSlot {
  startAt: Date;
  endAt: Date;
  staffId: string | null;
}
