# Design — WhatsApp Front Desk

## Overview

WhatsApp Front Desk is a multi-tenant SaaS. Each business is a fully isolated tenant. The system has three main surfaces: the admin dashboard (Next.js), the WhatsApp conversation layer (webhook + state machine), and the background job layer (reminders, overdue checks).

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Vercel (Frontend)                    │
│  Next.js App Router — Server Components + Server Actions │
│  Route Handlers — API + Webhooks                         │
└────────────────────────┬────────────────────────────────┘
                         │ HTTPS
┌────────────────────────▼────────────────────────────────┐
│                  Supabase                                │
│  PostgreSQL (RLS multi-tenancy)                          │
│  Auth (email/password, magic link)                       │
│  Storage (invoice PDFs, branding assets)                 │
│  Edge Functions (scheduled jobs — reminders, overdue)    │
└──────────┬──────────────────────────┬───────────────────┘
           │                          │
┌──────────▼──────────┐   ┌───────────▼──────────────────┐
│  WhatsApp Cloud API  │   │  Paystack (payment links,     │
│  (Meta direct)       │   │  webhooks, status updates)    │
└─────────────────────┘   └──────────────────────────────┘
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
Supabase `pg_cron` runs every 5 minutes and queries for:
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
