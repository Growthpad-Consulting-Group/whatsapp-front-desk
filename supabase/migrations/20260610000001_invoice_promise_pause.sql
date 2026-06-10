-- Add promise-to-pay and reminders_paused fields to invoices
-- promise_date: date the customer promised to pay; pauses overdue sequence until this date
-- reminders_paused: manual override to stop all automated reminders for this invoice

alter table public.invoices
  add column if not exists promise_date date,
  add column if not exists reminders_paused boolean not null default false;

-- Extend reminder_sent_log trigger enum to include 8+ day overdue
-- (no schema change needed — trigger is stored as text with a check constraint)
-- Update check constraint on reminder_rules to allow new trigger type
alter table public.reminder_rules
  drop constraint if exists reminder_rules_trigger_check;

alter table public.reminder_rules
  add constraint reminder_rules_trigger_check
  check (trigger in (
    '24h_before',
    '2h_before',
    'booking_confirmed',
    'invoice_due',
    'invoice_overdue_1_3',
    'invoice_overdue_4_7',
    'invoice_overdue_8plus'
  ));

-- Same for reminder_sent_log
alter table public.reminder_sent_log
  drop constraint if exists reminder_sent_log_trigger_check;

-- reminder_sent_log uses a text column with no explicit check; no change needed.

comment on column public.invoices.promise_date is
  'Date the customer promised to pay. Overdue reminders are paused until this date passes.';

comment on column public.invoices.reminders_paused is
  'When true, all automated overdue reminders for this invoice are suppressed.';
