---
inclusion: always
---

# WhatsApp Front Desk — Project Steering

## What this is
A multi-tenant SaaS for small service businesses. Businesses connect a WhatsApp number, set up services and availability, and the system handles booking conversations, reminders, invoices, and payment follow-up automatically.

## Stack
- **Frontend**: Next.js (App Router), TypeScript, Tailwind CSS v4
- **Backend**: Next.js Route Handlers + Server Actions
- **Database**: PostgreSQL via Supabase (RLS for multi-tenancy)
- **Auth**: Supabase Auth (email/password + magic link)
- **Messaging**: WhatsApp Cloud API (Meta direct)
- **Payments**: Paystack (primary for Kenya/KES + M-Pesa), Stripe (future international)
- **Hosting**: Vercel (frontend), Supabase (DB + auth)

## Key conventions
- All files live under `src/`
- Route groups: `(auth)` for login/signup, `(dashboard)` for protected app
- Server Components by default; add `"use client"` only when needed (state, events, browser APIs)
- `params` and `searchParams` in pages/layouts are **Promises** — always `await` them
- **Default currency**: `KES` (Kenya launch). Currency is a per-business setting — Ghana uses `GHS`, Nigeria uses `NGN`, USD for international clients. Never hardcode a currency symbol.
- **Scheduler**: cron-job.org (free) hits `/api/cron/*` routes every 5 min. All cron routes require `x-cron-secret` header matching `CRON_SECRET` env var — return 401 otherwise.
- Auth-aware routing lives in `src/proxy.ts` (Next.js 16 renamed `middleware` → `proxy`; export named `proxy`, not `middleware`)
- Supabase server client: `src/lib/supabase/server.ts` (Server Components, Actions, Route Handlers)
- Supabase browser client: `src/lib/supabase/client.ts` (Client Components only)
- Every query must be scoped to `business_id` — never return cross-tenant data
- Use `src/types/index.ts` for domain types; `src/types/database.ts` for generated Supabase types
- Utility functions in `src/lib/utils.ts`; use `cn()` for all className merging
- API routes live at `src/app/api/`; webhook handlers at `src/app/api/webhooks/`

## Multi-tenancy rule
Every database query **must** include a `business_id` filter. Supabase RLS policies enforce this at the DB level, but always filter in application code too as a second layer.

## Environment variables
Copy `.env.local.example` to `.env.local` and fill in values before running locally.
Never commit `.env.local` or any file containing real secrets.

## Running locally
```bash
npm run dev
```
Visit http://localhost:3000
