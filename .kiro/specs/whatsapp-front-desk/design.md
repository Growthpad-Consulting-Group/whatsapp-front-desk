# Design — WhatsApp Front Desk

## Overview

WhatsApp Front Desk is a multi-tenant SaaS. Each business is a fully isolated tenant. The system has three main surfaces: the admin dashboard (Next.js), the WhatsApp conversation layer (webhook + state machine), and the background job layer (reminders, overdue checks).

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Vercel (Frontend)                    │
│  Next.js App Router — Server Components + Server Actions │
│  Route Handlers — API + Webhooks + Cron endpoints        │
└────────────────────────┬────────────────────────────────┘
                         │ HTTPS
┌────────────────────────▼────────────────────────────────┐
│                  Supabase                                │
│  PostgreSQL (RLS multi-tenancy)                          │
│  Auth (email/password, magic link)                       │
│  Storage (invoice PDFs, branding assets)                 │
└──────────┬──────────────────────────┬───────────────────┘
           │                          │
┌──────────▼──────────┐   ┌───────────▼──────────────────┐
│  WhatsApp Cloud API  │   │  Paystack (payment links,     │
│  (Meta direct)       │   │  webhooks, status updates)    │
└─────────────────────┘   └──────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  cron-job.org (free tier)                                │
│  Hits /api/cron/* every 5 min → reminders, overdue,      │
│  deposit slot release                                    │
└─────────────────────────────────────────────────────────┘
```

---

## Data Model

### businesses
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| name | text | |
| industry | text | nullable |
| timezone | text | IANA timezone string |
| currency | text | ISO 4217 |
| whatsapp_number | text | E.164 |
| logo_url | text | nullable, Supabase Storage |
| billing_plan | text | default 'trial' |
| cancellation_hours | int | hours before appt |
| deposit_default_percent | numeric | nullable |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### staff_members
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| business_id | uuid FK → businesses | |
| user_id | uuid FK → auth.users | nullable (owner links to auth) |
| name | text | |
| email | text | |
| role | text | 'owner' \| 'staff' |
| phone | text | nullable |
| calendar_connected | bool | default false |
| active | bool | default true |

### customers
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| business_id | uuid FK → businesses | |
| name | text | |
| phone | text | E.164, unique per business |
| email | text | nullable |
| notes | text | nullable |
| consent_given | bool | default false |
| tags | text[] | |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### services
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| business_id | uuid FK → businesses | |
| name | text | |
| description | text | nullable |
| duration_minutes | int | |
| price | numeric | |
| deposit_required | bool | default false |
| deposit_amount | numeric | nullable |
| buffer_before_minutes | int | default 0 |
| buffer_after_minutes | int | default 0 |
| staff_id | uuid FK → staff_members | nullable |
| active | bool | default true |

### appointments
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| business_id | uuid FK → businesses | |
| customer_id | uuid FK → customers | |
| service_id | uuid FK → services | |
| staff_id | uuid FK → staff_members | nullable |
| start_at | timestamptz | stored UTC |
| end_at | timestamptz | stored UTC |
| status | text | pending \| confirmed \| cancelled \| completed \| no_show |
| payment_status | text | unpaid \| deposit_pending \| deposit_paid \| paid \| partially_paid \| refunded |
| source | text | whatsapp \| manual \| link |
| notes | text | nullable |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### invoices
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| business_id | uuid FK → businesses | |
| customer_id | uuid FK → customers | |
| appointment_id | uuid FK → appointments | nullable |
| invoice_number | text | unique per business |
| amount | numeric | |
| amount_paid | numeric | default 0 |
| currency | text | |
| due_date | date | |
| status | text | draft \| sent \| due \| overdue \| partially_paid \| paid \| cancelled \| disputed |
| notes | text | nullable |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### payment_requests
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| business_id | uuid FK → businesses | for RLS |
| invoice_id | uuid FK → invoices | nullable |
| appointment_id | uuid FK → appointments | nullable |
| provider | text | 'paystack' \| 'stripe' |
| link | text | |
| amount | numeric | |
| currency | text | |
| status | text | pending \| paid \| expired \| failed |
| webhook_reference | text | nullable |
| created_at | timestamptz | |

### reminder_rules
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| business_id | uuid FK → businesses | |
| trigger | text | booking_confirmed \| 24h_before \| 2h_before \| invoice_due \| invoice_overdue_1_3 \| invoice_overdue_4_7 \| deposit_pending |
| timing_minutes | int | nullable — minutes before/after event |
| channel | text | 'whatsapp' |
| template_id | uuid FK → message_templates | |
| active | bool | default true |

### message_templates
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| business_id | uuid FK → businesses | |
| type | text | booking_confirmation \| reminder_24h \| etc. |
| language | text | default 'en' |
| body | text | supports {{variables}} |
| approval_status | text | local \| pending \| approved \| rejected |

### message_logs
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| business_id | uuid FK → businesses | |
| customer_id | uuid FK → customers | nullable |
| channel | text | 'whatsapp' |
| direction | text | 'inbound' \| 'outbound' |
| content_summary | text | truncated, no PII |
| status | text | sent \| delivered \| read \| failed |
| provider_message_id | text | nullable |
| timestamp | timestamptz | |

### conversation_sessions
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| business_id | uuid FK → businesses | |
| customer_phone | text | E.164 |
| state | text | idle \| awaiting_service \| awaiting_slot \| awaiting_confirmation \| awaiting_deposit \| human_handoff |
| context | jsonb | current flow data (selected service, slot, etc.) |
| expires_at | timestamptz | session timeout |
| updated_at | timestamptz | |

---

## Key Design Decisions

### Multi-tenancy
Every table has a `business_id` column. Supabase RLS policies enforce that authenticated users can only read/write rows belonging to their business. Application code adds a second `business_id` filter on every query as a defence-in-depth measure.

### WhatsApp conversation state machine
Each active WhatsApp conversation is a row in `conversation_sessions`. States:

```
idle → awaiting_service → awaiting_slot → awaiting_confirmation
     ↓                                          ↓
  human_handoff ←──────────────────── awaiting_deposit
```

The webhook handler reads the current state, processes the incoming message, transitions the state, and sends the next message. Sessions expire after 30 minutes of inactivity and reset to `idle`.

### Availability engine
Available slots are computed by:
1. Fetching operating hours for the business/staff on the requested date
2. Generating candidate slots at service-duration intervals
3. Subtracting slots occupied by confirmed or pending appointments (including buffer times)
4. Subtracting slots blocked by Google Calendar busy periods (if connected)
5. Returning the first 5 available slots

### Reminder scheduler
cron-job.org hits secured API routes every 5 minutes. Each route queries Postgres for due jobs and processes them. Idempotency is enforced via a `reminder_sent_log` table — a job is only processed if no matching row exists for that appointment/invoice + trigger combination.

Routes (built in weeks 4–5):
- `POST /api/cron/reminders` — appointment reminders (confirmation, 24h, 2h)
- `POST /api/cron/overdue` — invoice overdue sequence
- `POST /api/cron/deposits` — release unpaid deposit slots after timeout

All cron routes require the `x-cron-secret` header matching `CRON_SECRET` env var. Requests without it return 401.

Each route queries for:
- Appointments where `start_at` is within the next 24h or 2h and the corresponding reminder has not been sent
- Invoices where `due_date` is today and no due-date reminder has been sent
- Invoices where `due_date` is 1–7 days past and the appropriate overdue reminder has not been sent
- Deposit-pending appointments where the deposit window has expired

Each job is idempotent — it checks a `reminder_sent_log` table before sending.

### Payment flow
```
Booking confirmed
      ↓
deposit_required? ──yes──→ Generate Paystack link → Send via WhatsApp
      ↓ no                        ↓
appointment.payment_status    appointment.payment_status = deposit_pending
= unpaid                           ↓
                          Paystack webhook → payment_status = deposit_paid
                                   ↓
                          appointment.status = confirmed
```

### Invoice lifecycle
```
Appointment completed → Invoice auto-created (draft)
Owner reviews → sends → Invoice status = sent
Due date arrives → status = due → reminder sent
Overdue → status = overdue → escalating reminders
Payment received (webhook or manual) → status = paid / partially_paid
```

---

## API Routes

| Method | Path | Purpose |
|---|---|---|
| GET | /api/health | Health check |
| GET/POST | /api/webhooks/whatsapp | WhatsApp Cloud API webhook |
| POST | /api/webhooks/paystack | Paystack payment webhook |
| POST | /api/cron/reminders | Appointment reminder jobs (secured by x-cron-secret) |
| POST | /api/cron/overdue | Invoice overdue sequence jobs |
| POST | /api/cron/deposits | Deposit slot auto-release jobs |
| GET | /api/businesses/[id] | Get business details |
| POST | /api/appointments | Create appointment |
| PATCH | /api/appointments/[id] | Update appointment status |
| GET | /api/appointments | List appointments (with filters) |
| POST | /api/invoices | Create invoice |
| PATCH | /api/invoices/[id] | Update invoice |
| GET | /api/customers | List customers |
| POST | /api/customers | Create customer |

---

## Components and Interfaces

### Next.js App Router Structure

```
app/
  (auth)/
    login/page.tsx
    signup/page.tsx
  (dashboard)/
    layout.tsx                  — sidebar, auth guard
    page.tsx                    — overview / stats
    appointments/page.tsx       — calendar + list view
    customers/page.tsx          — customer directory
    invoices/page.tsx           — invoice list
    invoices/[id]/page.tsx      — invoice detail
    settings/
      page.tsx                  — business profile
      staff/page.tsx            — staff management
      services/page.tsx         — service catalogue
      templates/page.tsx        — message templates
  api/
    health/route.ts
    webhooks/whatsapp/route.ts
    webhooks/paystack/route.ts
```

### Server Actions

| Action | File | Purpose |
|---|---|---|
| createAppointment | actions/appointments.ts | Validate slot, insert row, trigger confirmation |
| updateAppointmentStatus | actions/appointments.ts | Status transition + side-effects |
| createInvoice | actions/invoices.ts | Auto-number, insert, optional send |
| sendInvoice | actions/invoices.ts | Status → sent, send WhatsApp message |
| createPaymentLink | actions/payments.ts | Call Paystack API, insert payment_request |
| upsertCustomer | actions/customers.ts | Find-or-create by phone + business_id |

### WhatsApp Webhook Handler Interface

```typescript
// app/api/webhooks/whatsapp/route.ts
POST body: WhatsAppWebhookPayload  // Meta Cloud API format
→ verifySignature(req)
→ parseInboundMessage(payload): InboundMessage
→ resolveBusinessByPhone(wabaNumber): Business
→ getOrCreateSession(businessId, customerPhone): ConversationSession
→ handleState(session, message): { nextState, outboundMessages[] }
→ persistSession(session)
→ sendMessages(outboundMessages[])
```

### Paystack Webhook Handler Interface

```typescript
POST body: PaystackEvent
→ verifySignature(req, PAYSTACK_SECRET)
→ handleChargeSuccess(event): update payment_request + appointment/invoice status
```

---

## Data Models

> The full column-level schema is defined in the [Data Model](#data-model) section above. This section describes TypeScript types used in application code.

```typescript
type AppointmentStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show'
type PaymentStatus = 'unpaid' | 'deposit_pending' | 'deposit_paid' | 'paid' | 'partially_paid' | 'refunded'
type InvoiceStatus = 'draft' | 'sent' | 'due' | 'overdue' | 'partially_paid' | 'paid' | 'cancelled' | 'disputed'
type ConversationState = 'idle' | 'awaiting_service' | 'awaiting_slot' | 'awaiting_confirmation' | 'awaiting_deposit' | 'human_handoff'

interface ConversationContext {
  selectedServiceId?: string
  selectedSlot?: string        // ISO 8601
  selectedStaffId?: string
  pendingDepositAmount?: number
  retryCount?: number
}

interface InboundMessage {
  from: string                 // E.164
  wabaNumber: string           // receiving WABA number
  messageId: string
  type: 'text' | 'interactive' | 'button'
  text?: string
  buttonPayload?: string
  timestamp: Date
}

interface AvailableSlot {
  startAt: Date
  endAt: Date
  staffId: string | null
}
```

---

## Correctness Properties

- **Idempotent reminders** — before sending any reminder, the scheduler checks `reminder_sent_log` for an existing entry keyed on `(business_id, trigger, reference_id)`. Duplicate sends are impossible even if the cron fires twice.
- **Slot double-booking prevention** — slot availability is computed inside a Postgres transaction with a row-level lock on the appointments table for the relevant staff/time window. A unique partial index on `(business_id, staff_id, start_at)` where `status NOT IN ('cancelled')` enforces this at the DB level.
- **RLS as primary isolation** — every Supabase query runs under the authenticated user's JWT. RLS policies on every table ensure cross-tenant data access is impossible regardless of application bugs.
- **Webhook signature verification** — both WhatsApp and Paystack webhooks verify HMAC signatures before processing. Requests with invalid signatures return 401 immediately.
- **Session expiry** — conversation sessions with `expires_at < now()` are treated as `idle` regardless of stored state, preventing stale flows from resuming incorrectly.

---

## Error Handling

| Scenario | Handling |
|---|---|
| WhatsApp webhook signature invalid | Return 403, log warning, no processing |
| Paystack webhook signature invalid | Return 401, log warning, no processing |
| Inbound message for unknown business | Return 200 (to silence Meta retries), log and discard |
| Slot no longer available at confirmation | Reply to customer with "slot taken", reset to `awaiting_slot` |
| Paystack link creation failure | Log error, set `payment_status = unpaid`, notify owner via dashboard alert |
| Supabase query error in webhook | Return 500, Meta will retry; handler is idempotent via `provider_message_id` dedup |
| Reminder job failure | Log to `reminder_error_log`, retry on next cron tick (5 min), alert after 3 consecutive failures |
| Session expired mid-flow | Reset to `idle`, send "session expired" message, prompt customer to start again |
| Invalid customer input (3× retry) | Transition to `human_handoff`, notify staff via dashboard |

---

## Testing Strategy

- **Unit tests** — pure functions: state machine transitions, slot availability computation, template variable substitution, invoice number generation. Run with Vitest.
- **Integration tests** — Server Actions tested against a local Supabase instance (Docker). Covers RLS enforcement, appointment creation with conflict detection, and invoice lifecycle transitions.
- **Webhook handler tests** — mock Meta and Paystack payloads exercising each conversation state and payment event. Signature verification tested with valid and tampered payloads.
- **E2E tests** — Playwright covers the critical dashboard flows: login → create appointment, send invoice, mark paid.
- **Cron job tests** — reminder scheduler tested with seeded appointments/invoices at known relative timestamps to verify correct trigger selection and idempotency.
| POST | /api/webhooks/paystack | Paystack payment webhook |
| GET | /auth/callback | Supabase OAuth callback |

All business data mutations go through **Server Actions** (not REST endpoints) to keep auth context server-side and leverage Next.js form handling.

---

## Folder Structure

```
src/
├── proxy.ts                    # Auth routing (Next.js 16)
├── app/
│   ├── (auth)/                 # login, signup — no dashboard shell
│   ├── (dashboard)/            # protected — sidebar layout
│   │   ├── dashboard/          # today view
│   │   ├── bookings/
│   │   ├── invoices/
│   │   ├── customers/
│   │   ├── messages/
│   │   └── settings/
│   ├── api/
│   │   ├── health/
│   │   └── webhooks/
│   │       ├── whatsapp/
│   │       └── paystack/
│   └── auth/callback/
├── components/
│   ├── ui/                     # Button, Input, Badge, etc.
│   └── layout/                 # SidebarNav, Header
├── lib/
│   ├── supabase/               # server.ts, client.ts
│   ├── whatsapp/               # messaging client abstraction
│   ├── payments/               # payment provider abstraction
│   ├── availability/           # slot calculation engine
│   └── utils.ts
├── actions/                    # Server Actions (auth, bookings, invoices, etc.)
└── types/
    ├── index.ts                # domain types
    └── database.ts             # generated Supabase types
```

---

## WhatsApp Provider Abstraction

```typescript
interface MessagingProvider {
  sendText(to: string, body: string): Promise<{ messageId: string }>
  sendTemplate(to: string, template: string, params: string[]): Promise<{ messageId: string }>
}
```

The concrete `WhatsAppCloudProvider` implements this interface. Swapping to a BSP requires only a new implementation — no business logic changes.

## Payment Provider Abstraction

```typescript
interface PaymentProvider {
  createPaymentLink(params: CreateLinkParams): Promise<{ url: string; reference: string }>
  verifyWebhook(payload: unknown, signature: string): boolean
  getPaymentStatus(reference: string): Promise<PaymentStatus>
}
```
