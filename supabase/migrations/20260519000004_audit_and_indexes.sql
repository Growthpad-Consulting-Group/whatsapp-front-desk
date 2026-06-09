-- ============================================================
-- Audit log table + additional performance indexes
-- All statements use IF NOT EXISTS — safe to re-run
-- ============================================================

-- ─── AUDIT LOGS ──────────────────────────────────────────────
create table if not exists public.audit_logs (
  id           uuid primary key default gen_random_uuid(),
  business_id  uuid not null references public.businesses(id) on delete cascade,
  event        text not null,
  reference_id uuid,
  details      jsonb not null default '{}',
  created_at   timestamptz not null default now()
);

create index if not exists idx_audit_logs_business    on public.audit_logs(business_id);
create index if not exists idx_audit_logs_event       on public.audit_logs(business_id, event);
create index if not exists idx_audit_logs_reference   on public.audit_logs(reference_id);
create index if not exists idx_audit_logs_created_at  on public.audit_logs(business_id, created_at desc);

alter table public.audit_logs enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'audit_logs' and policyname = 'audit_logs: read own business'
  ) then
    create policy "audit_logs: read own business"
      on public.audit_logs for select
      using (business_id = public.my_business_id());
  end if;
end $$;

-- ─── ADDITIONAL PERFORMANCE INDEXES ─────────────────────────

create index if not exists idx_appt_business_status
  on public.appointments(business_id, status);

create index if not exists idx_appt_business_payment_status
  on public.appointments(business_id, payment_status);

create index if not exists idx_invoices_business_due_status
  on public.invoices(business_id, due_date, status);

create index if not exists idx_msg_log_business_direction
  on public.message_logs(business_id, direction, timestamp desc);

create index if not exists idx_sessions_business_phone
  on public.conversation_sessions(business_id, customer_phone);

create index if not exists idx_reminder_log_lookup
  on public.reminder_sent_log(business_id, trigger, reference_id);

-- ─── GOOGLE CALENDAR EVENT ID ON APPOINTMENTS ────────────────
alter table public.appointments
  add column if not exists google_event_id text;

-- ─── ENCRYPTED TOKEN COLUMNS ON STAFF_MEMBERS ───────────────
alter table public.staff_members
  add column if not exists google_access_token  text,
  add column if not exists google_refresh_token text,
  add column if not exists google_token_expiry   timestamptz;

-- ─── PAYMENT PROMISE DATE ON INVOICES ────────────────────────
alter table public.invoices
  add column if not exists promise_date      date,
  add column if not exists reminders_paused boolean not null default false;
