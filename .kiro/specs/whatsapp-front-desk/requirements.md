# Requirements — WhatsApp Front Desk

## Introduction

WhatsApp Front Desk is a lightweight SaaS for solo and small service businesses that use WhatsApp as their primary customer channel. It automates the repetitive admin work around booking, reminders, deposits, invoices, and payment follow-up — without requiring customers to download an app or create an account.

Target niches for launch: beauty and wellness, tutors and coaches, personal trainers, repair services, photographers, small consultants.

---

## Requirements

### 1. Business Onboarding and Setup

**Requirement 1.1 — Account creation**
A business owner must be able to create an account with email and password, or via magic link, and complete basic profile setup (business name, industry, timezone, currency, WhatsApp number) within 10 minutes.

**Requirement 1.2 — Operating hours**
The owner must be able to define weekly operating hours per day, including the ability to mark days as closed.

**Requirement 1.3 — Cancellation policy**
The owner must be able to set a cancellation window (e.g. no cancellations within 24 hours of appointment).

**Requirement 1.4 — Deposit rules**
The owner must be able to set a default deposit requirement (fixed amount or percentage) that applies to all services, with the ability to override per service.

**Requirement 1.5 — Staff members**
The owner must be able to add staff members with name, email, role (owner or staff), and assign services to them.

---

### 2. Service Catalog

**Requirement 2.1 — Service creation**
The owner must be able to create services with: name, description, duration (minutes), price, deposit required (yes/no), deposit amount, buffer time before and after, and staff assignment.

**Requirement 2.2 — Service management**
Services must be activatable and deactivatable without deletion, so historical bookings remain intact.

---

### 3. Availability and Calendar

**Requirement 3.1 — Internal availability engine**
The system must calculate available slots based on operating hours, service duration, buffer times, and existing confirmed or pending appointments to prevent double booking.

**Requirement 3.2 — Google Calendar sync**
The owner must be able to connect a Google Calendar via OAuth. The system must sync confirmed appointments to Google Calendar and block slots that are busy in Google Calendar.

**Requirement 3.3 — Local state as source of truth**
Appointment state must always be stored locally. Google Calendar is a sync target, not the source of truth. The system must function if Google Calendar is disconnected.

---

### 4. WhatsApp Booking Flow

**Requirement 4.1 — Inbound booking via WhatsApp**
A customer must be able to initiate a booking by sending a WhatsApp message to the business number. No app download or customer account is required.

**Requirement 4.2 — Conversation state machine**
The system must maintain per-customer conversation state across messages: greeting → service selection → slot selection → confirmation → deposit (if required).

**Requirement 4.3 — Slot presentation**
The system must offer 3–5 available slots in response to a service selection, formatted as a numbered list for easy reply.

**Requirement 4.4 — Booking confirmation**
On slot selection, the system must create the appointment, send a confirmation message with date, time, and reschedule/cancel options (reply R or C).

**Requirement 4.5 — Double booking prevention**
The system must prevent double booking by checking confirmed and pending appointments before offering or confirming a slot.

**Requirement 4.6 — Human handoff**
When bot confidence is low or the customer explicitly asks for a human, the system must flag the conversation for manual handling and notify the owner.

**Requirement 4.7 — Booking link**
The system must support a shareable booking link that opens the WhatsApp conversation with a pre-filled greeting.

---

### 5. Reminders

**Requirement 5.1 — Confirmation message**
The system must send an automated confirmation message immediately after a booking is created.

**Requirement 5.2 — 24-hour reminder**
The system must send a reminder 24 hours before the appointment with reschedule and cancel options.

**Requirement 5.3 — 2-hour reminder**
The system must send a reminder 2 hours before the appointment.

**Requirement 5.4 — Configurable reminder rules**
The owner must be able to enable, disable, and customise the timing and message template for each reminder type.

**Requirement 5.5 — Delivery logging**
The system must log the delivery status of every reminder message where the WhatsApp API provides status callbacks.

**Requirement 5.6 — Idempotency**
Reminder sending must be idempotent — the same reminder must never be sent twice for the same appointment.

---

### 6. Reschedule and Cancellation

**Requirement 6.1 — Customer-initiated reschedule**
A customer must be able to reply R to a confirmation or reminder to trigger a reschedule flow that offers new available slots.

**Requirement 6.2 — Customer-initiated cancellation**
A customer must be able to reply C to cancel, subject to the business cancellation policy. The system must confirm cancellation and free the slot.

**Requirement 6.3 — Owner-initiated changes**
The owner must be able to reschedule or cancel any appointment from the dashboard, with an optional notification sent to the customer.

---

### 7. Payments and Deposits

**Requirement 7.1 — Payment link generation**
The system must generate a payment link via the configured payment provider (Paystack for launch) for deposit requests and invoice payments.

**Requirement 7.2 — Deposit flow**
When a service requires a deposit, the system must send the payment link immediately after booking confirmation and hold the slot as pending until the deposit is paid or the owner manually confirms.

**Requirement 7.3 — Slot auto-release**
If a deposit is not paid within a configurable period (default 30 minutes), the system must automatically release the slot and notify the customer.

**Requirement 7.4 — Webhook payment confirmation**
The system must accept payment webhooks from the provider and automatically update appointment and invoice payment status.

**Requirement 7.5 — Manual payment marking**
The owner must be able to manually mark a payment as paid, partially paid, cancelled, or disputed from the dashboard.

**Requirement 7.6 — Payment provider abstraction**
The payment layer must be abstracted behind a provider interface so additional providers (Stripe, Flutterwave) can be added without changing business logic.

---

### 8. Invoices

**Requirement 8.1 — Invoice creation**
The system must automatically create an invoice when an appointment is completed, or the owner must be able to create one manually.

**Requirement 8.2 — Invoice content**
Each invoice must include: invoice number, business branding, customer name, service description, amount, currency, due date, payment link, and status.

**Requirement 8.3 — Invoice page**
Each invoice must have a shareable web page and a downloadable PDF.

**Requirement 8.4 — Invoice statuses**
Invoices must support the following statuses: draft, sent, due, overdue, partially paid, paid, cancelled, disputed.

**Requirement 8.5 — Partial payments**
The system must track partial payments, update the outstanding balance, and continue reminders only for the remaining amount.

---

### 9. Collections (Overdue Follow-up)

**Requirement 9.1 — Due-date reminder**
The system must send a friendly payment request on the invoice due date.

**Requirement 9.2 — Overdue 1–3 days**
The system must send a polite reminder with invoice and payment links for invoices 1–3 days overdue.

**Requirement 9.3 — Overdue 4–7 days**
The system must send a firmer reminder and ask for a payment promise date for invoices 4–7 days overdue.

**Requirement 9.4 — Payment promise**
The owner or customer must be able to record a promised payment date. The overdue sequence must pause until that date.

**Requirement 9.5 — Manual pause**
The owner must be able to pause reminder sequences for a specific customer or invoice at any time.

---

### 10. Dashboard

**Requirement 10.1 — Today view**
The dashboard must show: appointments today, pending deposits, cancelled bookings, and reschedule requests.

**Requirement 10.2 — Bookings view**
A calendar and list view of all bookings, filterable by staff, service, status, and date range.

**Requirement 10.3 — Invoices view**
A list of all invoices grouped or filterable by status: draft, sent, due today, overdue, partially paid, paid, cancelled.

**Requirement 10.4 — Customers view**
A searchable customer list showing phone, last booking date, unpaid balance, and notes.

**Requirement 10.5 — Messages view**
A log of inbound requests, bot replies, failed messages, and conversations flagged for human handoff.

**Requirement 10.6 — Settings**
Owner-accessible settings for: services, staff, operating hours, message templates, payment provider configuration, calendar connection, and billing.

**Requirement 10.7 — Performance**
Dashboard common views must load in under 2 seconds for normal small-business usage.

---

### 11. Message Templates

**Requirement 11.1 — Editable templates**
The owner must be able to edit the body of each message template (booking confirmation, reminders, deposit request, invoice sent, overdue reminders).

**Requirement 11.2 — Template variables**
Templates must support variables: `{{business_name}}`, `{{customer_name}}`, `{{service_name}}`, `{{date}}`, `{{time}}`, `{{amount}}`, `{{payment_link}}`, `{{invoice_link}}`.

**Requirement 11.3 — WhatsApp template approval**
Templates used outside a 24-hour customer-initiated session must be submitted for Meta approval. The system must track approval status.

---

### 12. Audit and Logging

**Requirement 12.1 — Event logging**
The system must log all key events: booking created, reminder sent, invoice sent, payment status changed, cancellation, reschedule, human handoff triggered.

**Requirement 12.2 — Message log**
Every inbound and outbound WhatsApp message must be logged with direction, content summary, status, and timestamp.

**Requirement 12.3 — Webhook log**
All incoming webhooks (WhatsApp, payment providers) must be logged with raw payload and processing status.

---

### 13. Security and Privacy

**Requirement 13.1 — Multi-tenancy isolation**
Every database query must be scoped to `business_id`. Supabase RLS policies must enforce tenant isolation at the database level.

**Requirement 13.2 — Secret encryption**
Sensitive tokens (WhatsApp access token, payment provider keys, Google OAuth tokens) must be stored encrypted and never exposed to the client.

**Requirement 13.3 — Minimal data collection**
The system must collect only the data necessary to operate: customer name, phone, and booking/payment history. No medical or sensitive personal data in v1.

**Requirement 13.4 — Consent tracking**
The system must record whether a customer has given consent to receive WhatsApp messages from the business.

---

### 14. Non-Functional Requirements

**Requirement 14.1 — Onboarding time**
A new business must be able to complete setup and have a working booking flow in under 10 minutes.

**Requirement 14.2 — Reliability**
Booking creation and reminder sending must be idempotent. Duplicate appointments and duplicate messages must be impossible.

**Requirement 14.3 — Timezone support**
All times must be stored in UTC and displayed in the business's configured timezone.

**Requirement 14.4 — Localisation**
Currency display, date formats, and message templates must be configurable per business from day one.

**Requirement 14.5 — Scalability**
The architecture must support multiple businesses, multiple staff members per business, multiple timezones, and multiple messaging providers without structural changes.
