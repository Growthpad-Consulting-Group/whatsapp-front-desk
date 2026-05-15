# WhatsApp Front Desk

A lightweight SaaS for solo and small service businesses that use WhatsApp as their primary customer channel. The system automates booking conversations, appointment reminders, deposit collection, invoicing, and overdue payment follow-up — without requiring customers to download an app or create an account.

> **Status:** Week 1 complete — scaffold, routing, types, and spec documents in place. Active development in progress.

---

## What it does

A customer sends a WhatsApp message. The system handles the rest.

```
Customer: "Hi, I'd like to book a haircut"
Bot:      "Great! Available times for Haircut (45 min):
           1) Tue 10:00  2) Tue 14:30  3) Wed 09:00
           Reply 1, 2, or 3."
Customer: "2"
Bot:      "Confirmed for Tuesday at 14:30. To secure your slot,
           please pay the deposit of GHS 50 here: [link]"
           
— 24 hours before —
Bot:      "Reminder: your appointment is tomorrow at 14:30.
           Reply R to reschedule or C to cancel."

— After service —
Bot:      "Thanks for visiting! Your invoice for GHS 200 is ready: [link]"

— If unpaid after due date —
Bot:      "Friendly reminder: invoice #0042 for GHS 200 is still unpaid.
           Pay here: [link]"
```

The business owner sees all of this in a clean dashboard — bookings, invoices, customers, messages — and never has to chase a client manually.

---

## Target users

Solo and small service businesses that already use WhatsApp to talk to clients:

- Beauty and wellness (salons, spas, nail techs)
- Tutors and coaches
- Personal trainers
- Repair services
- Photographers
- Consultants and freelancers

---

## Core features

| Feature | Description |
|---|---|
| **WhatsApp booking** | Customers book via WhatsApp conversation — no app, no account |
| **Availability engine** | Prevents double booking, respects buffer times and operating hours |
| **Google Calendar sync** | Syncs confirmed appointments, blocks busy periods |
| **Automated reminders** | Confirmation, 24h reminder, 2h reminder — configurable per business |
| **Deposits** | Payment link sent on booking, slot held pending until paid |
| **Invoices** | Auto-generated on completion, shareable page + PDF |
| **Collections** | Escalating overdue reminders with payment promise support |
| **Dashboard** | Today view, bookings, invoices, customers, message log |
| **Multi-tenant** | Each business is fully isolated — data never crosses tenants |

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router), TypeScript, Tailwind CSS v4 |
| Backend | Next.js Server Actions + Route Handlers |
| Database | PostgreSQL via Supabase (RLS multi-tenancy) |
| Auth | Supabase Auth (email/password, magic link) |
| Messaging | WhatsApp Cloud API (Meta direct) |
| Payments | Paystack (primary), Stripe (planned) |
| Scheduler | cron-job.org → secured `/api/cron/*` routes (reminders, overdue checks) |
| Storage | Supabase Storage (invoice PDFs, branding) |
| Hosting | Vercel (frontend) + Supabase (DB, auth, jobs) |

---

## Project structure

```
whatsapp-front-desk/
├── src/
│   ├── proxy.ts                        # Auth routing (Next.js 16)
│   ├── app/
│   │   ├── (auth)/                     # Public: login, signup
│   │   ├── (dashboard)/                # Protected: all dashboard views
│   │   │   ├── dashboard/              # Today view
│   │   │   ├── bookings/
│   │   │   ├── invoices/
│   │   │   ├── customers/
│   │   │   ├── messages/
│   │   │   └── settings/
│   │   ├── api/
│   │   │   ├── health/                 # GET /api/health
│   │   │   └── webhooks/
│   │   │       ├── whatsapp/           # WhatsApp Cloud API webhook
│   │   │       └── paystack/           # Payment webhook (week 5)
│   │   └── auth/callback/              # Supabase OAuth callback
│   ├── components/
│   │   ├── ui/                         # Button, Input, Badge
│   │   └── layout/                     # SidebarNav
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── server.ts               # Server Components, Actions, Route Handlers
│   │   │   └── client.ts               # Client Components only
│   │   ├── whatsapp/                   # Messaging provider abstraction (week 3)
│   │   ├── payments/                   # Payment provider abstraction (week 5)
│   │   ├── availability/               # Slot calculation engine (week 3)
│   │   └── utils.ts                    # cn(), formatCurrency(), formatDate()
│   ├── actions/                        # Server Actions (week 2+)
│   └── types/
│       ├── index.ts                    # All domain types
│       └── database.ts                 # Generated Supabase types (replace after setup)
├── .kiro/
│   ├── specs/whatsapp-front-desk/
│   │   ├── requirements.md             # Full product requirements
│   │   ├── design.md                   # Data model, architecture, state machines
│   │   └── tasks.md                    # 6-week task breakdown
│   └── steering/
│       └── project.md                  # Coding conventions for AI agents
├── .env.local.example                  # All required environment variables
└── package.json
```

---

## Getting started

### Prerequisites

- Node.js 20.9+
- A [Supabase](https://supabase.com) project
- A [Meta developer account](https://developers.facebook.com) with WhatsApp Business API access
- A [Paystack](https://paystack.com) account

### 1. Clone and install

```bash
git clone https://github.com/kwamevaughan/whatsapp-front-desk.git
cd whatsapp-front-desk
npm install
```

### 2. Configure environment variables

```bash
cp .env.local.example .env.local
```

Open `.env.local` and fill in:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# WhatsApp Cloud API
WHATSAPP_PHONE_NUMBER_ID=your-phone-number-id
WHATSAPP_ACCESS_TOKEN=your-access-token
WHATSAPP_WEBHOOK_VERIFY_TOKEN=your-random-verify-token

# Paystack
PAYSTACK_SECRET_KEY=sk_live_...
PAYSTACK_PUBLIC_KEY=pk_live_...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Set up the database

Once the schema migration is written (week 2), run:

```bash
npx supabase db push
```

Then generate TypeScript types:

```bash
npx supabase gen types typescript --project-id <your-project-id> > src/types/database.ts
```

### 4. Run locally

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000). You'll be redirected to `/login`.

---

## Environment variables reference

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key — server only, never expose to client |
| `WHATSAPP_PHONE_NUMBER_ID` | Yes | Meta WhatsApp phone number ID |
| `WHATSAPP_ACCESS_TOKEN` | Yes | Meta permanent access token |
| `WHATSAPP_WEBHOOK_VERIFY_TOKEN` | Yes | Token you choose for webhook verification handshake |
| `PAYSTACK_SECRET_KEY` | Yes | Paystack secret key |
| `PAYSTACK_PUBLIC_KEY` | Yes | Paystack public key |
| `NEXT_PUBLIC_APP_URL` | Yes | Full URL of the app (used for invoice links, OAuth callbacks) |
| `CRON_SECRET` | Yes | Random secret — set as `x-cron-secret` header in cron-job.org |

---

## WhatsApp webhook setup

The webhook endpoint is `POST /api/webhooks/whatsapp`.

In your Meta app dashboard:
1. Set the callback URL to `https://your-domain.com/api/webhooks/whatsapp`
2. Set the verify token to match `WHATSAPP_WEBHOOK_VERIFY_TOKEN`
3. Subscribe to the `messages` webhook field

The `GET` handler responds to Meta's verification challenge automatically.

---

## Data model summary

Ten core tables, all scoped to `business_id`:

| Table | Purpose |
|---|---|
| `businesses` | Tenant root — profile, timezone, currency, WhatsApp number |
| `staff_members` | Staff linked to a business and optionally to auth users |
| `customers` | Clients identified by phone number (E.164) |
| `services` | Bookable services with duration, price, deposit rules |
| `appointments` | Bookings with status and payment state |
| `invoices` | Payment requests with full lifecycle status |
| `payment_requests` | Provider-specific payment links and webhook references |
| `reminder_rules` | Configurable trigger/timing/template rules per business |
| `message_templates` | Editable WhatsApp message bodies with variable support |
| `message_logs` | Full inbound/outbound message audit trail |
| `conversation_sessions` | Per-customer WhatsApp conversation state |

Full schema with column types is in [`.kiro/specs/whatsapp-front-desk/design.md`](.kiro/specs/whatsapp-front-desk/design.md).

---

## Build milestones

| Week | Focus | Status |
|---|---|---|
| 1 | Scaffold, routing, types, spec documents | ✅ Done |
| 2 | Business onboarding, service setup, auth forms | 🔲 Next |
| 3 | WhatsApp booking flow, conversation state machine | 🔲 |
| 4 | Google Calendar sync, reminder scheduler | 🔲 |
| 5 | Invoices, payments, deposit flow, collections | 🔲 |
| 6 | Dashboard polish, security review, pilot prep | 🔲 |

Full task breakdown: [`.kiro/specs/whatsapp-front-desk/tasks.md`](.kiro/specs/whatsapp-front-desk/tasks.md)

---

## Key conventions

- **Server Components by default.** Add `"use client"` only when you need state, event handlers, or browser APIs.
- **`params` and `searchParams` are Promises** in Next.js 16 — always `await` them in pages and layouts.
- **Every database query must include `business_id`.** Supabase RLS enforces this at the DB level; application code adds it as a second layer.
- **Use `cn()` for all className merging** — imported from `@/lib/utils`.
- **Supabase clients:** use `src/lib/supabase/server.ts` in Server Components, Actions, and Route Handlers; use `src/lib/supabase/client.ts` in Client Components only.
- **Never commit `.env.local`** or any file containing real secrets.

---

## Scripts

```bash
npm run dev      # Start development server (Turbopack)
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint
```

---

## Deployment

### Vercel

1. Connect the GitHub repo to a new Vercel project
2. Add all environment variables from `.env.local.example` in the Vercel dashboard
3. Set `NEXT_PUBLIC_APP_URL` to your production domain
4. Deploy — Vercel handles the rest

### Supabase

1. Create a production Supabase project
2. Run migrations: `npx supabase db push --project-ref <ref>`
3. Enable RLS on all tables (enforced by migration)
4. Configure cron-job.org to hit `/api/cron/reminders` and `/api/cron/overdue` every 5 minutes (see Scheduler section below)

---

## Scheduler (cron-job.org)

Reminders and overdue checks run via [cron-job.org](https://cron-job.org) hitting secured API routes every 5 minutes. No Supabase Pro plan or Redis required.

**How it works:**

1. cron-job.org sends a `POST` request to your endpoint with a secret header
2. The route handler queries Postgres for due jobs (reminders to send, overdue invoices, expired deposit slots)
3. Jobs are processed and logged — idempotency is enforced via a `reminder_sent_log` table

**Endpoints (built in week 4–5):**

| Endpoint | Trigger | Runs every |
|---|---|---|
| `POST /api/cron/reminders` | Appointment reminders (24h, 2h, confirmation) | 5 min |
| `POST /api/cron/overdue` | Invoice overdue sequence | 5 min |
| `POST /api/cron/deposits` | Release unpaid deposit slots after timeout | 5 min |

**Security:** Every cron endpoint checks for the `x-cron-secret` header matching `CRON_SECRET` in your environment. Requests without it return 401.

**Why not pg_cron or BullMQ?**
- pg_cron requires Supabase Pro ($25/mo) — unnecessary at pilot scale
- BullMQ + Redis (Upstash) adds cost and operational overhead — not needed until hundreds of businesses
- cron-job.org free tier handles this comfortably and keeps all logic in app code where it's easy to test and debug

**Add to `.env.local`:**
```env
CRON_SECRET=your-random-secret-string
```

**cron-job.org setup:**
1. Create a free account at [cron-job.org](https://cron-job.org)
2. Add three jobs pointing to your production URL
3. Set execution interval to every 5 minutes
4. Add a custom request header: `x-cron-secret: your-secret`

---

## Spec documents

| Document | Contents |
|---|---|
| [`requirements.md`](.kiro/specs/whatsapp-front-desk/requirements.md) | 50+ requirements across 14 groups — the full product contract |
| [`design.md`](.kiro/specs/whatsapp-front-desk/design.md) | Architecture, data model, state machines, API routes, provider abstractions |
| [`tasks.md`](.kiro/specs/whatsapp-front-desk/tasks.md) | 6-week task breakdown with backlog |

---

## License

Private — GCG Internal Tools. Not licensed for public use.
