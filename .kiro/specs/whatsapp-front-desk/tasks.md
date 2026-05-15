# Implementation Plan: WhatsApp Front Desk

## Overview

Implementation is split into 6 weekly milestones followed by a post-MVP backlog. Each week builds on the previous: foundation → onboarding → WhatsApp flow → calendar/reminders → payments/invoices → polish/pilot.

## Task Dependency Graph

```json
{
  "waves": [
    {
      "wave": 1,
      "label": "Foundation",
      "tasks": ["1.1", "1.2", "1.3", "1.4", "1.5", "1.6", "1.7", "1.8", "1.9", "1.10", "1.11", "1.12"]
    },
    {
      "wave": 2,
      "label": "Business Onboarding and Service Setup",
      "dependsOn": [1],
      "tasks": ["2.1", "2.2", "2.3", "2.4", "2.5", "2.6", "2.7", "2.8", "2.9", "2.10", "2.11"]
    },
    {
      "wave": 3,
      "label": "WhatsApp Booking Flow",
      "dependsOn": [2],
      "tasks": ["3.1", "3.2", "3.3", "3.4", "3.5", "3.6", "3.7", "3.8", "3.9", "3.10", "3.11", "3.12"]
    },
    {
      "wave": 4,
      "label": "Calendar Sync and Reminders",
      "dependsOn": [3],
      "tasks": ["4.1", "4.2", "4.3", "4.4", "4.5", "4.6", "4.7", "4.8", "4.9", "4.10", "4.11", "4.12"]
    },
    {
      "wave": 5,
      "label": "Invoices, Payments, and Collections",
      "dependsOn": [3, 4],
      "tasks": ["5.1", "5.2", "5.3", "5.4", "5.5", "5.6", "5.7", "5.8", "5.9", "5.10", "5.11", "5.12", "5.13"]
    },
    {
      "wave": 6,
      "label": "Dashboard Polish, Security, and Pilot Prep",
      "dependsOn": [4, 5],
      "tasks": ["6.1", "6.2", "6.3", "6.4", "6.5", "6.6", "6.7", "6.8", "6.9", "6.10", "6.11", "6.12", "6.13", "6.14"]
    }
  ],
  "keyDependencies": [
    { "from": "2.1", "to": "2.2", "note": "Schema migration must precede RLS policies" },
    { "from": "3.2", "to": "3.3", "note": "State machine must precede webhook handler" },
    { "from": "3.6", "to": "4.3", "note": "Availability engine must precede Google Calendar busy period integration" },
    { "from": "4.9", "to": "5.9", "note": "Reminder idempotency log must precede collections scheduler" },
    { "from": "5.1", "to": "5.2", "note": "Paystack client must precede webhook handler" },
    { "from": "5.1", "to": "5.3", "note": "Paystack client must precede deposit flow" }
  ]
}
```

## Tasks

## Week 1 — Foundation (current)

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

## Week 2 — Business Onboarding and Service Setup

- [ ] 2.1 Create Supabase project and run initial schema migration (all tables from design.md)
- [ ] 2.2 Enable RLS on all tables and write policies scoped to business_id
- [ ] 2.3 Build signup flow: email/password form → create auth user → create business row
- [ ] 2.4 Build login form with email/password and magic link options
- [ ] 2.5 Build onboarding wizard: business name → timezone → currency → WhatsApp number → operating hours
- [ ] 2.6 Build services CRUD: create, edit, deactivate service with all fields from data model
- [ ] 2.7 Build staff member management: add, edit, deactivate staff
- [ ] 2.8 Build operating hours editor (per-day open/close times, closed toggle)
- [ ] 2.9 Build settings page: cancellation policy, deposit defaults
- [ ] 2.10 Write Server Actions for all business/service/staff mutations
- [ ] 2.11 Seed default reminder rules for each new business on signup

---

## Week 3 — WhatsApp Booking Flow

- [ ] 3.1 Implement WhatsApp Cloud API client (send text, send template)
- [ ] 3.2 Implement conversation session table and state machine
- [ ] 3.3 Build webhook POST handler: parse incoming message → load session → route to state handler
- [ ] 3.4 Implement state: idle → greeting → service selection (numbered list)
- [ ] 3.5 Implement state: service selected → availability engine → slot presentation (3–5 slots)
- [ ] 3.6 Build availability engine: operating hours + existing appointments + buffer times
- [ ] 3.7 Implement state: slot selected → create appointment → send confirmation
- [ ] 3.8 Implement human handoff: flag session, notify owner via dashboard
- [ ] 3.9 Implement fallback message for unrecognised input
- [ ] 3.10 Log all inbound and outbound messages to message_logs
- [ ] 3.11 Validate WhatsApp webhook signature (X-Hub-Signature-256)
- [ ] 3.12 Build messages dashboard view: log, failed messages, handoff queue

---

## Week 4 — Calendar Sync and Reminders

- [ ] 4.1 Implement Google Calendar OAuth flow (connect/disconnect per staff member)
- [ ] 4.2 Sync confirmed appointments to Google Calendar on creation and update
- [ ] 4.3 Fetch Google Calendar busy periods and incorporate into availability engine
- [ ] 4.4 Handle Google Calendar sync errors gracefully (log, don't block booking)
- [ ] 4.5 Build reminder scheduler using Supabase pg_cron (runs every 5 minutes)
- [ ] 4.6 Implement reminder: booking confirmation (immediate on creation)
- [ ] 4.7 Implement reminder: 24-hour before appointment
- [ ] 4.8 Implement reminder: 2-hour before appointment
- [ ] 4.9 Implement reminder sent log to ensure idempotency
- [ ] 4.10 Implement reschedule flow: customer replies R → new slot selection → update appointment
- [ ] 4.11 Implement cancellation flow: customer replies C → check policy → cancel → free slot
- [ ] 4.12 Build bookings dashboard view: calendar + list, filters by staff/service/status/date

---

## Week 5 — Invoices, Payments, and Collections

- [ ] 5.1 Implement Paystack payment link generation
- [ ] 5.2 Implement Paystack webhook handler: verify signature → update payment status
- [ ] 5.3 Implement deposit flow: send payment link after booking → hold slot as pending
- [ ] 5.4 Implement slot auto-release: pg_cron job releases unpaid deposit slots after timeout
- [ ] 5.5 Build invoice auto-creation on appointment completion
- [ ] 5.6 Build invoice manual creation from dashboard
- [ ] 5.7 Build invoice page (shareable URL) and PDF generation
- [ ] 5.8 Build invoices dashboard view with status filters
- [ ] 5.9 Implement collections scheduler: due-date reminder, overdue 1–3 days, overdue 4–7 days
- [ ] 5.10 Implement payment promise: record date, pause overdue sequence
- [ ] 5.11 Implement partial payment tracking: update outstanding balance, continue reminders
- [ ] 5.12 Build manual payment marking UI (paid, partially paid, cancelled, disputed)
- [ ] 5.13 Implement payment provider abstraction interface (ready for Stripe/Flutterwave)

---

## Week 6 — Dashboard Polish, Security, and Pilot Prep

- [ ] 6.1 Build today dashboard view: appointments today, pending deposits, cancelled, reschedule requests
- [ ] 6.2 Build customers view: searchable list, last booking, unpaid balance, notes
- [ ] 6.3 Build customer detail page: booking history, invoice history, message log
- [ ] 6.4 Build message template editor with variable preview
- [ ] 6.5 Implement WhatsApp template approval status tracking
- [ ] 6.6 Add audit log: booking created, reminder sent, invoice sent, payment changed, cancellation
- [ ] 6.7 Security review: verify RLS policies cover all tables, check for missing business_id filters
- [ ] 6.8 Encrypt sensitive tokens at rest (WhatsApp access token, Google OAuth tokens)
- [ ] 6.9 Add error boundaries and loading states to all dashboard views
- [ ] 6.10 Performance: verify dashboard views load under 2 seconds, add indexes where needed
- [ ] 6.11 Build pilot onboarding checklist (guided setup completion tracker)
- [ ] 6.12 Write deployment guide: Vercel + Supabase production setup
- [ ] 6.13 Set up GitHub CI: lint + build check on every PR
- [ ] 6.14 Pilot: onboard first 3–5 test businesses, monitor for errors

---

## Notes

- All database migrations must be applied to the Supabase project before any feature that depends on the schema is tested
- RLS policies (2.2) must be verified after every new table is added
- WhatsApp webhook signature validation (3.11) must be in place before the webhook is exposed to Meta in production
- Google Calendar sync (Week 4) is an enhancement; the booking flow must work fully without it
- Payment provider abstraction (5.13) should be implemented before adding any second provider
- All Server Actions must validate `business_id` from the authenticated session, never from client input

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
