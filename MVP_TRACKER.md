# WhatsApp Front Desk — MVP Progress Tracker

> Based on dev brief v0.1 | Last updated: 2026-06-10 (sprint 2)

**Legend:** ✅ Done &nbsp;|&nbsp; ⚠️ Partial &nbsp;|&nbsp; ❌ Not built

---

## 1. Business Setup (FR1)

| Feature | Status | Notes |
|---|---|---|
| Business profile (name, industry, WhatsApp number) | ✅ | `settings/page.tsx` → `business-profile-form.tsx` |
| Timezone & currency | ✅ | Stored on `businesses` table, used in all formatting |
| Operating hours | ✅ | `operating-hours-form.tsx`, 7-day toggle with open/close times |
| Cancellation window rule | ✅ | `cancellation_hours` field, enforced in state machine |
| Deposit rule (default %) | ✅ | `deposit_default_percent` on business, per-service override |
| Onboarding flow (< 10 min) | ✅ | `/onboarding` multi-step form |

---

## 2. Service Catalog

| Feature | Status | Notes |
|---|---|---|
| Service name, duration, price | ✅ | Full CRUD in `settings/services` |
| Buffer before / after | ✅ | `buffer_before`, `buffer_after` fields on `services` |
| Staff assignment | ✅ | Service ↔ staff many-to-many via `service_staff` |
| Deposit amount per service | ✅ | `deposit_required`, `deposit_amount` on service |
| Active / inactive toggle | ✅ | `active` flag, inactive services excluded from bot |

---

## 3. WhatsApp Booking Flow (FR3, FR4)

| Feature | Status | Notes |
|---|---|---|
| Inbound message handling & signature verification | ✅ | `api/webhooks/whatsapp/route.ts` |
| Delivery status updates (sent/delivered/read) | ✅ | Parsed from `value.statuses`, written to `message_logs` |
| Customer auto-create on first message | ✅ | State machine upserts customer if not found |
| Service selection menu | ✅ | Numbered list, validates input, 3-retry → human handoff |
| Slot availability check | ✅ | `getAvailableSlots()` engine, scans 7 days forward |
| Double-booking prevention | ✅ | Re-checks slot at confirm step before inserting |
| Booking confirmation message | ✅ | Template-driven, falls back to hardcoded default |
| Session state machine (idle → service → slot → confirm → deposit) | ✅ | 30-min session expiry, persisted in `conversation_sessions` |
| Cancel via "C" reply | ✅ | Respects cancellation window, updates Google Calendar |
| Reschedule via "R" reply | ✅ | Full reschedule flow with slot re-selection |
| Human handoff on 3 failed retries | ✅ | Sets state → `human_handoff`, message sent to customer |
| Human handoff — staff takes over from dashboard | ⚠️ | Messages tab shows handoff queue but UI to "resume bot" needs verification |
| Bot ignores messages during human handoff | ✅ | State machine exits early if `human_handoff` state |
| Reschedule/cancel link in reminders ("R" / "C") | ✅ | Default reminder templates include instructions |

---

## 4. Calendar Integration (FR2)

| Feature | Status | Notes |
|---|---|---|
| Google OAuth connect per staff member | ✅ | `api/auth/google/redirect` + `callback` routes |
| Create Google Calendar event on booking | ✅ | `createGoogleEvent()` called in state machine on confirmation |
| Update event on reschedule | ✅ | `updateGoogleEvent()` or delete+create if staff changed |
| Delete event on cancellation | ✅ | `deleteGoogleEvent()` called on "C" reply |
| Availability engine respects Google Calendar busy times | ⚠️ | Need to verify `getAvailableSlots()` fetches Google busy slots, not just internal appointments |
| Manual availability fallback (no Google) | ✅ | `getAvailableSlots()` works from operating hours if no calendar |

---

## 5. Reminders (FR5)

| Feature | Status | Notes |
|---|---|---|
| Booking confirmation auto-sent | ✅ | Sent inline at end of state machine confirmation step |
| 24-hour reminder | ✅ | `api/cron/reminders` scans 24h window, idempotent via `reminder_sent_log` |
| 2-hour reminder | ✅ | Same cron, separate 2h window |
| Reminder uses business message template | ✅ | Fetches `reminder_rules` + `message_templates`, falls back to default |
| Reminder delivery status logged | ✅ | `provider_message_id` stored, status updated via webhook |
| Deposit timeout notification (15 min) | ✅ | `api/cron/deposits` cancels pending bookings + WhatsApp notify |
| Birthday / anniversary reminders | ✅ | `birthday`/`anniversary` fields on customers, date pickers in customer profile, `api/cron/special-dates` sends annual WhatsApp greetings |

---

## 6. Invoices (FR6, FR8)

| Feature | Status | Notes |
|---|---|---|
| Auto-create draft invoice when appointment completes | ✅ | `api/cron/overdue` auto-completes past appointments + calls `createInvoiceAction()` |
| Manual invoice creation from appointment | ✅ | Bookings page UI |
| Branded invoice page (web) | ✅ | `/invoice/[id]` public page |
| Invoice PDF download | ✅ | Print-to-PDF via `print-button.tsx` |
| Invoice statuses (draft/sent/due/overdue/paid/partial/cancelled) | ✅ | Full status enum in DB + UI |
| Manually mark paid / partially paid / cancelled / disputed | ✅ | `FR8` — invoices page actions |
| Payment link on invoice | ✅ | Paystack link embedded |
| Partial payment tracking (`amount_paid` field) | ✅ | Field exists, updated via Paystack webhook |
| Partial payment UI — record partial payment manually | ✅ | "Record Payment" modal on invoice card lets staff enter any amount |

---

## 7. Payments (FR6, FR7)

| Feature | Status | Notes |
|---|---|---|
| Deposit payment link sent on booking | ✅ | `/pay/deposit/[id]` page, link sent in state machine |
| Paystack webhook processes payment | ✅ | `api/webhooks/paystack/route.ts` |
| Booking confirmed on deposit paid | ✅ | Webhook updates appointment status → `confirmed` |
| Payment status on invoice updated via webhook | ✅ | Webhook marks invoice `paid` |
| Payment provider abstraction | ✅ | `PaymentProvider` interface + `getPaymentProvider()` factory in `lib/payments/`; add new provider by implementing the interface |

---

## 8. Collections / Overdue Reminders (FR7)

| Feature | Status | Notes |
|---|---|---|
| Due today reminder | ✅ | `invoice_due` trigger in overdue cron |
| Overdue 1–3 days reminder | ✅ | `invoice_overdue_1_3` trigger, idempotent |
| Overdue 4–7 days reminder | ✅ | `invoice_overdue_4_7` trigger, firmer tone |
| Idempotency (no duplicate reminders) | ✅ | `reminder_sent_log` checked before every send |
| Manual pause reminders per client/invoice | ✅ | `reminders_paused` field + `toggleInvoiceRemindersPausedAction`, pause toggle on each invoice card |
| Promise-to-pay — record date, pause until then | ✅ | `promise_date` field + `setInvoicePromiseDateAction`, "Set Promise" button on invoice card |
| Overdue 8+ days escalation | ✅ | `invoice_overdue_8plus` trigger in overdue cron with urgent escalation message |

---

## 9. Dashboard (Section 12 of brief)

| View | Status | Notes |
|---|---|---|
| Today — appointments, pending deposits, cancellations | ✅ | Dashboard client shows today's agenda |
| Bookings — list + filters (status, date, staff, service) | ✅ | `bookings-client.tsx` with GenericTable |
| Invoices — filtered by status (draft/sent/overdue/paid etc.) | ✅ | `invoices-client.tsx` |
| Customers — search, phone, last booking, unpaid balance | ✅ | `customers-client.tsx` with GenericTable |
| Messages — inbound, bot replies, handoff queue | ✅ | `messages-client.tsx` |
| Settings — services, staff, hours, templates | ✅ | Full settings section |
| Unpaid invoices & overdue balances on dashboard | ✅ | KPI cards on dashboard |
| Recent WhatsApp activity feed | ✅ | `ActivityFeed` component on dashboard |
| Calendar / booking calendar view | ✅ | Week-view calendar with List/Week toggle; appointment blocks positioned by time slot |

---

## 10. Customer Profile (FR9)

| Feature | Status | Notes |
|---|---|---|
| View booking history | ✅ | Customer detail page |
| View invoice history | ✅ | Customer detail page |
| View message log | ✅ | Customer detail page |
| Customer notes | ✅ | Editable notes field |
| No-show tracking | ✅ | `markNoShowAction` + no-show icon button on confirmed/pending booking cards |
| Customer tags | ✅ | Tag chips in customer profile (add/remove on Enter), tag filter pills on customers list |

---

## 11. Non-Functional Requirements

| Requirement | Status | Notes |
|---|---|---|
| Setup in under 10 minutes | ✅ | Guided onboarding, sensible defaults |
| Idempotent reminders | ✅ | `reminder_sent_log` on all cron jobs |
| Idempotent booking (double-book prevention) | ✅ | Re-checked at confirmation step |
| Security — encrypt tokens, restrict by tenant | ✅ | `business_id` on all queries, RLS on Supabase |
| Audit logging | ✅ | `audit_logs` table, admin actions logged |
| Localization — timezone, currency, templates | ✅ | All time formatting is timezone-aware |
| Dashboard load < 2 seconds | ✅ | Server-rendered pages, minimal client waterfalls |
| Multi-tenant architecture | ✅ | All tables scoped to `business_id` |

---

## Summary

| Area | Done | Partial | Missing |
|---|---|---|---|
| Business setup | 6/6 | — | — |
| Service catalog | 5/5 | — | — |
| WhatsApp booking flow | 13/14 | 1 | — |
| Calendar | 4/5 | 1 | — |
| Reminders | 7/7 | — | — |
| Invoices | 9/9 | — | — |
| Payments | 4/4 | — | — |
| Collections | 6/6 | — | — |
| Dashboard | 9/9 | — | — |
| Customer profile | 6/6 | — | — |
| Non-functional | 8/8 | — | — |

---

## Remaining Work (Priority Order)

### High — blocks MVP acceptance criteria
1. ~~**Verify Google Calendar busy-time fetch**~~ ✅ Done — `getAvailableSlots()` calls FreeBusy API and merges Google busy slots with internal appointments
2. ~~**Manual partial payment UI**~~ ✅ Done — "Record Payment" modal on invoice cards accepts any amount
3. ~~**Human handoff "resume bot" control**~~ ✅ Done — "Release to Bot" button exists in Messages tab handoff queue

### All items complete ✅

All MVP features from the brief have been implemented.
