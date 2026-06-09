# Implementation Plan: WhatsApp Front Desk

## Overview

Implementation is split into 6 weekly milestones followed by a post-MVP backlog. Each week builds on the previous: foundation → onboarding → WhatsApp flow → calendar/reminders → payments/invoices → polish/pilot.

## Task Dependency Graph

```json
{
  "waves": [
    { "wave": 1, "label": "Foundation", "tasks": ["1.1","1.2","1.3","1.4","1.5","1.6","1.7","1.8","1.9","1.10","1.11","1.12"] },
    { "wave": 2, "label": "Business Onboarding and Service Setup", "dependsOn": [1], "tasks": ["2.1","2.2","2.3","2.4","2.5","2.6","2.7","2.8","2.9","2.10","2.11"] },
    { "wave": 3, "label": "WhatsApp Booking Flow", "dependsOn": [2], "tasks": ["3.1","3.2","3.3","3.4","3.5","3.6","3.7","3.8","3.9","3.10","3.11","3.12"] },
    { "wave": 4, "label": "Calendar Sync and Reminders", "dependsOn": [3], "tasks": ["4.1","4.2","4.3","4.4","4.5","4.5a","4.6","4.7","4.8","4.9","4.10","4.11","4.12"] },
    { "wave": 5, "label": "Invoices, Payments, and Collections", "dependsOn": [3,4], "tasks": ["5.1","5.2","5.3","5.4","5.5","5.6","5.7","5.8","5.9","5.10","5.11","5.12","5.13"] },
    { "wave": 6, "label": "Dashboard Polish, Security, and Pilot Prep", "dependsOn": [4,5], "tasks": ["6.1","6.2","6.3","6.4","6.5","6.6","6.7","6.8","6.9","6.10","6.11","6.12","6.13","6.14"] }
  ]
}
```

---

## Week 1 — Foundation ✅ Complete

- [x] 1.1 Scaffold Next.js 16 project (App Router, TypeScript, Tailwind CSS v4)
- [x] 1.2 Configure Supabase SSR client (server + browser)
- [x] 1.3 Set up proxy.ts auth routing with public/protected route split
- [x] 1.4 Define all domain types from product brief (src/types/index.ts)
- [x] 1.5 Create route groups: (auth) and (dashboard)
- [x] 1.6 Scaffold all dashboard page shells (bookings, invoices, customers, messages, settings)
- [x] 1.7 Build base UI components: Button, Input, Badge, SidebarNav
- [x] 1.8 Add WhatsApp webhook route handler (GET verification + POST receiver)
- [x] 1.9 Add Supabase auth callback route
- [x] 1.10 Write .env.local.example with all required variables
- [x] 1.11 Write project steering file and spec documents
- [x] 1.12 Initial commit and push to GitHub

---

## Week 2 — Business Onboarding and Service Setup ✅ Complete

- [x] 2.1 Create Supabase project and run initial schema migration (all tables from design.md)
- [x] 2.2 Enable RLS on all tables and write policies scoped to business_id
- [x] 2.3 Build signup flow: email/password form → create auth user → create business row
- [x] 2.4 Build login form with email/password and magic link options
- [x] 2.5 Build onboarding wizard: business name → timezone → currency → WhatsApp number
- [x] 2.6 Build services CRUD: create, edit, deactivate service with all fields from data model
- [x] 2.7 Build staff member management: add, edit, deactivate staff
- [x] 2.8 Build operating hours editor (per-day open/close times, closed toggle)
- [x] 2.9 Build settings page: business profile, cancellation policy, deposit defaults
- [x] 2.10 Write Server Actions for all business/service/staff mutations
- [x] 2.11 Seed default reminder rules and templates for each new business on signup

---

## Week 3 — WhatsApp Booking Flow ✅ Complete

- [x] 3.1 Implement WhatsApp Cloud API client (send text, send template)
- [x] 3.2 Implement conversation session table and state machine
- [x] 3.3 Build webhook POST handler: parse incoming message → load session → route to state handler
- [x] 3.4 Implement state: idle → greeting → service selection (numbered list)
- [x] 3.5 Implement state: service selected → availability engine → slot presentation (3–5 slots)
- [x] 3.6 Build availability engine: operating hours + existing appointments + buffer times
- [x] 3.7 Implement state: slot selected → create appointment → send confirmation
- [x] 3.8 Implement human handoff: flag session, notify owner via dashboard
- [x] 3.9 Implement fallback message for unrecognised input (3× retry → handoff)
- [x] 3.10 Log all inbound and outbound messages to message_logs
- [x] 3.11 Validate WhatsApp webhook signature (X-Hub-Signature-256)
- [x] 3.12 Build messages dashboard view: log, failed messages, handoff queue

---

## Week 4 — Calendar Sync and Reminders ✅ Complete

- [x] 4.1 Implement Google Calendar OAuth flow (connect/disconnect per staff member)
- [x] 4.2 Sync confirmed appointments to Google Calendar on creation and update
- [x] 4.3 Fetch Google Calendar busy periods and incorporate into availability engine
- [x] 4.4 Handle Google Calendar sync errors gracefully (log, don't block booking)
- [x] 4.5 Build `/api/cron/reminders` route secured by `x-cron-secret` header
- [x] 4.5a Add `CRON_SECRET` to env vars; configure cron-job.org to hit all three cron routes every 5 min
- [x] 4.6 Implement reminder: booking confirmation (immediate on creation)
- [x] 4.7 Implement reminder: 24-hour before appointment
- [x] 4.8 Implement reminder: 2-hour before appointment
- [x] 4.9 Implement reminder sent log to ensure idempotency
- [x] 4.10 Implement reschedule flow: customer replies R → new slot selection → update appointment
- [x] 4.11 Implement cancellation flow: customer replies C → check policy → cancel → free slot
- [x] 4.12 Build bookings dashboard view: list with filters by staff/service/status/date

---

## Week 5 — Invoices, Payments, and Collections ✅ Complete

- [x] 5.1 Implement Paystack payment link generation
- [x] 5.2 Implement Paystack webhook handler: verify signature → update payment status
- [x] 5.3 Implement deposit flow: send payment link after booking → hold slot as pending
- [x] 5.4 Build `/api/cron/deposits` route: release unpaid deposit slots after timeout
- [x] 5.5 Build invoice auto-creation on appointment completion (via `/api/cron/overdue`)
- [x] 5.6 Build invoice manual creation from dashboard
- [x] 5.7 Build shareable invoice page (`/invoice/[id]`)
- [x] 5.8 Build invoices dashboard view with status filters
- [x] 5.9 Build `/api/cron/overdue` route: due-date reminder, overdue 1–3 days, overdue 4–7 days
- [x] 5.10 Implement payment promise: record date, pause overdue sequence
- [x] 5.11 Implement partial payment tracking: update outstanding balance
- [x] 5.12 Build manual payment marking UI (paid, partially paid, cancelled, disputed)
- [x] 5.13 Implement payment provider abstraction interface (`src/lib/payments/provider.ts`)

---

## Week 6 — Dashboard Polish, Security, and Pilot Prep ✅ Complete

- [x] 6.1 Build today dashboard view: appointments today, pending deposits, stat cards
- [x] 6.2 Build customers view: searchable list, last booking, unpaid balance
- [x] 6.3 Build customer detail page: booking history, invoice history, message log
- [x] 6.4 Build message template editor with variable preview
- [x] 6.5 Implement WhatsApp template approval status tracking
- [x] 6.6 Add audit log table + logging for: booking.cancelled, booking.rescheduled, invoice.sent, invoice.payment_recorded
- [x] 6.7 Security review: every Server Action validates business_id from session via requireBusiness(); never from client input
- [x] 6.8 Encrypt sensitive tokens at rest — ENCRYPTION_SECRET env var + AES-256-CBC in src/lib/crypto/encrypt.ts; wired into Google OAuth token storage
- [x] 6.9 Add error boundaries (error.tsx, global-error.tsx) and loading skeletons (loading.tsx) to all dashboard routes
- [x] 6.10 Performance: additional DB indexes in migration 004 (appointments, invoices, message_logs, sessions, reminder_sent_log)
- [x] 6.11 Pilot onboarding checklist built into today dashboard (auto-hides when complete)
- [x] 6.12 Deployment guide written: docs/deployment.md (Supabase, Vercel, WhatsApp, Paystack, Google Cal, Cloudflare, cron-job.org)
- [x] 6.13 GitHub Actions CI: .github/workflows/ci.yml — lint + typecheck + build on every push/PR to main
- [x] 6.14 Pilot seed script: scripts/seed-demo.mjs — run `npm run seed:demo` after first signup to populate dashboard with KE demo data

---

## Notes

- Run `npm run gen:types` after every schema migration (requires Supabase personal access token + CLI login)
- All database mutations must validate `business_id` from the authenticated session — never trust client input
- WhatsApp webhook signature validation (3.11) must be verified before exposing the webhook URL to Meta in production
- Google Calendar sync is an enhancement — booking flow works fully without it
- Payment provider abstraction is in place — adding Stripe/Flutterwave only requires a new class implementing `PaymentProvider`

---

## Backlog (Post-MVP)

- [ ] B.1 Stripe payment provider implementation
- [ ] B.2 Flutterwave payment provider implementation
- [ ] B.3 Multi-staff calendar views
- [ ] B.4 Mobile-responsive dashboard improvements
- [ ] B.5 Bulk invoice actions (send all, mark all paid)
- [ ] B.6 Analytics: bookings per week, revenue, no-show rate, reminder effectiveness
- [ ] B.7 Customer-facing booking portal (web, no WhatsApp required)
- [ ] B.8 SMS fallback for reminders when WhatsApp is unavailable
- [ ] B.9 Multi-language message templates
- [ ] B.10 Subscription billing (Stripe for SaaS billing)
- [ ] B.11 Team roles and permissions (staff can only see their own bookings)
- [ ] B.12 Waitlist management for fully booked slots
- [ ] B.13 Upstash Redis for conversation session caching and rate limiting (when 100+ businesses active)
- [ ] B.14 Invoice PDF generation (server-side, download link)
- [ ] B.15 Seed script for demo data (sign up → run to populate dashboard with realistic KE data)
